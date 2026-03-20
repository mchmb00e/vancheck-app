'use client'

import { useState } from 'react'
import { ArrowRightCircle, FileEarmarkSpreadsheet, ExclamationTriangleFill } from 'react-bootstrap-icons'
import { useRouter } from 'next/navigation'

export default function AnalysisForm({ spreadsheets }) {
  const [selectedSheetId, setSelectedSheetId] = useState(null)
  const [error, setError] = useState(null)
  const router = useRouter()

  const handleSubmit = (e) => {
    e.preventDefault()
    setError(null)
    
    if (!selectedSheetId) {
      setError('Por favor, selecciona una planilla para continuar.')
      return
    }

    router.push(`/dashboard/analysis/define?id=${selectedSheetId}`)
  }

  return (
    <form onSubmit={handleSubmit} className="card shadow-sm border-0 bg-light p-4">
      <h3 className="h6 fw-bold text-secondary text-uppercase mb-3">1. Selecciona la Planilla</h3>
      
      {error && (
        <div className="alert alert-danger shadow-sm d-flex align-items-center gap-2 mb-4 animate__animated animate__headShake">
          <ExclamationTriangleFill size={20} />
          {error}
        </div>
      )}

      <div className="list-group mb-4">
        {spreadsheets.length === 0 ? (
          <div className="alert alert-warning border-0 shadow-sm">
            No tienes planillas subidas. Ve a "Planillas" y sube una primero.
          </div>
        ) : (
          spreadsheets.map((sheet) => (
            <button
              key={sheet.id}
              type="button"
              className={`list-group-item list-group-item-action d-flex align-items-center gap-3 p-3 border-0 shadow-sm mb-2 rounded ${
                selectedSheetId === sheet.id ? 'bg-primary text-white' : 'bg-white'
              }`}
              onClick={() => {
                setSelectedSheetId(sheet.id)
                setError(null)
              }}
            >
              <FileEarmarkSpreadsheet size={24} className={selectedSheetId === sheet.id ? 'text-white' : 'text-primary'} />
              <div className="d-flex flex-column text-start">
                <span className="fw-bold">{sheet.name}</span>
                <small className={selectedSheetId === sheet.id ? 'text-white-50' : 'text-muted'}>
                  Subida el: {new Date(sheet.created_at).toLocaleDateString('es-CL')}
                </small>
              </div>
            </button>
          ))
        )}
      </div>

      <div className="d-flex justify-content-end border-top pt-4">
        <button 
          type="submit" 
          className="btn btn-primary btn-lg px-5 d-flex align-items-center gap-2 fw-bold"
          disabled={spreadsheets.length === 0}
        >
          Continuar <ArrowRightCircle size={20} />
        </button>
      </div>
    </form>
  )
}