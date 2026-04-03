'use server'

import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createVehicle(formData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('No estás autorizado')

  const name = formData.get('name').trim()
  const patent = formData.get('patent').trim().toUpperCase()

  if (!name || !patent) throw new Error('Faltan datos obligatorios')

  // Validamos que no exista el mismo nombre o patente para ESTE usuario
  const existingVehicle = await prisma.vehicles.findFirst({
    where: {
      user_id: user.id,
      OR: [
        { name: name },
        { patent: patent }
      ]
    }
  })

  if (existingVehicle) {
    throw new Error('Ya tienes un vehículo registrado con ese mismo apodo o patente.')
  }

  await prisma.vehicles.create({
    data: {
      name,
      patent,
      user_id: user.id
    }
  })

  revalidatePath('/dashboard/vehicle')
  return { success: true }
}

export async function updateVehicle(id, formData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No estás autorizado')

  const name = formData.get('name').trim()
  const patent = formData.get('patent').trim().toUpperCase()

  // Revisar duplicados excluyendo el vehículo actual
  const existingVehicle = await prisma.vehicles.findFirst({
    where: {
      user_id: user.id,
      id: { not: id },
      OR: [{ name: name }, { patent: patent }]
    }
  })

  if (existingVehicle) {
    throw new Error('El apodo o patente ya está en uso por otro de tus vehículos.')
  }

  await prisma.vehicles.update({
    where: { id },
    data: { name, patent }
  })

  revalidatePath('/dashboard/vehicle')
  return { success: true }
}

export async function deleteVehicle(id) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No estás autorizado')

  // Ojo aquí: si el vehículo tiene vouchers o planillas, esto tirará error a menos que lo manejes.
  await prisma.vehicles.delete({
    where: { id }
  })

  revalidatePath('/dashboard/vehicle')
  return { success: true }
}