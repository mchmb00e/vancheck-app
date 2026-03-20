export const runtime = 'nodejs'

import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { submitSupportTicket } from '@/app/actions/support'
import { 
  CheckCircleFill, 
  XCircleFill, 
  PersonBadge, 
  Telephone, 
  Envelope, 
  Send
} from 'react-bootstrap-icons'
import Link from 'next/link'

export const metadata = {
  title: 'Mi perfil | VanCheck',
};

function formatRut(rut) {
  if (!rut) return ''
  const clean = rut.replace(/[^0-9kK]/g, '')
  if (clean.length < 2) return clean
  const dv = clean.slice(-1)
  const body = clean.slice(0, -1)
  return `${body.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}-${dv}`
}

function formatPhone(phone) {
  if (!phone) return 'No registrado'
  const clean = phone.replace(/\D/g, '')
  if (clean.length === 9) {
    return clean.replace(/(\d{1})(\d{4})(\d{4})/, '+56 $1 $2 $3')
  }
  return phone
}

export default async function ProfilePage({ searchParams }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <div className="container mt-5 text-center">No estás logueado.</div>
  }

  const perfil = await prisma.users.findUnique({
    where: { id: user.id }
  })

  const params = await searchParams
  const successMsg = params?.success
  const errorMsg = params?.error

  return (
    <main className="container py-5" style={{ maxWidth: '800px' }}>
      
      {successMsg && (
        <div className="alert alert-success shadow-sm d-flex align-items-center gap-2 mb-4 animate__animated animate__fadeIn">
          <CheckCircleFill size={20} />
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="alert alert-danger shadow-sm d-flex align-items-center gap-2 mb-4 animate__animated animate__headShake">
          <XCircleFill size={20} />
          {errorMsg}
        </div>
      )}

      <header className="mb-4 border-bottom pb-3 d-flex flex-row align-items-center justify-content-between">
        <h1 className="display-6 fw-bold text-dark m-0">Mi perfil</h1>
        <Link 
        href={'/dashboard'} 
        className={`text-decoration-none`}
        >
          <button className="btn btn-outline-dark">Volver</button>
        </Link>
      </header>

      <section className="card shadow-sm mb-5 border-0 bg-light">
        <div className="card-body">
          <h2 className="h4 fw-bold text-primary mb-4">{perfil?.name} {perfil?.last_name}</h2>
          
          <div className="row g-3">
            <div className="col-12 col-md-6 d-flex align-items-center gap-3">
              <PersonBadge size={24} className="text-secondary" />
              <div>
                <small className="text-muted d-block">RUT</small>
                <span className="fw-medium">{formatRut(perfil?.rut)}</span>
              </div>
            </div>

            <div className="col-12 col-md-6 d-flex align-items-center gap-3">
              <Envelope size={24} className="text-secondary" />
              <div>
                <small className="text-muted d-block">Correo electrónico</small>
                <span className="fw-medium">{perfil?.email}</span>
              </div>
            </div>

            <div className="col-12 col-md-6 d-flex align-items-center gap-3">
              <Telephone size={24} className="text-secondary" />
              <div>
                <small className="text-muted d-block">Teléfono</small>
                <span className="fw-medium">{formatPhone(perfil?.tel)}</span>
              </div>
            </div>

            <div className="col-12 col-md-6 d-flex align-items-center gap-3">
              {perfil?.is_allowed ? (
                <CheckCircleFill size={24} className="text-success" />
              ) : (
                <XCircleFill size={24} className="text-danger" />
              )}
              <div>
                <small className="text-muted d-block">Estado de la cuenta</small>
                {perfil?.is_allowed ? (
                  <span className="badge bg-success">Habilitada</span>
                ) : (
                  <span className="badge bg-danger">Restringida</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="card shadow-sm border-0">
        <div className="card-body">
          <h3 className="h5 fw-bold mb-3 text-dark">¿Tienes algún problema?</h3>
          <p className="text-muted mb-4 text-sm">
            Escríbenos tu problema o duda y nuestro equipo de soporte lo revisará a la brevedad.
          </p>

          <form action={submitSupportTicket}>
            <div className="mb-3">
              <textarea 
                name="message"
                className="form-control" 
                rows="4" 
                placeholder="Escríbenos tu problema..."
                required
                style={{ resize: 'none' }}
              ></textarea>
            </div>
            
            <div className="d-flex justify-content-end">
              <button 
                type="submit" 
                className="btn btn-primary d-flex align-items-center gap-2 px-4"
              >
                <Send size={18} />
                <span>Enviar</span>
              </button>
            </div>
          </form>
        </div>
      </section>

    </main>
  )
}