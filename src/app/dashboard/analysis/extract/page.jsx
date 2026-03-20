'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeftCircle, CheckCircleFill, ExclamationTriangleFill, InfoCircleFill, HandThumbsUp, HandThumbsDown } from 'react-bootstrap-icons'
import { submitAnalysisFeedback } from '@/app/actions/analysis' 

export default function ExtractViewPage() {
  const [analisis, setAnalisis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [feedbackStatus, setFeedbackStatus] = useState('pending')

  useEffect(() => {
    const storedData = sessionStorage.getItem('extractedData')
    if (storedData) {
      setAnalisis(JSON.parse(storedData))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    document.title = "Extracción | VanCheck"
  }, [])

  const handleFeedback = async (isConforme) => {
    setFeedbackStatus('loading')
    try {
      await submitAnalysisFeedback(analisis.analysisId, isConforme)
      setFeedbackStatus('done')
    } catch (err) {
      setFeedbackStatus('pending')
    }
  }

  if (loading) {
    return <div className="container mt-5 text-center">Cargando resultados de la intersección...</div>
  }

  if (!analisis) {
    return (
      <div className="container mt-5 text-center alert alert-warning shadow-sm border-0 animate__animated animate__fadeIn">
        No hay datos de análisis recientes. Por favor, vuelve atrás y escanea una planilla.
        <br/><br/>
        <Link href="/dashboard/analysis/model" className="btn btn-dark fw-bold px-4">Volver a escanear</Link>
      </div>
    )
  }

  const isPerfectMatch = analisis.missingInPlanilla.length === 0 && analisis.missingInProfile.length === 0

  return (
    <main className="container py-5" style={{ maxWidth: '900px' }}>
      
      <header className="d-flex justify-content-between align-items-center mb-5 border-bottom pb-3">
        <h1 className="display-6 fw-bold text-dark m-0">
          Resultados del Mes
        </h1>
        <Link href="/dashboard/analysis/model" className="btn btn-outline-dark fw-medium px-4 d-flex align-items-center gap-2">
          <ArrowLeftCircle /> Volver
        </Link>
      </header>

      <section className="animate__animated animate__fadeIn">
        
        {isPerfectMatch && (
          <div className="alert alert-success border-success border-2 shadow-sm p-4 d-flex flex-column align-items-center text-center mb-5">
            <CheckCircleFill className="text-success mb-3" size={64} />
            <h2 className="h4 fw-bold">¡Planilla Perfecta!</h2>
            <p className="mb-0 fs-5">
              No ocurrió ningún error en los pagos del mes. Todos los vouchers que registraste ({analisis.matched.length}) 
              están pagados en tu planilla.
            </p>
          </div>
        )}

        {!isPerfectMatch && analisis.missingInPlanilla.length > 0 && (
          <div className="card shadow-sm border-danger border-2 mb-5">
            <div className="card-header bg-danger text-white py-3 d-flex align-items-center gap-2">
              <ExclamationTriangleFill size={20} />
              <h3 className="h6 m-0 fw-bold text-uppercase">Vouchers NO presentes en tu planilla de pago</h3>
            </div>
            <div className="card-body bg-light">
              <p className="text-muted small mb-3">
                Estos viajes están registrados en tu sistema dentro del rango de fechas, pero <strong>no aparecen en el PDF</strong>. ¡Reclama este pago!
              </p>
              <div className="table-responsive">
                <table className="table table-hover table-bordered mb-0 bg-white">
                  <thead className="table-light">
                    <tr>
                      <th>ID Viaje</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analisis.missingInPlanilla.map((v, i) => (
                      <tr key={i}>
                        <td className="fw-bold text-danger">{v.voucher_number}</td>
                        <td>{new Date(v.voucher_date).toLocaleDateString('es-CL', { timeZone: 'UTC' })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {!isPerfectMatch && analisis.missingInProfile.length > 0 && (
          <div className="card shadow-sm border-info border-2 mb-5">
            <div className="card-header bg-info text-white py-3 d-flex align-items-center gap-2">
              <InfoCircleFill size={20} />
              <h3 className="h6 m-0 fw-bold text-uppercase">Vouchers en planilla pero NO en tu perfil</h3>
            </div>
            <div className="card-body bg-light">
              <p className="text-muted small mb-3">
                La empresa te pagó estos viajes, pero <strong>tú no tienes el papelito registrado</strong> en las fechas que indicaste.
              </p>
              <div className="table-responsive">
                <table className="table table-hover table-bordered mb-0 bg-white">
                  <thead className="table-light">
                    <tr>
                      <th>ID Viaje</th>
                      <th>Fecha PDF</th>
                      <th>Monto Pagado</th>
                      <th>Mundo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analisis.missingInProfile.map((v, i) => (
                      <tr key={i}>
                        <td className="fw-bold text-dark">{v.id_viaje}</td>
                        <td>{v.fecha}</td>
                        <td className="text-success fw-medium">${v.monto}</td>
                        <td>
                          <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary-subtle">
                            {v.mundo || 'Sin mundo'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <hr className="my-5" />
        
        <div className="card shadow-sm border-0 bg-light p-4 text-center mb-5 animate__animated animate__fadeInUp">
          <h4 className="h5 fw-bold text-dark mb-3">¿Qué te pareció este análisis?</h4>
          
          {feedbackStatus === 'pending' && (
            <div className="d-flex flex-column flex-sm-row justify-content-center gap-3">
              <button 
                onClick={() => handleFeedback(true)}
                className="btn btn-outline-success fw-medium d-flex align-items-center justify-content-center gap-2 px-4 py-2"
              >
                <HandThumbsUp size={20} /> Estoy conforme con el resultado
              </button>
              <button 
                onClick={() => handleFeedback(false)}
                className="btn btn-outline-danger fw-medium d-flex align-items-center justify-content-center gap-2 px-4 py-2"
              >
                <HandThumbsDown size={20} /> No estoy conforme con el resultado
              </button>
            </div>
          )}

          {feedbackStatus === 'loading' && (
            <div className="text-secondary fw-medium">
              <div className="spinner-border spinner-border-sm me-2" role="status"></div>
              Guardando tu respuesta...
            </div>
          )}

          {feedbackStatus === 'done' && (
            <div className="animate__animated animate__zoomIn">
              <p className="text-success fw-bold fs-5 mb-4">
                <CheckCircleFill className="me-2" /> ¡Gracias por tu feedback! Nos ayuda a mejorar el analizador.
              </p>
              <Link href="/dashboard" className="btn btn-primary fw-medium px-5 py-2 shadow-sm">
                Volver al inicio
              </Link>
            </div>
          )}
        </div>

      </section>
    </main>
  )
}