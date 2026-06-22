'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeftCircle, CheckCircleFill, ExclamationTriangleFill, InfoCircleFill, HandThumbsUp, HandThumbsDown, Eye, EyeSlash, FileEarmarkPdfFill, Download, FileEarmarkSpreadsheetFill } from 'react-bootstrap-icons'
import { submitAnalysisFeedback, getSpreadsheetUrl, generateUnpaidVouchersPdf } from '@/app/actions/analysis' 
import { getVoucherImageUrl } from '@/app/actions/voucher' 
import * as XLSX from 'xlsx' 

export default function ExtractViewPage() {
  const [analisis, setAnalisis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [feedbackStatus, setFeedbackStatus] = useState('pending')
  const [imageLoadingId, setImageLoadingId] = useState(null)
  const [excludedIds, setExcludedIds] = useState([])
  
  const [isOpeningSpreadsheet, setIsOpeningSpreadsheet] = useState(false)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)

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

  const handleViewVoucher = async (id, filePath) => {
    if (!filePath) return
    setImageLoadingId(id)
    try {
      const url = await getVoucherImageUrl(filePath)
      if (url) window.open(url, '_blank')
      else alert('No se pudo cargar la imagen.')
    } catch (error) {
      alert('Hubo un error al intentar abrir la imagen.')
    } finally {
      setImageLoadingId(null)
    }
  }

  const handleToggleExclude = (id) => {
    setExcludedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleOpenSpreadsheet = async () => {
    if (!analisis?.spreadsheetId) {
      alert("No se encontró la referencia a la planilla.")
      return
    }
    
    setIsOpeningSpreadsheet(true)
    try {
      const url = await getSpreadsheetUrl(analisis.spreadsheetId)
      window.open(url, '_blank')
    } catch (error) {
      alert("Error al abrir la planilla: " + error.message)
    } finally {
      setIsOpeningSpreadsheet(false)
    }
  }

  const handleDownloadUnpaidPdf = async () => {
    if (!analisis?.missingInPlanilla || analisis.missingInPlanilla.length === 0) return
    
    const activeVouchers = analisis.missingInPlanilla.filter(v => !excludedIds.includes(v.id))
    if (activeVouchers.length === 0) {
      alert("No hay vouchers activos para generar el PDF.")
      return
    }

    setIsDownloadingPdf(true)
    try {
      const missingIds = activeVouchers.map(v => v.id)
      const response = await generateUnpaidVouchersPdf(missingIds)
      
      if (!response.success) {
        throw new Error(response.error || "Error desconocido al generar el PDF")
      }

      const byteCharacters = atob(response.pdfBase64)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'application/pdf' })
      
      const vehiclePatent = analisis.analyzedVehicle?.patent || 'N/A'
      const firstDate = activeVouchers[0]?.voucher_date
      const dateObj = firstDate ? new Date(firstDate) : new Date()
      const monthStr = dateObj.toLocaleDateString('es-CL', { month: 'long', timeZone: 'UTC' }).toLowerCase()
      const yearStr = dateObj.toLocaleDateString('es-CL', { year: 'numeric', timeZone: 'UTC' })
      const patentStr = vehiclePatent.replace(/[^a-zA-Z0-9]/g, '')

      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `${patentStr}_${monthStr}_${yearStr}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

    } catch (error) {
      alert("No se pudo generar el PDF: " + error.message)
    } finally {
      setIsDownloadingPdf(false)
    }
  }

const handleExportExcel = () => {
    if (!analisis?.missingInPlanilla || analisis.missingInPlanilla.length === 0) return

    const activeVouchers = analisis.missingInPlanilla.filter(v => !excludedIds.includes(v.id))
    if (activeVouchers.length === 0) {
      alert("No hay vouchers activos para exportar.")
      return
    }

    const vehicleName = analisis.analyzedVehicle?.name || 'Todos los vehículos'
    const vehiclePatent = analisis.analyzedVehicle?.patent || 'N/A'
    const firstDate = activeVouchers[0]?.voucher_date
    const dateObj = firstDate ? new Date(firstDate) : new Date()
    const monthStr = dateObj.toLocaleDateString('es-CL', { month: 'long', timeZone: 'UTC' }).toLowerCase()
    const yearStr = dateObj.toLocaleDateString('es-CL', { year: 'numeric', timeZone: 'UTC' })
    const monthYear = firstDate 
      ? dateObj.toLocaleDateString('es-CL', { month: 'long', year: 'numeric', timeZone: 'UTC' }) 
      : 'Mes no definido'

    const dataToExport = [
      {
        'ID': vehicleName,
        'FECHA': vehiclePatent,
        'MUNDO': monthYear
      },
      {
        'ID': 'ID Viaje',
        'FECHA': 'Fecha',
        'MUNDO': 'Mundo'
      },
      ...activeVouchers.map(v => ({
        'ID': v.voucher_number,
        'FECHA': new Date(v.voucher_date).toLocaleDateString('es-CL', { timeZone: 'UTC' }),
        'MUNDO': v.companies?.name || 'Sin mundo' 
      }))
    ]

    const worksheet = XLSX.utils.json_to_sheet(dataToExport, { skipHeader: true })

    worksheet['!cols'] = [
      { wch: 25 }, 
      { wch: 15 }, 
      { wch: 25 }  
    ]

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Vouchers No Pagados")

    const patentStr = vehiclePatent.replace(/[^a-zA-Z0-9]/g, '')
    const fileName = `${patentStr}_${monthStr}_${yearStr}.xlsx`
    XLSX.writeFile(workbook, fileName)
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
      
      <header className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
        <h1 className="display-6 fw-bold text-dark m-0">
          Resultados del Mes
        </h1>
        <Link href="/dashboard/analysis/model" className="btn btn-outline-dark fw-medium px-4 d-flex align-items-center gap-2">
          <ArrowLeftCircle /> Volver
        </Link>
      </header>

      <div className="alert alert-secondary border-0 shadow-sm mb-3 d-flex align-items-center gap-3 animate__animated animate__fadeIn">
        <InfoCircleFill size={24} className="text-secondary flex-shrink-0" />
        <div className="fs-6">
          <span className="text-muted d-block small">Contexto del Análisis:</span>
          <strong>Vehículo:</strong> {analisis.analyzedVehicle ? `${analisis.analyzedVehicle.name} (${analisis.analyzedVehicle.patent})` : 'Todos los vehículos registrados'}
        </div>
      </div>

      <div className="alert alert-warning border-0 shadow-sm mb-4 d-flex align-items-start gap-3 animate__animated animate__fadeIn">
        <ExclamationTriangleFill size={24} className="text-warning flex-shrink-0 mt-1" style={{ filter: 'drop-shadow(0px 1px 1px rgba(0,0,0,0.2))' }} />
        <div className="fs-6 text-dark">
          <p className="mb-2">
            Este análisis funciona bajo un modelo de inteligencia artificial, por lo que los resultados, así como el escaneo automático de vouchers y planillas podrían tener errores. Se trabaja continuamente para reducir esta tasa de fallo.
          </p>
          <p className="mb-0 fw-medium small text-muted">
            Al ser una herramienta de ayuda (análisis de datos), se recomienda revisar de forma manual si los resultados son correctos.
          </p>
        </div>
      </div>

      <div className="d-flex flex-wrap gap-3 mb-5 animate__animated animate__fadeIn">
        <button 
          onClick={handleOpenSpreadsheet} 
          disabled={isOpeningSpreadsheet}
          className="btn btn-primary shadow-sm d-flex align-items-center gap-2 fw-medium"
        >
          {isOpeningSpreadsheet ? (
            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          ) : (
            <FileEarmarkPdfFill size={18} />
          )}
          Ver planilla original
        </button>

        {!isPerfectMatch && analisis.missingInPlanilla.length > 0 && (
          <>
            <button 
              onClick={handleDownloadUnpaidPdf} 
              disabled={isDownloadingPdf}
              className="btn btn-danger shadow-sm d-flex align-items-center gap-2 fw-medium"
            >
              {isDownloadingPdf ? (
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              ) : (
                <Download size={18} />
              )}
              Descargar fotos (PDF)
            </button>

            <button 
              onClick={handleExportExcel} 
              className="btn btn-success shadow-sm d-flex align-items-center gap-2 fw-medium"
            >
              <FileEarmarkSpreadsheetFill size={18} />
              Exportar tabla (.xlsx)
            </button>
          </>
        )}
      </div>

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
                <table className="table table-hover table-bordered mb-0 bg-white align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>ID Viaje</th>
                      <th>Fecha</th>
                      <th>Mundo</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analisis.missingInPlanilla.map((v, i) => {
                      const isExcluded = excludedIds.includes(v.id)
                      return (
                        <tr key={i} className={isExcluded ? 'opacity-50' : ''}>
                          <td className={`fw-bold ${isExcluded ? 'text-secondary' : 'text-danger'}`}>
                            {isExcluded ? <del>{v.voucher_number}</del> : v.voucher_number}
                          </td>
                          <td>{new Date(v.voucher_date).toLocaleDateString('es-CL', { timeZone: 'UTC' })}</td>
                          <td>
                            <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary-subtle">
                              {v.companies?.name || 'Sin mundo'}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex flex-wrap gap-2">
                              {v.file_path ? (
                                <button 
                                  onClick={() => handleViewVoucher(v.id, v.file_path)}
                                  disabled={imageLoadingId === v.id}
                                  className="btn btn-sm btn-outline-primary d-flex align-items-center gap-2"
                                >
                                  {imageLoadingId === v.id ? (
                                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                  ) : (
                                    <Eye size={16} />
                                  )}
                                  Ver
                                </button>
                              ) : (
                                <button className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-2" disabled>
                                  <Eye size={16} /> Sin imagen
                                </button>
                              )}
                              
                              <button 
                                onClick={() => handleToggleExclude(v.id)}
                                className={`btn btn-sm d-flex align-items-center gap-2 ${isExcluded ? 'btn-secondary' : 'btn-outline-secondary'}`}
                                title={isExcluded ? 'Incluir voucher' : 'Excluir voucher'}
                              >
                                {isExcluded ? <EyeSlash size={16} /> : <Eye size={16} />}
                                {isExcluded ? 'Excluido' : 'Activo'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
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
                      <th>Mundo</th>
                      <th>Monto Pagado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analisis.missingInProfile.map((v, i) => (
                      <tr key={i}>
                        <td className="fw-bold text-dark">{v.id_viaje}</td>
                        <td>{v.fecha}</td>
                        <td>
                          <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary-subtle">
                            {v.mundo || 'Sin mundo'}
                          </span>
                        </td>
                        <td className="text-success fw-medium">${v.monto}</td>
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
                <HandThumbsUp size={20} /> Estoy conforme
              </button>
              <button 
                onClick={() => handleFeedback(false)}
                className="btn btn-outline-danger fw-medium d-flex align-items-center justify-content-center gap-2 px-4 py-2"
              >
                <HandThumbsDown size={20} /> No estoy conforme
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