export const runtime = 'nodejs'

import prisma from '@/lib/prisma'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import SpreadsheetForm from './SpreadsheetForm'
import SpreadsheetList from './SpreadsheetList'

export const metadata = {
  title: 'Mis planillas | VanCheck',
};

export default async function SpreadsheetPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 1. Traemos los vehículos del usuario
  const userVehicles = await prisma.vehicles.findMany({
    where: { user_id: user?.id },
    orderBy: { name: 'asc' }
  })

  // 2. Traemos las planillas del usuario, incluyendo el vehículo asignado
  const userSpreadsheets = await prisma.spreadsheets.findMany({
    where: { user_id: user?.id },
    orderBy: { created_at: 'desc' },
    include: { vehicles: true } 
  })

  // Usamos Promise.all porque createSignedUrl es asíncrono
  const spreadsheetsWithUrls = await Promise.all(
    userSpreadsheets.map(async (sheet) => {
      const { data, error } = await supabase.storage
        .from('vancheck-bucket')
        .createSignedUrl(sheet.file_url, 3600)

      if (error) {
        console.error('Error firmando URL para:', sheet.file_url, error)
      }

      return {
        ...sheet,
        publicUrl: data?.signedUrl || '#' 
      }
    })
  )

  return (
    <main className="container py-5" style={{ maxWidth: '900px' }}>
      
      <header className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
        <h1 className="display-6 fw-bold text-dark m-0">Planillas</h1>
        
        <Link href="/dashboard" className="btn btn-outline-dark fw-medium px-4">
          Volver
        </Link>
      </header>

      <section>
        <p className="text-muted fs-5">
          Registra tus planillas de pago y ten una vista clara de los pagos que recibes.
        </p>

        <Link href="/dashboard/user-guide" className="fw-medium mb-4 d-inline-block" replace={false}>
          ¿Cómo se debe ver una planilla de pagos?
        </Link>

        {/* Le pasamos los vehículos al formulario */}
        <SpreadsheetForm vehicles={userVehicles} />
        
        {/* Le pasamos las planillas y los vehículos a la lista */}
        <SpreadsheetList initialSpreadsheets={spreadsheetsWithUrls} vehicles={userVehicles} />
      </section>

    </main>
  )
}