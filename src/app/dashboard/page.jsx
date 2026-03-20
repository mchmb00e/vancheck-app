export const runtime = 'nodejs'

import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { signOut } from '@/app/actions/auth'

import { 
  Stars, 
  TruckFront, 
  FileEarmarkSpreadsheet, 
  Person, 
  BoxArrowRight, 
  Whatsapp 
} from 'react-bootstrap-icons'

export const metadata = {
  title: 'Inicio | VanCheck',
};

function Item({ title, description, path, disabled, icon }) {
  const href = disabled ? '#' : (path || '#')

  return (
    <div className="col-12 col-md-6 mb-4">
      <Link 
        href={href} 
        className={`text-decoration-none ${disabled ? 'pe-none opacity-50' : ''}`}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : undefined}
      >
        <div className="card h-100 shadow-sm bg-light hover-shadow transition">
          <div className="card-body d-flex flex-column gap-2">
            <div className="d-flex align-items-center gap-2">
              <div className="text-primary d-flex align-items-center">
                {icon}
              </div>
              <h3 className="card-title h5 text-dark m-0">{title}</h3>
            </div>
            <p className="card-text text-secondary m-0">{description}</p>
          </div>
        </div>
      </Link>
    </div>
  )
}

export default async function DashboardPage({ searchParams }) {
  const params = await searchParams
  const message = params?.message

  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="container mt-5 text-center">
        <p className="lead">No estás logueado.</p>
        <Link href="/login" className="btn btn-primary">Ir al Login</Link>
      </div>
    )
  }

  const perfil = await prisma.users.findUnique({
    where: { id: user.id },
    include: {
      spreadsheets: true, 
    }
  })

  return (
    <main className="container py-5">
      
      {perfil && !perfil.is_allowed && (
        <div className="alert alert-warning mb-4 shadow-sm" role="alert">
          <strong>¡Atención!</strong> Tu cuenta actualmente está restringida. Algunas funciones pueden no estar disponibles.
        </div>
      )}

      {message && (
        <div className="alert alert-success mb-4 shadow-sm" role="alert">
          {message}
        </div>
      )}

      <header className="mb-4">
        <h1 className="display-5 fw-bold text-dark">
          Bienvenido, <span className="text-primary">{perfil?.name} {perfil?.last_name}</span>
        </h1>
      </header>

      <section>
        <h2 className="h3 mb-3 text-secondary">
          ¿Qué quieres realizar?
        </h2>
        
        <div className="row">
          <Item 
            title="Analizar mis pagos" 
            description="Revisa si tienes pagos no realizados."
            path="/dashboard/analysis" 
            disabled={perfil?.is_allowed === false} 
            icon={<Stars className="text-black" size={24} />}
          />
          <Item 
            title="Voucher" 
            description="Gestiona los viajes que realizas durante el mes."
            path="/dashboard/voucher"
            icon={<TruckFront className="text-black" size={24} />}
          />
          <Item 
            title="Planilla" 
            description="Gestiona las planillas de pago que recibes."
            path="/dashboard/spreadsheet"
            icon={<FileEarmarkSpreadsheet className="text-black" size={24} />}
          />
          <Item 
            title="Mis datos" 
            description="Visualiza y actualiza tu información personal."
            path="/dashboard/profile"
            icon={<Person className="text-black" size={24} />}
          />
        </div>

        <hr className="my-4 text-secondary opacity-25" />

        <div className="row mt-3">
          
          <div className="col-12 col-md-4 mb-3">
            <Link 
              href="/dashboard/support"
              className="btn btn-success w-100 py-2 d-flex align-items-center justify-content-center gap-2 text-white shadow-sm text-decoration-none"
            >
              <Whatsapp size={20} />
              <span className="fw-semibold">Contactar a soporte</span>
            </Link>
          </div>

          <div className="col-12 col-md-4 mb-3">
            <form action={signOut} className="m-0 h-100">
              <button
                type="submit" 
                className="btn btn-outline-danger w-100 py-2 d-flex align-items-center justify-content-center gap-2 shadow-sm"
              >
                <BoxArrowRight size={20} />
                <span className="fw-semibold">Cerrar sesión</span>
              </button>
            </form>
          </div>

        </div>

      </section>
      
    </main>
  )
}