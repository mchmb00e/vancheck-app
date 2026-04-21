'use server'

import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getPendingVouchers(page = 1, filters = {}) {
  const take = 50
  const skip = (page - 1) * take

  const { search, companyId, userId } = filters

  // Armamos el WHERE dinámico
  const where = {
    file_path: { not: null },
    is_verified: false
  }

  if (search) {
    where.voucher_number = { contains: search, mode: 'insensitive' }
  }
  if (companyId) {
    where.voucher_company_id = companyId
  }
  if (userId) {
    where.user_id = userId
  }

  const vouchers = await prisma.vouchers.findMany({
    where,
    take,
    skip,
    orderBy: { created_at: 'desc' },
    include: { companies: true }
  })

  const total = await prisma.vouchers.count({
    where
  })

  return { vouchers, total }
}

// ✨ NUEVA FUNCIÓN: Trae la data de los filtros al tiro
export async function getAdminFiltersData() {
  // Traemos las empresas con el contador de vouchers pendientes
  const companies = await prisma.companies.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: {
          vouchers: {
            where: { file_path: { not: null }, is_verified: false }
          }
        }
      }
    }
  })

  // Traemos a los usuarios que tengan al menos 1 voucher pendiente para no llenar el select de basura
  const users = await prisma.users.findMany({
    where: {
      vouchers: {
        some: { file_path: { not: null }, is_verified: false }
      }
    },
    select: {
      id: true,
      name: true,
      last_name: true,
      rut: true
    },
    orderBy: { name: 'asc' }
  })

  return { companies, users }
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