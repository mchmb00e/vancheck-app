export const runtime = 'nodejs'

import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { submitSupportTicket } from '@/app/actions/support'
import { 
  CheckCircleFill, 
  XCircleFill, 
  Send,
  ClockFill,
  Headset
} from 'react-bootstrap-icons'
import Link from 'next/link'
import Image from 'next/image'

export const metadata = {
  title: 'Soporte | VanCheck',
};

const parseTicketMessage = (fullMessage) => {
  const regex = /^\[(.*?)\]\s*([\s\S]*)$/
  const match = fullMessage.match(regex)
  
  if (match) {
    return { 
      contactInfo: match[1], 
      cleanMessage: match[2] 
    }
  }
  return { contactInfo: 'Vía plataforma', cleanMessage: fullMessage }
}

export default async function SupportPage({ searchParams }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <div className="container mt-5 text-center">No estás logueado.</div>
  }

  const myTickets = await prisma.support.findMany({
    where: { user_id: user.id },
    orderBy: { created_at: 'desc' }
  })

  const params = await searchParams
  const successMsg = params?.success
  const errorMsg = params?.error

  return (
    <main className="container py-5" style={{ maxWidth: '800px' }}>
      
      <div className="d-flex justify-content-center mb-4">
        <Image 
          src="/logo.webp" 
          alt="Logo VanCheck" 
          width={200} 
          height={80} 
          style={{ objectFit: 'contain' }}
          priority 
        />
      </div>

      {successMsg && (
        <div className="alert alert-success shadow-sm d-flex align-items-center gap-2 mb-4 animate__animated animate__fadeIn">
          <CheckCircleFill size={20} className="flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="alert alert-danger shadow-sm d-flex align-items-center gap-2 mb-4">
          <XCircleFill size={20} className="flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <header className="mb-4 border-bottom pb-3 d-flex flex-row align-items-center justify-content-between">
        <h1 className="display-6 fw-bold text-dark m-0 d-flex align-items-center gap-3">
          <Headset className="text-primary" /> Soporte
        </h1>
        <Link href={'/dashboard'} className="text-decoration-none">
          <button className="btn btn-outline-dark fw-medium">Volver</button>
        </Link>
      </header>

      <section className="card shadow-sm border-0 mb-5 bg-light">
        <div className="card-body p-4">
          <h3 className="h5 fw-bold mb-2 text-dark">¿Tienes algún problema?</h3>
          <p className="text-muted mb-4 text-sm">
            Escríbenos tu problema o duda y nuestro equipo lo revisará a la brevedad.
          </p>

          <form action={submitSupportTicket}>
            <div className="mb-3">
              <label htmlFor="contact_method" className="form-label fw-semibold text-secondary">
                Selecciona por dónde quieres que nos comuniquemos:
              </label>
              <select 
                className="form-select" 
                id="contact_method" 
                name="contact_method" 
                required
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Correo Electrónico</option>
              </select>
            </div>

            <div className="mb-4">
              <textarea 
                name="message"
                className="form-control" 
                rows="4" 
                placeholder="Detalla aquí tu situación..."
                required
                style={{ resize: 'none' }}
              ></textarea>
            </div>
            
            <div className="d-flex justify-content-end">
              <button 
                type="submit" 
                className="btn btn-primary d-flex align-items-center gap-2 px-4 fw-medium"
              >
                <Send size={18} />
                <span>Enviar Solicitud</span>
              </button>
            </div>
          </form>
        </div>
      </section>

      <section>
        <h2 className="h4 fw-bold text-dark mb-4 border-bottom pb-2">Mis Tickets</h2>
        
        <div className="list-group">
          {myTickets.length === 0 ? (
            <div className="text-center text-muted py-5 bg-light rounded border border-dashed">
              Aún no has enviado ninguna solicitud de soporte.
            </div>
          ) : (
            myTickets.map((ticket) => {
              const { contactInfo, cleanMessage } = parseTicketMessage(ticket.message)

              return (
                <div key={ticket.id} className="list-group-item p-4 shadow-sm mb-3 rounded border-0">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    
                    <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary-subtle">
                      {contactInfo}
                    </span>

                    <div className="d-flex align-items-center gap-2">
                      {ticket.complete ? (
                        <span className="badge bg-success d-flex align-items-center gap-1 py-2 px-3">
                          <CheckCircleFill size={14} /> Resuelto
                        </span>
                      ) : (
                        <span className="badge bg-warning text-dark d-flex align-items-center gap-1 py-2 px-3">
                          <ClockFill size={14} /> En espera
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <p className="mb-2 mt-3 text-dark">
                    {cleanMessage}
                  </p>
                  
                  <small className="text-muted d-block text-end mt-3 border-top pt-2">
                    Enviado el: {new Date(ticket.created_at).toLocaleDateString('es-CL')}
                  </small>
                </div>
              )
            })
          )}
        </div>
      </section>

    </main>
  )
}