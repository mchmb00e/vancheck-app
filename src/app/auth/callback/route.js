import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  // ✨ DETERMINAMOS EL ORIGEN REAL
  // Si estamos en Railway, usamos tu dominio. Si no, usamos localhost.
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vancheck-app-production.up.railway.app'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Error canjeando código:', error)
      return NextResponse.redirect(`${origin}/login?error=fallo_canje`)
    }
    
    return NextResponse.redirect(`${origin}${next}`)
  }

  return NextResponse.redirect(`${origin}/login?error=falta_codigo`)
}