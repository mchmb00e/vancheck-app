'use server'

import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { logAuditAction } from '@/app/actions/logs'

export async function uploadSpreadsheet(formData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('No estás autorizado')

  const file = formData.get('file')
  const name = formData.get('name')
  // Rescatamos el vehicle_id, si viene vacío lo dejamos como null
  const vehicle_id = formData.get('vehicle_id') || null 

  if (!file || file.size === 0 || !name) {
    throw new Error('Faltan datos obligatorios')
  }

  const id = crypto.randomUUID()
  const filePath = `spreadsheets/${id}.pdf`

  try {
    const { error: uploadError } = await supabase.storage
      .from('vancheck-bucket')
      .upload(filePath, file)

    if (uploadError) throw new Error('Error al subir el PDF')

    await prisma.spreadsheets.create({
      data: {
        id,
        name,
        file_url: filePath,
        user_id: user.id,
        vehicle_id: vehicle_id
      }
    })

    await logAuditAction(user.id, true, `upload spreadsheet ${name}`)
    revalidatePath('/dashboard/spreadsheet')
    return { success: true }
  } catch (error) {
    await logAuditAction(user.id, false, `upload spreadsheet ${name}`)
    throw error
  }
}

// Actualiza nombre y vehículo al mismo tiempo
export async function updateSpreadsheet(id, newName, newVehicleId) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  try {
    await prisma.spreadsheets.update({
      where: { id },
      data: { 
        name: newName,
        vehicle_id: newVehicleId || null
      }
    })

    await logAuditAction(user.id, true, `update spreadsheet ${newName}`)
    revalidatePath('/dashboard/spreadsheet')
  } catch (error) {
    await logAuditAction(user.id, false, `update spreadsheet ${newName}`)
    throw error
  }
}

export async function deleteSpreadsheet(id, filePath) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  try {
    const spreadsheet = await prisma.spreadsheets.findUnique({
      where: { id },
      select: { name: true }
    })

    // ✨ SOLUCIÓN: Primero eliminamos los análisis vinculados a esta planilla
    // para evitar el error de Foreign Key (P2003)
    await prisma.analysis.deleteMany({ 
      where: { spreadsheet_id: id } 
    })

    // Ahora sí, eliminamos la planilla tranquilamente
    await prisma.spreadsheets.delete({ where: { id } })
    await supabase.storage.from('vancheck-bucket').remove([filePath])
    
    await logAuditAction(user.id, true, `delete spreadsheet ${spreadsheet?.name}`)
    revalidatePath('/dashboard/spreadsheet')
  } catch (error) {
    await logAuditAction(user.id, false, 'delete spreadsheet')
    throw error
  }
}

export async function replaceSpreadsheetFile(id, oldFilePath, formData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const newFile = formData.get('file')

  if (!newFile || newFile.size === 0) throw new Error('Archivo inválido')

  const newFileId = crypto.randomUUID()
  const newFilePath = `spreadsheets/${newFileId}.pdf`

  try {
    const spreadsheet = await prisma.spreadsheets.findUnique({
      where: { id },
      select: { name: true }
    })

    const { error: uploadError } = await supabase.storage
      .from('vancheck-bucket')
      .upload(newFilePath, newFile)

    if (uploadError) throw new Error('No se pudo subir el archivo nuevo')

    await prisma.spreadsheets.update({
      where: { id },
      data: { file_url: newFilePath }
    })

    await supabase.storage.from('vancheck-bucket').remove([oldFilePath])

    await logAuditAction(user.id, true, `replace spreadsheet file ${spreadsheet?.name}`)
    revalidatePath('/dashboard/spreadsheet')
    return { success: true }
  } catch (error) {
    await logAuditAction(user.id, false, 'replace spreadsheet file')
    throw error
  }
}