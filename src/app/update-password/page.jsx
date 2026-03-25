'use client'

import { useState, useEffect } from 'react'
import { updatePassword } from '@/app/actions/auth'

export default function UpdatePasswordPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)


  useEffect(() => {
    document.title = 'Actualizar contraseña | VanCheck';
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.target)
    
    if (formData.get('password') !== formData.get('confirmPassword')) {
      setError('Las contraseñas no coinciden. Fíjate bien.')
      setLoading(false)
      return
    }

    const result = await updatePassword(formData)

    if (result && !result.success) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <main className="container py-5" style={{ maxWidth: '500px' }}>
      <div className="card shadow-sm border-0 bg-light p-4">
        <h1 className="h4 fw-bold mb-3 text-center">Crear Nueva Contraseña</h1>
        <p className="text-muted text-center mb-4 small">
          Estás a un paso. Escribe tu nueva contraseña y asegúrate de no olvidarla esta vez.
        </p>

        {error && (
          <div className="alert alert-danger shadow-sm border-0 animate__animated animate__shakeX">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="password" className="form-label fw-medium">Nueva Contraseña</label>
            <input 
              type="password" 
              name="password" 
              id="password" 
              className="form-control" 
              required 
              minLength={6}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="confirmPassword" className="form-label fw-medium">Repite la Contraseña</label>
            <input 
              type="password" 
              name="confirmPassword" 
              id="confirmPassword" 
              className="form-control" 
              required 
              minLength={6}
            />
          </div>

          <button type="submit" className="btn btn-success w-100 fw-bold" disabled={loading}>
            {loading ? 'Guardando...' : 'Actualizar y Entrar'}
          </button>
        </form>
      </div>
    </main>
  )
}