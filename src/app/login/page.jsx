import { signIn } from '@/app/actions/auth'
import Link from 'next/link'
import Image from 'next/image'

export const metadata = {
  title: 'Iniciar sesión | VanCheck',
};

export default async function LoginPage({ searchParams }) {
  const params = await searchParams
  const message = params?.message
  const error = params?.error

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
        VanCheck: Analiza tus viajes y no pierdas pagos
      </h1>
      
      {message && (
        <div style={{ color: '#0f5132', backgroundColor: '#d1e7dd', border: '1px solid #badbcc', padding: '12px', borderRadius: '6px', textAlign: 'center', marginBottom: '20px' }}>
          {message}
        </div>
      )}

      {error && (
        <div style={{ color: '#842029', backgroundColor: '#f8d7da', border: '1px solid #f5c2c7', padding: '12px', borderRadius: '6px', textAlign: 'center', marginBottom: '20px' }}>
          <strong>¡Error al iniciar sesión!</strong><br />
          {error}
        </div>
      )}

      <form action={signIn} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
            Correo Electrónico
          </label>
          <input 
            id="email" 
            name="email" 
            type="email" 
            required 
            placeholder="tu@correo.com"
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
          />
        </div>

        <div>
          <label htmlFor="password" style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
            Contraseña
          </label>
          <input 
            id="password" 
            name="password" 
            type="password" 
            required 
            placeholder="********"
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
          />
        </div>

        <button 
          type="submit" 
          style={{ padding: '12px', background: '#0d6efd', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}
        >
          Iniciar Sesión
        </button>
      </form>

      <div style={{ marginTop: '25px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
        <p style={{ margin: 0, color: '#555' }}>
          ¿No tienes cuenta? <Link href="/signup" style={{ color: '#0d6efd', fontWeight: '600', textDecoration: 'none' }}>Crea una</Link>
        </p>
        
        <Link href="/forgot-password" style={{ color: '#6c757d', fontSize: '0.9rem', textDecoration: 'underline' }}>
          ¿Olvidaste tu contraseña?
        </Link>
      </div>

    </main>
  )
}