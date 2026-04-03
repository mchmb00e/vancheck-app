export const runtime = 'nodejs'

import prisma from '@/lib/prisma'
import Link from 'next/link'
import VoucherForm from './VoucherForm'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Añadir Voucher | VanCheck',
};

export const maxDuration = 60;

export default async function IndividualVoucherPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [companies, vehicles] = await Promise.all([
    prisma.companies.findMany({
      orderBy: { name: 'asc' }
    }),
    prisma.vehicles.findMany({
      where: { user_id: user?.id },
      orderBy: { name: 'asc' }
    })
  ])

  return (
    <main className="container py-5" style={{ maxWidth: '900px' }}>
      
      <header className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
        <h1 className="display-6 fw-bold text-dark m-0">Añadir Voucher</h1>
        
        <Link href="/dashboard/voucher" className="btn btn-outline-dark fw-medium px-4">
          Volver
        </Link>
      </header>

      <section>
        <p className="text-muted mb-4">
          Registra un viaje subiendo la foto del comprobante o ingresando los datos manualmente.
        </p>
        <Link href="/dashboard/user-guide" className="fw-medium mb-4 d-inline-block" replace={false}>
          ¿Cómo se debe ver un voucher?
        </Link>
        <VoucherForm companies={companies} vehicles={vehicles} />
      </section>

    </main>
  )
}