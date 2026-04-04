'use server'

import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getPendingVouchers(page = 1) {
  const take = 50
  const skip = (page - 1) * take

  // Buscamos los que tengan imagen y que NO estén verificados (solo false, ya no buscamos null)
  const vouchers = await prisma.vouchers.findMany({
    where: {
      file_path: { not: null },
      is_verified: false // <-- Aquí está el arreglo
    },
    take,
    skip,
    orderBy: { created_at: 'desc' },
    include: { companies: true }
  })

  const total = await prisma.vouchers.count({
    where: {
      file_path: { not: null },
      is_verified: false // <-- Y aquí también
    }
  })

  return { vouchers, total }
}

export async function getCompanies() {
  return await prisma.companies.findMany({
    orderBy: { name: 'asc' }
  })
}

export async function verifyVoucher(voucherId, data) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('No autorizado')

  // Verificamos por seguridad que siga siendo admin
  const perfil = await prisma.users.findUnique({
    where: { id: user.id },
    select: { is_admin: true }
  })

  if (!perfil?.is_admin) throw new Error('No tienes permisos de administrador')

  // Actualizamos el voucher con los datos corregidos
  await prisma.vouchers.update({
    where: { id: voucherId },
    data: {
      voucher_number: data.voucher_number,
      voucher_date: new Date(data.voucher_date),
      voucher_company_id: data.voucher_company_id,
      is_verified: true,
      verified_by: user.id,
      verified_at: new Date() 
    }
  })

  // Refrescamos la ruta para que desaparezca de la lista
  revalidatePath('/dashboard/admin/voucher-verify')
  return { success: true }
}