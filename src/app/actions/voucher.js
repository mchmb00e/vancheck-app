'use server'

import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { DocumentProcessorServiceClient } from '@google-cloud/documentai'
import { revalidatePath } from 'next/cache'
import { logAuditAction } from '@/app/actions/logs'

/* Módulo de gestión de vouchers: controla la carga manual y automática mediante OCR (Document AI), validación de duplicados, edición, eliminación y auditoría de acciones. */

const documentAiClient = new DocumentProcessorServiceClient()

export async function submitVoucher(formData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No estás autorizado')
  }

  const isManual = formData.get('isManual') === 'true'

  if (isManual) {
    const id = crypto.randomUUID()
    const dateInput = formData.get('date')

    await prisma.vouchers.create({
      data: {
        id: id,
        voucher_number: formData.get('identifier'),
        voucher_date: new Date(dateInput),
        voucher_company_id: formData.get('company_id'),
        user_id: user.id
      }
    })

    await logAuditAction(user.id, true, `upload voucher ${id}`)
    return { success: true, message: 'El voucher ha sido subido correctamente.' }
  }

  const files = formData.getAll('voucherImage')

  if (files.length === 0 || files[0].size === 0) {
    throw new Error('Falta la imagen del voucher')
  }

  if (files.length > 1) {
    throw new Error('Solo puedes subir una imagen a la vez.')
  }

  const file = files[0]

  if (!file.type.startsWith('image/')) {
    throw new Error('El archivo seleccionado no es una imagen válida.')
  }

  const voucherId = crypto.randomUUID()
  const ext = file.name.split('.').pop()
  const fileName = `${voucherId}.${ext}`
  const filePath = `vouchers/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('vancheck-bucket')
    .upload(filePath, file)

  if (uploadError) {
    throw new Error('No se pudo subir la imagen al bucket')
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const encodedImage = buffer.toString('base64')

  const name = `projects/${process.env.GOOGLE_CLOUD_PROJECT_ID}/locations/${process.env.GOOGLE_DOCUMENT_AI_LOCATION}/processors/${process.env.GOOGLE_DOCUMENT_AI_PROCESSOR_ID}`

  const request = {
    name,
    rawDocument: {
      content: encodedImage,
      mimeType: file.type,
    }
  }

  const [result] = await documentAiClient.processDocument(request)
  const text = result.document.text

  const idMatch = text.match(/\bID\b[\s\n\t]*:?[\s\n\t]*([A-Za-z0-9\-]+)/i)
  const extractedId = idMatch ? idMatch[1] : null

  let isDuplicate = false
  if (extractedId) {
    const existingVoucher = await prisma.vouchers.findFirst({
      where: {
        voucher_number: extractedId,
        user_id: user.id
      }
    })

    if (existingVoucher) {
      isDuplicate = true
      await logAuditAction(user.id, true, `duplicate voucher ${extractedId}`)
    }
  }

  const dateMatch = text.match(/(\d{2})\s*[\/\-]\s*(\d{2})\s*[\/\-]\s*(\d{4})/)
  let extractedDate;

  if (dateMatch) {
    extractedDate = new Date(`${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}T12:00:00Z`)
  } else {
    const hoy = new Date()
    extractedDate = new Date(`${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}T12:00:00Z`)
  }

  const companies = await prisma.companies.findMany()
  let companyId = null

  const cleanText = (str) => {
    return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
  }

  const ocrLimpio = cleanText(text)

  const aliasMap = {
    'RBU': ['redbus', 'red bus', 'red_bus'],
    'REDSUPPORT': ['red support', 'red_support'],
    'AGUNSA': ['agunsa_aeropuerto', 'agunsa_ae', 'agunsa_aer'],
    'ACCIONA': ['acciona_corporativo', 'acciona_rampa', 'acciona', 'acciona_aeropue', 'acciona_aeropuerto'],
    'LATAM': [
      'latam',
      'trip_aeropuerto', 'trip_aero', 'trip_aerop', 'tripulacion',
      'base aerof', 'base aerop', 'base aerot', 'base', 'base aeropuerto'
    ]
  }

  for (const comp of companies) {
    const palabrasABuscar = aliasMap[comp.name] || [cleanText(comp.name)]
    if (palabrasABuscar.some(alias => ocrLimpio.includes(alias))) {
      companyId = comp.id
      break
    }
  }

  await prisma.vouchers.create({
    data: {
      id: voucherId,
      user_id: user.id,
      file_path: filePath,
      voucher_number: extractedId || 'POR_REVISAR',
      voucher_date: extractedDate,
      voucher_company_id: companyId || companies[0]?.id
    }
  })

  await logAuditAction(user.id, true, `upload voucher ${voucherId}`)

  if (isDuplicate) {
    redirect(`/dashboard/voucher/result?id=${voucherId}&duplicate=true`)
  } else {
    redirect(`/dashboard/voucher/result?id=${voucherId}`)
  }
}

export async function confirmVoucherResult(id, isCorrect, formData = null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (isCorrect) {
    await prisma.vouchers.update({
      where: { id },
      data: { ai_success: true }
    })
    await logAuditAction(user.id, true, 'confirm Document AI Scan')
  } else {
    const dateInput = formData.get('date')
    await prisma.vouchers.update({
      where: { id },
      data: {
        ai_success: false,
        voucher_number: formData.get('identifier'),
        voucher_date: new Date(dateInput),
        voucher_company_id: formData.get('company_id')
      }
    })
    await logAuditAction(user.id, true, 'manual fix Document AI Scan')
  }
  redirect('/dashboard/voucher')
}

export async function cancelAndRollbackVoucher(id, filePath) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  try {
    const v = await prisma.vouchers.findUnique({ where: { id }, select: { voucher_number: true } })

    await prisma.vouchers.delete({ where: { id } })

    if (filePath) {
      await supabase.storage.from('vancheck-bucket').remove([filePath])
    }

    await logAuditAction(user.id, true, `voucher rollback ${v?.voucher_number}`)
  } catch (error) { }

  redirect('/dashboard/voucher')
}

export async function deleteVoucherRecord(id, filePath) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const v = await prisma.vouchers.findUnique({ where: { id }, select: { voucher_number: true } })
  await prisma.vouchers.delete({ where: { id } })

  if (filePath) {
    await supabase.storage.from('vancheck-bucket').remove([filePath])
  }

  await logAuditAction(user.id, true, `delete voucher ${id} and ${v?.voucher_number}`)
  revalidatePath('/dashboard/voucher')
}

export async function updateVoucherRecord(id, formData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const dateInput = formData.get('date')

  await prisma.vouchers.update({
    where: { id },
    data: {
      voucher_number: formData.get('identifier'),
      voucher_date: new Date(dateInput),
      voucher_company_id: formData.get('company_id')
    }
  })

  await logAuditAction(user.id, true, `update voucher ${id}`)
  revalidatePath('/dashboard/voucher')
}

export async function getVoucherImageUrl(filePath) {
  if (!filePath) return null;
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const voucher = await prisma.vouchers.findFirst({ where: { file_path: filePath }, select: { id: true } })

  const { data, error } = await supabase.storage
    .from('vancheck-bucket')
    .createSignedUrl(filePath, 60)

  if (!error && data) {
    await logAuditAction(user.id, true, `view voucher image ${voucher?.id}`)
    return data.signedUrl
  }
  return null
}