export const runtime = 'nodejs'

import prisma from '@/lib/prisma'
import MassiveClient from './MassiveClient'

export const metadata = {
  title: 'Carga Masiva | VanCheck',
}

export const maxDuration = 60;

export default async function MassiveVoucherPage() {
  // Traemos los mundos al tiro en el servidor para el <select>
  const companies = await prisma.companies.findMany({
    orderBy: { name: 'asc' }
  })

  return <MassiveClient companies={companies} />
}