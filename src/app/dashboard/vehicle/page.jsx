export const runtime = 'nodejs'

import prisma from '@/lib/prisma'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import VehicleForm from './VehicleForm'
import VehicleList from './VehicleList'

export const metadata = {
  title: 'Mis Vehículos | VanCheck',
};

export default async function VehiclePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const userVehicles = await prisma.vehicles.findMany({
    where: { user_id: user?.id },
    orderBy: { created_at: 'desc' }
  })

  return (
    <main className="container py-5" style={{ maxWidth: '900px' }}>
      
      <header className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
        <h1 className="display-6 fw-bold text-dark m-0">Mis Vehículos</h1>
        
        <Link href="/dashboard" className="btn btn-outline-dark fw-medium px-4">
          Volver
        </Link>
      </header>

      <section>
        <p className="text-muted mb-4 fs-5">
          Registra y administra los vehículos de tu flota. Un chofer puede tener asignado un vehículo existente.
        </p>

        <VehicleForm />
        
        <VehicleList initialVehicles={userVehicles} />
      </section>

    </main>
  )
}