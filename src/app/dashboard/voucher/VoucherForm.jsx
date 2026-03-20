'use client'

import { useState } from 'react'
import { submitVoucher } from '@/app/actions/voucher'
import { CheckCircleFill, ExclamationTriangleFill } from 'react-bootstrap-icons'

export default function VoucherForm({ companies }) {
  const [isManual, setIsManual] = useState(false)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('') 

  const handleImageChange = (e) => {
    setErrorMsg('') 
    const files = e.target.files

    if (files.length > 1) {
      setErrorMsg('Solo puedes subir 1 imagen a la vez.')
      setPreview(null)
      e.target.value = '' 
      return
    }

    const file = files[0]
    
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrorMsg('El archivo seleccionado no es válido. Por favor, sube solo imágenes (JPG, PNG, WEBP, etc.).')
        setPreview(null)
        e.target.value = '' 
        return
      }

      setPreview(URL.createObjectURL(file))
    } else {
      setPreview(null)
    }
  }

  const handleSubmit = async (formData) => {
    if (errorMsg) return 

    setLoading(true)
    setSuccessMsg('')
    setErrorMsg('')
    
    formData.append('isManual', isManual)

    try {
      const result = await submitVoucher(formData)
      if (result?.success) {
        setSuccessMsg(result.message)
      }
    } catch (error) {
      setErrorMsg(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card shadow-sm border-0 bg-light mt-4">
      <div className="card-body p-4">
        
        {successMsg && (
          <div className="alert alert-success shadow-sm d-flex align-items-center gap-2 mb-4 animate__animated animate__fadeIn">
            <CheckCircleFill size={20} />
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="alert alert-danger shadow-sm d-flex align-items-center gap-2 mb-4 animate__animated animate__fadeIn">
            <ExclamationTriangleFill size={20} />
            {errorMsg}
          </div>
        )}

        <div className="form-check form-switch mb-4">
          <input 
            className="form-check-input" 
            type="checkbox" 
            role="switch" 
            id="manualToggle" 
            checked={isManual}
            onChange={(e) => {
              setIsManual(e.target.checked)
              setSuccessMsg('')
              setErrorMsg('') 
            }}
            style={{ cursor: 'pointer' }}
          />
          <label className="form-check-label fw-medium" htmlFor="manualToggle" style={{ cursor: 'pointer' }}>
            Prefiero crearlo de forma manual
          </label>
        </div>

        <form action={handleSubmit}>
          {!isManual ? (
            <div className="mb-3 animate__animated animate__fadeIn">
              <label htmlFor="voucherImage" className="form-label fw-semibold text-secondary">
                Sube la foto de tu Voucher (Solo Imágenes)
              </label>
              <input 
                className="form-control" 
                type="file" 
                id="voucherImage" 
                name="voucherImage"
                accept="image/*" 
                onChange={handleImageChange}
                required={!isManual}
              />
              
              {preview && (
                <div className="mt-4 text-center">
                  <p className="text-muted small mb-2">Previsualización:</p>
                  <img 
                    src={preview} 
                    alt="Previsualización del voucher" 
                    className="img-fluid rounded shadow-sm border" 
                    style={{ maxHeight: '300px', objectFit: 'contain' }} 
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="row g-3 animate__animated animate__fadeIn">
              <div className="col-12 col-md-4">
                <label htmlFor="identifier" className="form-label fw-semibold text-secondary">Identificador</label>
                <input 
                  type="text" 
                  className="form-control" 
                  id="identifier" 
                  name="identifier" 
                  placeholder="Ej: VCH-123" 
                  required={isManual}
                />
              </div>
              
              <div className="col-12 col-md-4">
                <label htmlFor="date" className="form-label fw-semibold text-secondary">Fecha</label>
                <input 
                  type="date" 
                  className="form-control" 
                  id="date" 
                  name="date" 
                  required={isManual}
                />
              </div>

              <div className="col-12 col-md-4">
                <label htmlFor="company" className="form-label fw-semibold text-secondary">Mundo</label>
                <select 
                  className="form-select" 
                  id="company" 
                  name="company_id" 
                  required={isManual}
                >
                  <option value="">Selecciona una opción...</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="d-flex justify-content-end mt-4">
            <button type="submit" className="btn btn-primary px-4 fw-medium" disabled={loading || (errorMsg && !isManual)}>
              {loading ? 'Procesando...' : 'Guardar Voucher'}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}