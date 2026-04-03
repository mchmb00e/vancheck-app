export const runtime = 'nodejs'

import prisma from '@/lib/prisma'
import MassiveClient from './MassiveClient'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Carga Masiva | VanCheck',
}

export const maxDuration = 60;

export default async function MassiveVoucherPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [companies, vehicles] = await Promise.all([
    prisma.companies.findMany({ orderBy: { name: 'asc' } }),
    prisma.vehicles.findMany({ where: { user_id: user?.id }, orderBy: { name: 'asc' } })
  ])

  return <MassiveClient companies={companies} vehicles={vehicles} />
}