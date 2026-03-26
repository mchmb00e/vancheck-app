import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  // ✨ Buscamos 'next' o 'redirectTo' (que es el que usa Supabase en auth)
  const next = searchParams.get('next') ?? searchParams.get('redirectTo') ?? '/'

  if (code) {
    const supabase = await createClient()
    
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Error en callback:', error)
      return NextResponse.redirect(`${origin}/login?error=fallo_canje`)
    }
    
    // Redirigimos a la ruta capturada
    return NextResponse.redirect(`${origin}${next}`)
  }

  return NextResponse.redirect(`${origin}/login?error=falta_codigo`)
}