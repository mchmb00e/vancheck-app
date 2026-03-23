export const runtime = 'nodejs'

import prisma from '@/lib/prisma'
import Link from 'next/link'
import VoucherForm from './VoucherForm'

export const metadata = {
  title: 'Añadir Voucher | VanCheck',
};

export const maxDuration = 60;


export default async function IndividualVoucherPage() {
  const companies = await prisma.companies.findMany({
    orderBy: { name: 'asc' }
  })

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

        <VoucherForm companies={companies} />
      </section>

    </main>
  )
}