'use client'

import { useState } from 'react'
import { Stars, ExclamationTriangleFill } from 'react-bootstrap-icons'
import { useRouter } from 'next/navigation'
import { processSpreadsheetAnalysis } from '@/app/actions/analysis'

export default function DefineForm({ spreadsheetId }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    
    const formData = new FormData(e.target)
    const startPage = parseInt(formData.get('startPage')) || 2
    const endPageInput = formData.get('endPage')
    const endPage = endPageInput ? parseInt(endPageInput) : null
    
    const startDate = formData.get('startDate')
    const endDate = formData.get('endDate')

    if (endPage && startPage > endPage) {
      setError('La página de inicio no puede ser mayor a la página de término.')
      return
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError('La fecha de inicio no puede ser posterior a la fecha de corte.')
      return
    }

    setLoading(true)

    try {
      const result = await processSpreadsheetAnalysis(spreadsheetId, startDate, endDate, startPage, endPage)

      if (result.success) {
        sessionStorage.setItem('extractedData', JSON.stringify(result.data))
        router.push('/dashboard/analysis/extract')
      } else {
        setError(result.error || 'Ocurrió un problema durante el análisis.')
        setLoading(false)
      }
    } catch (err) {
      setError('Hubo un error al analizar el documento. Por favor, inténtalo más tarde.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card shadow-sm border-0 bg-light p-4">
      
      {error && (
        <div className="alert alert-danger shadow-sm d-flex align-items-center gap-2 mb-4 animate__animated animate__headShake">
          <ExclamationTriangleFill size={20} />
          <div>{error}</div>
        </div>
      )}

      <h3 className="h6 fw-bold text-secondary text-uppercase mb-3">Rango de Páginas a Escanear</h3>
      <div className="row g-3 mb-5">
        <div className="col-12 col-md-6">
          <label className="form-label fw-medium text-dark">Página de Inicio</label>
          <input 
            type="number" 
            className="form-control" 
            name="startPage" 
            defaultValue={2} 
            min={1} 
            required 
          />
          <small className="text-muted mt-1 d-block">Por defecto es la 2 para omitir la portada.</small>
        </div>
        <div className="col-12 col-md-6">
          <label className="form-label fw-medium text-dark">Página de Término</label>
          <input 
            type="number" 
            className="form-control" 
            name="endPage" 
            placeholder="Ej: 15 (Opcional)" 
            min={1} 
          />
          <small className="text-muted mt-1 d-block">Déjalo en blanco para escanear hasta el final.</small>
        </div>
      </div>

      <h3 className="h6 fw-bold text-secondary text-uppercase mb-3">Rango de Viajes a Cruzar</h3>
      
      <div className="mb-4">
        <label className="form-label fw-medium text-dark">Fecha de inicio de pagos <span className="text-danger">*</span></label>
        <input type="date" className="form-control mb-2" name="startDate" required />
        <div className="form-text text-muted">
          Corresponde a la fecha del <strong>primer pago</strong> que recibirás este mes. <br/>
          <em>Ejemplo: Si para tu pago de febrero una empresa corta los días 20, tu fecha de inicio es el 21 de enero.</em>
        </div>
      </div>

      <div className="mb-4">
        <label className="form-label fw-medium text-dark">Fecha de corte de pagos <span className="text-danger">*</span></label>
        <input type="date" className="form-control mb-2" name="endDate" required />
        <div className="form-text text-muted">
          Corresponde a la fecha del <strong>último pago</strong> que recibirás este mes. <br/>
          <em>Ejemplo: Si una empresa corta los 20 pero otra corta a fin de mes, tu fecha de corte para febrero es el 28 de febrero.</em>
        </div>
      </div>

      <div className="d-flex justify-content-end border-top pt-4">
        <button 
          type="submit" 
          className="btn btn-primary btn-lg px-5 d-flex align-items-center gap-2 fw-bold"
          disabled={loading}
        >
          <Stars size={20} />
          {loading ? 'Leyendo documento...' : 'Analizar Planilla'}
        </button>
      </div>

    </form>
  )
}