export const runtime = 'nodejs'

import prisma from '@/lib/prisma'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import AnalysisForm from './AnalysisForm'

export const metadata = {
  title: 'Planillas disponibles | VanCheck',
};

export default async function AnalysisModelPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <div className="container mt-5 text-center">No estás logueado.</div>
  }

  const userSpreadsheets = await prisma.spreadsheets.findMany({
    where: { user_id: user.id },
    orderBy: { created_at: 'desc' }
  })

  return (
    <main className="container py-5" style={{ maxWidth: '800px' }}>
      
      <header className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
        <h1 className="display-6 fw-bold text-dark m-0">Nuevo Análisis</h1>
        <Link href="/dashboard/analysis" className="btn btn-outline-dark fw-medium px-4">
          Volver
        </Link>
      </header>

      <section>
        <p className="text-muted mb-4">
          Determina que pagos no estás recibiendo, este análisis detalla cada error en tu planilla.
        </p>

        <AnalysisForm spreadsheets={userSpreadsheets} />
      </section>

    </main>
  )
}