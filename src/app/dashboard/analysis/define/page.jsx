export const runtime = 'nodejs'

import prisma from '@/lib/prisma'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DefineForm from './DefineForm'

export const metadata = {
  title: 'Configuración | VanCheck',
};

export default async function DefineAnalysisPage({ searchParams }) {
  const params = await searchParams
  const spreadsheetId = params?.id
  
  if (!spreadsheetId) {
    redirect('/dashboard/analysis/model')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger shadow-sm text-center border-0 animate__animated animate__headShake" role="alert">
          <h4 className="alert-heading fw-bold">¡Acceso denegado!</h4>
          <p className="mb-0">No pudimos verificar tu sesión. Por favor, ingresa a tu cuenta para continuar.</p>
          <hr />
          <Link href="/login" className="btn btn-danger btn-sm px-4">Ir al Login</Link>
        </div>
      </div>
    )
  }

  const spreadsheet = await prisma.spreadsheets.findUnique({
    where: { id: spreadsheetId }
  })

  if (!spreadsheet || spreadsheet.user_id !== user.id) {
    redirect('/dashboard/analysis/model')
  }

  // Traer mundos excluyendo los solicitados
  const companies = await prisma.companies.findMany({
    where: {
      name: { notIn: ['BASE AEROPUERTO', 'TRIPULACION'] }
    },
    orderBy: { name: 'asc' }
  })

  return (
    <main className="container py-5" style={{ maxWidth: '800px' }}>
      <header className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
        <h1 className="display-6 fw-bold text-dark m-0">Definir Parámetros</h1>
        <Link href="/dashboard/analysis/model" className="btn btn-outline-dark fw-medium px-4">
          Volver
        </Link>
      </header>

      <section>
        <div className="alert alert-info border-0 shadow-sm mb-4">
          Estás configurando el análisis para la planilla: <strong>{spreadsheet.name}</strong>
        </div>
        
        <DefineForm spreadsheetId={spreadsheet.id} companies={companies} />
      </section>
    </main>
  )
}