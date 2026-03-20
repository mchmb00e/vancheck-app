// src/app/page.js
import LandingClient from './LandingClient'

export const metadata = {
  title: 'VanCheck Chile - Analiza tus viajes y no pierdas pagos',
  description: 'La herramienta definitiva para choferes en Chile. Automatiza el control de tus vouchers, analiza tus planillas de pago y asegura que no te falte ni un peso.',
  keywords: ['VanCheck', 'control de pagos', 'vouchers transporte', 'choferes chile', 'automatización transporte', 'análisis de planillas'],
  alternates: { canonical: 'https://www.vancheck.cl' },
  openGraph: {
    title: 'VanCheck: Analiza tus viajes y asegura tus pagos',
    description: 'Control automatizado de vouchers. ¡No regales tu trabajo!',
    url: 'https://www.vancheck.cl',
    siteName: 'VanCheck Chile',
    images: [{ url: '/logo.webp', width: 1200, height: 630, alt: 'VanCheck Chile' }],
    locale: 'es_CL',
    type: 'website',
  },
}

export default function LandingPage() {
  return <LandingClient />
}