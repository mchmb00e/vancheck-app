'use server'

import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { DocumentProcessorServiceClient } from '@google-cloud/documentai'
import { revalidatePath } from 'next/cache'
import { logAuditAction } from '@/app/actions/logs'

const getDocumentAiClient = () => {
  return new DocumentProcessorServiceClient({
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    credentials: {
      client_email: process.env.GCP_CLIENT_EMAIL,
      private_key: process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }
  })
}

const cleanText = (str) => {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
}

const GLOBAL_ALIAS_MAP = {
  'RBU': ['redbus', 'red bus', 'red_bus', 'lo echevers', 'echevers'],
  'REDSUPPORT': ['red support', 'red_support'],
  'AGUNSA': ['agunsa_aeropuerto', 'agunsa_ae', 'agunsa_aer'],
  'ACCIONA': ['acciona_corporativo', 'acciona_rampa', 'acciona', 'acciona_aeropue', 'acciona_aeropuerto'],
  'LATAM': [
    'latam',
    'trip_aeropuerto', 'trip_aero', 'trip_aerop', 'tripulacion',
    'base aerof', 'base aerop', 'base aerot', 'base', 'base aeropuerto'
  ],
  'SODEXO': ['sodexo', 'lab mintlab', 'lab mintl', 'lab mintla']
}

