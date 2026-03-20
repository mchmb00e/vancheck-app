'use client'

import { useState } from 'react'
import { uploadSpreadsheet } from '@/app/actions/spreadsheet'
import Link from 'next/link'
import { PDFDocument } from 'pdf-lib'

export default function SpreadsheetForm() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    setSuccess(false)

    const formData = new FormData(e.target)
    const file = formData.get('file')

    if (file && file.size > 0) {
      try {
        const arrayBuffer = await file.arrayBuffer()
        const pdfDoc = await PDFDocument.load(arrayBuffer)
        const pageCount = pdfDoc.getPageCount()

        if (pageCount > 10) {
          setErrorMsg(`El documento tiene ${pageCount} páginas. El límite máximo permitido es de 10 páginas.`)
          setLoading(false)
          return 
        }
      } catch (err) {
        setErrorMsg('No se pudo leer el PDF. Asegúrate de que el archivo no esté corrupto.')
        setLoading(false)
        return
      }
    }

    try {
      await uploadSpreadsheet(formData)
      setSuccess(true)
      e.target.reset() 
    } catch (err) {
      setErrorMsg(err.message || 'Ocurrió un error al subir la planilla')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card shadow-sm border-0 bg-light mb-5">
      <div className="card-body p-4">
        
        {success && (
          <div className="alert alert-success d-flex flex-column align-items-center text-center p-4 mb-4 animate__animated animate__fadeIn">
            <h5 className="fw-bold mb-2">¡La planilla ha sido creada con éxito!</h5>
            <p className="mb-3">Usa el analizador para ver la exactitud de tus pagos.</p>
            <Link href="/dashboard/analysis" className="btn btn-success fw-medium px-4">
              Ir al Analizador
            </Link>
          </div>
        )}

        {errorMsg && (
          <div className="alert alert-danger shadow-sm border-0 animate__animated animate__headShake">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label htmlFor="name" className="form-label fw-semibold text-secondary">Nombre de la Planilla</label>
              <input 
                type="text" 
                className="form-control" 
                id="name" 
                name="name" 
                placeholder="Ej: Pagos Diciembre 2025" 
                required 
              />
            </div>
            
            <div className="col-12 col-md-6">
              <label htmlFor="file" className="form-label fw-semibold text-secondary">Documento PDF (Máx. 10 págs)</label>
              <input 
                type="file" 
                className="form-control" 
                id="file" 
                name="file" 
                accept=".pdf" 
                required 
              />
            </div>
          </div>
          
          <div className="mt-4 text-end">
            <button type="submit" className="btn btn-primary px-4 fw-medium" disabled={loading}>
              {loading ? 'Subiendo...' : 'Subir Planilla'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}