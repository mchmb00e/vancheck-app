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

  // Traemos las planillas del usuario
  const userSpreadsheets = await prisma.spreadsheets.findMany({
    where: { user_id: user?.id },
    orderBy: { created_at: 'desc' }
  })

  // Usamos Promise.all porque createSignedUrl es asíncrono
  const spreadsheetsWithUrls = await Promise.all(
    userSpreadsheets.map(async (sheet) => {
      // Generamos un link temporal que expira en 3600 segundos (1 hora)
      const { data, error } = await supabase.storage
        .from('vancheck-bucket')
        .createSignedUrl(sheet.file_url, 3600)

      if (error) {
        console.error('Error firmando URL para:', sheet.file_url, error)
      }

      return {
        ...sheet,
        // Si hay error, le pasamos un '#' para que el botón no explote
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
        <p className="text-muted mb-4 fs-5">
          Registra tus planillas de pago y ten una vista clara de los pagos que recibes.
        </p>

        <SpreadsheetForm />
        
        {/* Le pasamos la lista con las URLs firmadas y seguras */}
        <SpreadsheetList initialSpreadsheets={spreadsheetsWithUrls} />
      </section>

    </main>
  )
}