export async function submitVoucher(formData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No estás autorizado')
  }

  const isManual = formData.get('isManual') === 'true'
  const vehicle_id = formData.get('vehicle_id')?.toString()

  if (!vehicle_id) {
    throw new Error('Debe seleccionar un vehículo asociado.')
  }

  if (isManual) {
    const id = crypto.randomUUID()
    const dateInput = formData.get('date')?.toString()
    const identifier = formData.get('identifier')?.toString().trim() || 'POR_REVISAR'
    const companyId = formData.get('company_id')?.toString()

    await prisma.vouchers.create({
      data: {
        id: id,
        voucher_number: identifier,
        voucher_date: new Date(dateInput),
        voucher_company_id: companyId,
        vehicle_id: vehicle_id,
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

  const compressedFile = files[0]
  const highResFile = formData.get('highResImage') || compressedFile

  if (!compressedFile.type.startsWith('image/')) {
    throw new Error('El archivo seleccionado no es una imagen válida.')
  }

  const voucherId = crypto.randomUUID()
  const ext = compressedFile.name.split('.').pop()
  const fileName = `${voucherId}.${ext}`
  const filePath = `vouchers/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('vancheck-bucket')
    .upload(filePath, compressedFile)

  if (uploadError) {
    throw new Error('No se pudo subir la imagen al bucket')
  }

  const arrayBuffer = await highResFile.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const encodedImage = buffer.toString('base64')

  const documentAiClient = getDocumentAiClient()
  const name = `projects/${process.env.GOOGLE_CLOUD_PROJECT_ID}/locations/${process.env.GOOGLE_DOCUMENT_AI_LOCATION}/processors/${process.env.GOOGLE_DOCUMENT_AI_PROCESSOR_ID}`

  const request = {
    name,
    rawDocument: {
      content: encodedImage,
      mimeType: highResFile.type,
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

  const ocrLimpio = cleanText(text)

  for (const comp of companies) {
    const palabrasABuscar = GLOBAL_ALIAS_MAP[comp.name] || [cleanText(comp.name)]
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
      voucher_company_id: companyId || companies[0]?.id,
      vehicle_id: vehicle_id
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
    const dateInput = formData?.get('date')?.toString()
    const identifier = formData?.get('identifier')?.toString().trim() || 'POR_REVISAR'
    const companyId = formData?.get('company_id')?.toString()
    
    await prisma.vouchers.update({
      where: { id },
      data: {
        ai_success: false,
        voucher_number: identifier,
        voucher_date: new Date(dateInput),
        voucher_company_id: companyId
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
  } catch (error) {
    console.error(`[Error Rollback] Falló la eliminación del voucher ${id}:`, error)
    await logAuditAction(user?.id, false, `voucher rollback failed for ${id}`)
    return { success: false, error: 'Hubo un error al intentar cancelar y borrar el archivo.' }
  }

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
  
  const dateInput = formData.get('date')?.toString()
  const identifier = formData.get('identifier')?.toString().trim() || 'POR_REVISAR'
  const companyId = formData.get('company_id')?.toString()
  const vehicleId = formData.get('vehicle_id')?.toString()

  await prisma.vouchers.update({
    where: { id },
    data: {
      voucher_number: identifier,
      voucher_date: new Date(dateInput),
      voucher_company_id: companyId,
      vehicle_id: vehicleId 
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

export async function processSingleMassiveVoucher(formData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No estás autorizado')

  const compressedFile = formData.get('file')
  const highResFile = formData.get('highResFile') || compressedFile
  const vehicle_id = formData.get('vehicle_id')?.toString()
  
  if (!compressedFile || compressedFile.size === 0) throw new Error('Archivo inválido')
  if (!vehicle_id) throw new Error('Falta el vehículo asociado')

  const voucherId = crypto.randomUUID()
  const ext = compressedFile.name.split('.').pop()
  const filePath = `vouchers/${voucherId}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('vancheck-bucket')
    .upload(filePath, compressedFile)
  if (uploadError) throw new Error('Error al subir imagen')

  const arrayBuffer = await highResFile.arrayBuffer()
  const encodedImage = Buffer.from(arrayBuffer).toString('base64')

  const documentAiClient = getDocumentAiClient()
  const name = `projects/${process.env.GOOGLE_CLOUD_PROJECT_ID}/locations/${process.env.GOOGLE_DOCUMENT_AI_LOCATION}/processors/${process.env.GOOGLE_DOCUMENT_AI_PROCESSOR_ID}`

  const request = {
    name,
    rawDocument: { content: encodedImage, mimeType: highResFile.type }
  }

  const [result] = await documentAiClient.processDocument(request)
  const text = result.document.text

  const idMatch = text.match(/\bID\b[\s\n\t]*:?[\s\n\t]*([A-Za-z0-9\-]+)/i)
  const extractedId = idMatch ? idMatch[1] : ''

  const dateMatch = text.match(/(\d{2})\s*[\/\-]\s*(\d{2})\s*[\/\-]\s*(\d{4})/)
  let extractedDate = new Date() 
  let dateFound = false 

  if (dateMatch) {
    extractedDate = new Date(`${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}T12:00:00Z`)
    dateFound = true
  }

  const companies = await prisma.companies.findMany()
  let companyId = companies[0]?.id 

  const ocrLimpio = cleanText(text)

  for (const comp of companies) {
    const palabrasABuscar = GLOBAL_ALIAS_MAP[comp.name] || [cleanText(comp.name)]
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
      voucher_company_id: companyId,
      vehicle_id: vehicle_id,
      ai_success: false 
    }
  })

  return {
    success: true,
    dbId: voucherId,
    extractedId: extractedId || '',
    extractedDate: dateFound ? extractedDate.toISOString().split('T')[0] : '',
    companyId: companyId,
    vehicleId: vehicle_id
  }
}

export async function confirmMassiveBatch(vouchersData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')

  try {
    for (const v of vouchersData) {
      if (!v.extractedId || v.extractedId.trim() === '') {
        return { success: false, error: 'Hay vouchers sin ID de viaje. Por favor, revisa los campos en rojo.' }
      }
      if (!v.extractedDate || v.extractedDate.trim() === '') {
        return { success: false, error: 'Hay vouchers sin Fecha. Por favor, revisa los campos en amarillo.' }
      }
    }

    const chunkSize = 50;
    
    for (let i = 0; i < vouchersData.length; i += chunkSize) {
      const chunk = vouchersData.slice(i, i + chunkSize);
      
      const updatePromises = chunk.map(v => 
        prisma.vouchers.update({
          where: { id: v.dbId, user_id: user.id },
          data: {
            voucher_number: v.extractedId.trim(),
            voucher_date: new Date(`${v.extractedDate}T12:00:00Z`),
            voucher_company_id: v.companyId,
            vehicle_id: v.vehicleId, 
            ai_success: true 
          }
        })
      );
      
      await Promise.all(updatePromises);
    }

    await logAuditAction(user.id, true, `confirm massive batch ${vouchersData.length} vouchers`)
    
    return { success: true }
  } catch (error) {
    await logAuditAction(user.id, false, `confirm massive batch`)
    throw error
  }
}