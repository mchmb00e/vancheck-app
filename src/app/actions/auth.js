'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma' 
import { logAuthAction } from '@/app/actions/logs'

/* Gestiona el ciclo de vida de autenticación: registro con validación de RUT chileno, inicio y cierre de sesión, y recuperación de cuentas, integrando un sistema de trazabilidad mediante auth_logs. */

function validarRUT(rut) {
  if (!/^[0-9]+[0-9kK]$/.test(rut)) return false
  
  const cleanRut = rut.toUpperCase()
  let t = parseInt(cleanRut.slice(0, -1), 10)
  let m = 0
  let s = 1
  
  while (t > 0) {
    s = (s + (t % 10) * (9 - (m++ % 6))) % 11
    t = Math.floor(t / 10)
  }
  
  const v = s > 0 ? '' + (s - 1) : 'K'
  return v === cleanRut.slice(-1)
}

export async function signUp(formData) {
  const supabase = await createClient() 

  const email = formData.get('email')
  const password = formData.get('password')
  const name = formData.get('name')
  const last_name = formData.get('last_name')
  const rut = formData.get('rut')
  const tel = formData.get('tel')

  if (!email || !email.includes('@') || !email.includes('.')) {
    return { error: 'El correo electrónico no es válido.' }
  }
  if (!password || password.length < 4) {
    return { error: 'La contraseña debe tener al menos 4 caracteres.' }
  }
  if (!tel || !/^\d{9}$/.test(tel)) {
    return { error: 'El teléfono debe tener exactamente 9 dígitos.' }
  }
  if (!rut || !validarRUT(rut)) {
    return { error: 'El RUT ingresado no es válido.' }
  }

  try {
    const existeRegistro = await prisma.users.findFirst({
      where: {
        OR: [
          { email: email },
          { rut: rut },
          { tel: tel }
        ]
      }
    })

    if (existeRegistro) {
      if (existeRegistro.email === email) return { error: 'Este correo electrónico ya está registrado.' }
      if (existeRegistro.rut === rut) return { error: 'Este RUT ya se encuentra registrado en otra cuenta.' }
      if (existeRegistro.tel === tel) return { error: 'Este teléfono ya está en uso por otro usuario.' }
    }
  } catch (err) {
    // Error de base de datos silenciado
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, last_name, rut, tel }
    }
  })

  if (error) {
    if (error.message.includes('User already registered')) {
      return { error: 'Este correo electrónico ya está registrado.' }
    }
    return { error: 'Ocurrió un error al crear la cuenta. Intenta nuevamente.' }
  }

  if (data?.user) {
    await logAuthAction(data.user.id, true, `New user registered with ID: ${data.user.id}`)
  }

  redirect('/login?message=Revisa tu correo para confirmar')
}

export async function signIn(formData) {
  const supabase = await createClient()

  const email = formData.get('email')
  const password = formData.get('password')

  const userRecord = await prisma.users.findUnique({
    where: { email },
    select: { id: true }
  })

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    if (!userRecord) {
      await logAuthAction(null, false, 'Login failed: email not found')
    } else {
      await logAuthAction(userRecord.id, false, 'Login failed: invalid password')
    }
    redirect(`/login?error=${encodeURIComponent('Correo o contraseña incorrectos. Verifica tus datos e intenta nuevamente.')}`)
  }

  if (data?.user) {
    await logAuthAction(data.user.id, true, 'User logged in successfully')
  }

  redirect('/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    await logAuthAction(user.id, true, 'User logged out')
  }

  await supabase.auth.signOut()
  redirect('/login')
}

export async function requestPasswordReset(formData) {
  const email = formData.get('email')
  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/update-password`,
  })

  if (error) {
    return { success: false, error: 'No se pudo enviar el correo de recuperación.' }
  }

  return { success: true, message: 'Revisa tu bandeja de entrada para continuar.' }
}

export async function updatePassword(formData) {
  const password = formData.get('password')
  const confirmPassword = formData.get('confirmPassword')
  
  if (password !== confirmPassword) {
    return { success: false, error: 'Las contraseñas no coinciden.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({
    password: password
  })

  if (error) {
    return { success: false, error: 'Hubo un error al actualizar la contraseña.' }
  }

  redirect(`/login?message=${encodeURIComponent('Contraseña actualizada con éxito')}`)
}