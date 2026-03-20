'use client'

import { useState } from 'react'
import { confirmVoucherResult } from '@/app/actions/voucher'
import { CheckCircle, XCircle, ExclamationTriangleFill } from 'react-bootstrap-icons' 
import { useSearchParams } from 'next/navigation'

export default function ReviewForm({ voucher, companies, imageUrl }) {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const searchParams = useSearchParams()
  const isDuplicate = searchParams.get('duplicate') === 'true'

  const formattedDateForInput = voucher.voucher_date 
    ? new Date(voucher.voucher_date).toISOString().split('T')[0] 
    : ''

  const handleConfirm = async () => {
    setLoading(true)
    await confirmVoucherResult(voucher.id, true)
  }

  const handleEditSubmit = async (formData) => {
    setLoading(true)
    await confirmVoucherResult(voucher.id, false, formData)
  }

  return (
    <div className="row g-4 mt-2">
      <div className="col-12 col-md-6">
        <div className="card shadow-sm border-0 bg-light h-100">
          <div className="card-body p-4">

            {isDuplicate && (
              <div className="alert alert-warning border-warning border-2 shadow-sm d-flex align-items-center gap-3 mb-4 animate__animated animate__fadeInDown">
                <ExclamationTriangleFill className="text-warning flex-shrink-0" size={32} />
                <div>
                  <h5 className="alert-heading fw-bold mb-1">¡Posible duplicado!</h5>
                  <p className="mb-0 small text-dark">
                    Ya tienes un viaje guardado con el ID <strong>{voucher.voucher_number}</strong>. 
                    Si subiste la misma foto por accidente, usa el botón "Cancelar y Borrar".
                  </p>
                </div>
              </div>
            )}
            
            {!isEditing ? (
              <div className="animate__animated animate__fadeIn">
                <h2 className="h5 fw-bold text-primary mb-4">Datos Identificados</h2>
                
                <div className="mb-3">
                  <small className="text-muted d-block fw-semibold mb-1">ID Extraído</small>
                  <span className={`fs-5 ${voucher.voucher_number === 'POR_REVISAR' && 'text-danger fw-bold'}`}>
                    {voucher.voucher_number !== 'POR_REVISAR' ? voucher.voucher_number : 'No se encontró ID'}
                  </span>
                </div>

                <div className="mb-3">
                  <small className="text-muted d-block fw-semibold mb-1">Fecha</small>
                  <span className="fs-5">
                    {new Date(voucher.voucher_date).toLocaleDateString('es-CL', { timeZone: 'UTC' })}
                  </span>
                </div>

                <div className="mb-4">
                  <small className="text-muted d-block fw-semibold mb-1">Mundo (Compañía)</small>
                  <span className="fs-5">
                    {voucher.companies?.name || 'No se identificó el mundo'}
                  </span>
                </div>
                
                <hr className="my-4" />

                <h3 className="h6 fw-bold text-dark text-center mb-3">
                  ¿La información es correcta?
                </h3>
                <p className="text-muted small text-center mb-4">
                  Tu respuesta permitirá entrenar de mejor manera el analizador.
                </p>

                <div className="d-flex flex-column flex-sm-row justify-content-center gap-3">
                  <button 
                    onClick={handleConfirm}
                    disabled={loading}
                    className="btn btn-success d-flex align-items-center justify-content-center gap-2 fw-medium px-4 py-2"
                  >
                    <CheckCircle size={20} />
                    {loading ? 'Guardando...' : 'Sí, es correcta'}
                  </button>
                  
                  <button 
                    onClick={() => setIsEditing(true)}
                    disabled={loading}
                    className="btn btn-danger d-flex align-items-center justify-content-center gap-2 fw-medium px-4 py-2"
                  >
                    <XCircle size={20} />
                    No, editar manual
                  </button>
                </div>
              </div>

            ) : (
              <div className="animate__animated animate__fadeIn">
                <h2 className="h5 fw-bold text-danger mb-4">Corregir Información</h2>
                
                <form action={handleEditSubmit}>
                  <div className="mb-3">
                    <label htmlFor="identifier" className="form-label fw-semibold text-secondary">Identificador</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      id="identifier" 
                      name="identifier" 
                      defaultValue={voucher.voucher_number !== 'POR_REVISAR' ? voucher.voucher_number : ''}
                      required 
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="date" className="form-label fw-semibold text-secondary">Fecha</label>
                    <input 
                      type="date" 
                      className="form-control" 
                      id="date" 
                      name="date" 
                      defaultValue={formattedDateForInput}
                      required 
                    />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="company" className="form-label fw-semibold text-secondary">Mundo</label>
                    <select 
                      className="form-select" 
                      id="company" 
                      name="company_id" 
                      defaultValue={voucher.voucher_company_id}
                      required
                    >
                      {companies.map((company) => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="d-flex justify-content-end gap-2 mt-4">
                    <button 
                      type="button" 
                      className="btn btn-light fw-medium"
                      onClick={() => setIsEditing(false)}
                      disabled={loading}
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary fw-medium px-4"
                      disabled={loading}
                    >
                      {loading ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>
      </div>

      <div className="col-12 col-md-6">
        <div className="card shadow-sm border-0 h-100">
        </div>
      </div>
    </div>
  )
}