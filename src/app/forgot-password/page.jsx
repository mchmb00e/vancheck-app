'use client'

import { useState } from 'react'
import { requestPasswordReset } from '@/app/actions/auth'
import Link from 'next/link'

export const metadata = {
  title: 'Recuperar contraseña | VanCheck',
};

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    setError(null)

    const formData = new FormData(e.target)
    const result = await requestPasswordReset(formData)

    if (result.success) {
      setMessage(result.message)
    } else {
      setError(result.error)
    }
    setLoading(false)
  }

  return (
    <main className="container py-5" style={{ maxWidth: '500px' }}>
      <div className="card shadow-sm border-0 bg-light p-4">
        <h1 className="h4 fw-bold mb-3 text-center">Recuperar Contraseña</h1>
        <p className="text-muted text-center mb-4 small">
          Ingresa tu correo y te enviaremos un link mágico para que puedas crear una clave nueva.
        </p>

        {message && (
          <div className="alert alert-success shadow-sm border-0 animate__animated animate__fadeIn">
            {message}
          </div>
        )}

        {error && (
          <div className="alert alert-danger shadow-sm border-0 animate__animated animate__shakeX">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="form-label fw-medium">Correo electrónico</label>
            <input 
              type="email" 
              name="email" 
              id="email" 
              className="form-control" 
              required 
              placeholder="tu@correo.com"
            />
          </div>

          <button type="submit" className="btn btn-primary w-100 fw-bold mb-3" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar link de recuperación'}
          </button>
        </form>
        
        <div className="text-center mt-3">
          <Link href="/login" className="text-decoration-none text-secondary small">
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </main>
  )
}