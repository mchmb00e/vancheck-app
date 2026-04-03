import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request) {
  const pathname = request.nextUrl.pathname
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value
        },
        set(name, value, options) {
          request.cookies.set({ name, value, ...options })
          supabaseResponse = NextResponse.next({
            request: { headers: request.headers },
          })
          supabaseResponse.cookies.set({ name, value, ...options })
        },
        remove(name, options) {
          request.cookies.set({ name, value: '', ...options })
          supabaseResponse = NextResponse.next({
            request: { headers: request.headers },
          })
          supabaseResponse.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isAuthRoute = ['/login', '/signup', '/forgot-password', '/terminos-y-condiciones'].some(route => 
    pathname.startsWith(route)
  )
  const isCallbackRoute = pathname.startsWith('/auth/callback')
  const isRoot = pathname === '/'
  
  // Identificamos si la ruta es alguna de análisis
  const isAnalysisRoute = pathname.startsWith('/dashboard/analysis')

  // 1. Si no hay usuario y trata de entrar a rutas protegidas -> pa' fuera
  if (!user && !isAuthRoute && !isCallbackRoute && !isRoot) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 2. Si hay usuario y trata de entrar al login/signup -> al dashboard
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // 3. LA BARRERA DE SEGURIDAD: Si está logueado y quiere entrar a análisis
  if (user && isAnalysisRoute) {
    // Usamos maybeSingle() en vez de single() para que no tire error si hay 0 resultados
    const { data: userData, error } = await supabase
      .from('users')
      .select('is_allowed')
      .eq('id', user.id)
      .maybeSingle()

    // Si userData es nulo, o si is_allowed es falso, lo rebotamos
    if (!userData || userData.is_allowed === false) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}