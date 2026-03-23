'use client'

import { useState, useEffect } from 'react'
import { signUp } from '@/app/actions/auth'
import Link from 'next/link'
import Image from 'next/image'

export default function SignupPage() {
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)



  useEffect(() => {
    document.title = 'Registrarse | VanCheck'; // El texto que tengas puesto ahí
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)

    const formData = new FormData(e.target)

    const name = formData.get('name')
    const lastName = formData.get('last_name')

    if (name) formData.set('name', name.trim())
    if (lastName) formData.set('last_name', lastName.trim())

    const result = await signUp(formData)

    if (result?.error) {
      setErrorMsg(result.error)
      setLoading(false)
    }
  }

  return (
    <main style={{ maxWidth: '400px', margin: '50px auto', fontFamily: 'sans-serif', padding: '0 20px' }}>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
        <Image
          src="/logo.webp"
          alt="Logo VanCheck"
          width={250}
          height={100}
          style={{ objectFit: 'contain' }}
          priority
        />
      </div>

      <h1 style={{ fontSize: '1.4rem', textAlign: 'center', marginBottom: '25px', color: '#333' }}>
        Crear Cuenta
      </h1>

      {errorMsg && (
        <div style={{ color: '#842029', backgroundColor: '#f8d7da', padding: '12px', borderRadius: '6px', textAlign: 'center', marginBottom: '15px', fontWeight: '500', fontSize: '0.9rem' }}>
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label htmlFor="name" style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Nombre:</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Tu nombre"
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
          />
        </div>

        <div>
          <label htmlFor="last_name" style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Apellido:</label>
          <input
            id="last_name"
            name="last_name"
            type="text"
            required
            placeholder="Tu apellido"
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
          />
        </div>

        <div>
          <label htmlFor="rut" style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>RUT (Sin puntos ni guión):</label>
          <input
            id="rut"
            name="rut"
            type="text"
            required
            placeholder="Ej: 12345678K"
            minLength={8}
            maxLength={9}
            pattern="[0-9]{7,8}[0-9Kk]"
            title="Ingresa entre 8 y 9 caracteres, terminando en número o K"
            onInput={(e) => e.target.value = e.target.value.replace(/[^0-9kK]/gi, '').toUpperCase()}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
          />
        </div>

        <div>
          <label htmlFor="tel" style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Teléfono (9XXXXXXXX):</label>
          <input
            id="tel"
            name="tel"
            type="text"
            required
            maxLength={9}
            pattern="9[0-9]{8}"
            title="Debe empezar con 9 y tener exactamente 9 números"
            onInput={(e) => e.target.value = e.target.value.replace(/[^0-9]/g, '')}
            placeholder="912341234"
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
          />
        </div>

        <div>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Correo electrónico:</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="micorreo@mail.com"
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
          />
        </div>

        <div>
          <label htmlFor="password" style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Contraseña (Mínimo 4 carácteres):</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={4}
            placeholder="****"
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
          />
        </div>

        <p>
          Al continuar el registro, estás aceptando los<a href="/terminos-y-condiciones" target="_blank"> términos y condiciones</a>.
        </p>

        <button
          type="submit"
          disabled={loading}
          style={{ padding: '12px', background: loading ? '#6c757d' : '#0d6efd', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '1rem', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '10px' }}
        >
          {loading ? 'Registrando...' : 'Registrarse'}
        </button>
      </form>

      <div style={{ marginTop: '25px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
        <p style={{ margin: 0, color: '#555' }}>
          ¿Ya tienes cuenta? <Link href="/login" style={{ color: '#0d6efd', fontWeight: '600', textDecoration: 'none' }}>Inicia sesión</Link>
        </p>
      </div>

    </main>
  )
}