export const runtime = 'nodejs'

import prisma from '@/lib/prisma'
import Link from 'next/link'
import VoucherList from './VoucherList'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Gestionar Vouchers | VanCheck',
};

export default async function ManageVouchersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [companies, userVouchers] = await Promise.all([
    prisma.companies.findMany({
      orderBy: { name: 'asc' }
    }),
    prisma.vouchers.findMany({
      where: { user_id: user?.id },
      include: { companies: true },
      orderBy: { voucher_date: 'desc' }
    })
  ])

  return (
    <main className="container py-5" style={{ maxWidth: '900px' }}>
      
      <header className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
        <h1 className="display-6 fw-bold text-dark m-0">Mis Vouchers</h1>
        
        <Link href="/dashboard/voucher" className="btn btn-outline-dark fw-medium px-4">
          Volver
        </Link>
      </header>

      <section>
        <p className="text-muted mb-4">
          Administra, edita o elimina los registros y fotos de tus viajes.
        </p>
        
        <VoucherList initialVouchers={userVouchers} companies={companies} />
      </section>

    </main>
  )
}