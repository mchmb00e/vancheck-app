'use client'

import { useState } from 'react'
import { createVehicle } from '@/app/actions/vehicle'

export default function VehicleForm() {
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    setSuccess(false)

    const formData = new FormData(e.target)

    try {
      await createVehicle(formData)
      setSuccess(true)
      e.target.reset()
      setTimeout(() => setSuccess(false), 4000)
    } catch (err) {
      setErrorMsg(err.message || 'Ocurrió un error al guardar el vehículo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card shadow-sm border-0 bg-light mb-5">
      <div className="card-body p-4">
        
        {success && (
          <div className="alert alert-success d-flex flex-column align-items-center text-center p-3 mb-4 animate__animated animate__fadeIn">
            <h5 className="fw-bold m-0">¡Vehículo registrado con éxito!</h5>
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
              <label htmlFor="name" className="form-label fw-semibold text-secondary">Nombre del vehículo (Apodo)</label>
              <input 
                type="text" 
                className="form-control" 
                id="name" 
                name="name" 
                placeholder="Ej: Furgón Blanco" 
                required 
              />
            </div>
            
            <div className="col-12 col-md-6">
              <label htmlFor="patent" className="form-label fw-semibold text-secondary">Patente</label>
              <input 
                type="text" 
                className="form-control text-uppercase" 
                id="patent" 
                name="patent" 
                placeholder="Ej: ABCD12" 
                required 
              />
            </div>
          </div>
          
          <div className="mt-4 text-end">
            <button type="submit" className="btn btn-primary px-4 fw-medium" disabled={loading}>
              {loading ? 'Guardando...' : 'Añadir Vehículo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}