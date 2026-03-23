'use server'

import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { DocumentProcessorServiceClient } from '@google-cloud/documentai'
import { revalidatePath } from 'next/cache'
import { logAuditAction } from '@/app/actions/logs'


const documentAiClient = new DocumentProcessorServiceClient({
  credentials: {
    client_email: process.env.GCP_CLIENT_EMAIL,
    private_key: process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }
})

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
    ],
    'SODEXO': ['sodexo', 'lab mintlab', 'lab mintl', 'lab mintla']
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

// ✨ NUEVA ACCIÓN: Procesa un voucher individual pero optimizado para el lote masivo
export async function processSingleMassiveVoucher(formData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No estás autorizado')

  const file = formData.get('file')
  if (!file || file.size === 0) throw new Error('Archivo inválido')

  const voucherId = crypto.randomUUID()
  const ext = file.name.split('.').pop()
  const filePath = `vouchers/${voucherId}.${ext}`

  // 1. Subir a Supabase
  const { error: uploadError } = await supabase.storage
    .from('vancheck-bucket')
    .upload(filePath, file)
  if (uploadError) throw new Error('Error al subir imagen')

  // 2. OCR con Google Document AI
  const arrayBuffer = await file.arrayBuffer()
  const encodedImage = Buffer.from(arrayBuffer).toString('base64')

  const documentAiClient = new DocumentProcessorServiceClient()
  const name = `projects/${process.env.GOOGLE_CLOUD_PROJECT_ID}/locations/${process.env.GOOGLE_DOCUMENT_AI_LOCATION}/processors/${process.env.GOOGLE_DOCUMENT_AI_PROCESSOR_ID}`

  const request = {
    name,
    rawDocument: { content: encodedImage, mimeType: file.type }
  }

  const [result] = await documentAiClient.processDocument(request)
  const text = result.document.text


  // 3.
  const idMatch = text.match(/\bID\b[\s\n\t]*:?[\s\n\t]*([A-Za-z0-9\-]+)/i)
  const extractedId = idMatch ? idMatch[1] : ''

  const dateMatch = text.match(/(\d{2})\s*[\/\-]\s*(\d{2})\s*[\/\-]\s*(\d{4})/)
  let extractedDate = new Date() // Seguimos usando la de hoy para el registro preliminar de Prisma
  let dateFound = false // ✨ NUEVO: Bandera para saber si el OCR realmente la pilló

  if (dateMatch) {
    extractedDate = new Date(`${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}T12:00:00Z`)
    dateFound = true
  }

  // 4. Buscar Mundo (Usando la lógica de LATAM unificada)
  const companies = await prisma.companies.findMany()
  let companyId = companies[0]?.id // Por defecto el primero

  const cleanText = (str) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
  const ocrLimpio = cleanText(text)

  const aliasMap = {
    'RBU': ['redbus', 'red bus', 'red_bus'],
    'REDSUPPORT': ['red support', 'red_support'],
    'AGUNSA': ['agunsa_aeropuerto', 'agunsa_ae', 'agunsa_aer'],
    'ACCIONA': ['acciona_corporativo', 'acciona_rampa', 'acciona', 'acciona_aeropue'],
    'LATAM': ['trip_aeropuerto', 'trip_aero', 'trip_aerop', 'base aerof', 'base aerop', 'base aerot', 'base', 'tripulacion', 'base aeropuerto', 'latam'],
  }

  for (const comp of companies) {
    const palabrasABuscar = aliasMap[comp.name] || [cleanText(comp.name)]
    if (palabrasABuscar.some(alias => ocrLimpio.includes(alias))) {
      companyId = comp.id
      break
    }
  }

  // 5. Guardar registro preliminar en la BD
  await prisma.vouchers.create({
    data: {
      id: voucherId,
      user_id: user.id,
      file_path: filePath,
      voucher_number: extractedId || 'POR_REVISAR',
      voucher_date: extractedDate,
      voucher_company_id: companyId,
      ai_success: false // Falso hasta que el usuario lo confirme
    }
  })

  return {
    success: true,
    dbId: voucherId,
    extractedId: extractedId || '',
    // ✨ CAMBIO: Si no encontró la fecha, devolvemos un string vacío al front
    extractedDate: dateFound ? extractedDate.toISOString().split('T')[0] : '',
    companyId: companyId
  }
}

// ✨ NUEVA ACCIÓN: Guarda todos los cambios finales de la tabla de revisión masiva
// ✨ NUEVA ACCIÓN: Guarda todos los cambios finales de la tabla de revisión masiva
export async function confirmMassiveBatch(vouchersData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')

  try {
    // 🛡️ CANDADO BACKEND: Revisamos uno por uno antes de tocar la base de datos
    for (const v of vouchersData) {
      if (!v.extractedId || v.extractedId.trim() === '') {
        return { success: false, error: 'Hay vouchers sin ID de viaje. Por favor, revisa los campos en rojo.' }
      }
      if (!v.extractedDate || v.extractedDate.trim() === '') {
        return { success: false, error: 'Hay vouchers sin Fecha. Por favor, revisa los campos en amarillo.' }
      }
    }

    // Si todo está impeque, actualizamos todos los registros en paralelo
    const updatePromises = vouchersData.map(v => 
      prisma.vouchers.update({
        where: { id: v.dbId, user_id: user.id },
        data: {
          voucher_number: v.extractedId,
          voucher_date: new Date(`${v.extractedDate}T12:00:00Z`),
          voucher_company_id: v.companyId,
          ai_success: true // Marcamos como revisado/exitoso
        }
      })
    )
    
    await Promise.all(updatePromises)
    await logAuditAction(user.id, true, `confirm massive batch ${vouchersData.length} vouchers`)
    
    return { success: true }
  } catch (error) {
    await logAuditAction(user.id, false, `confirm massive batch`)
    throw error
  }
}