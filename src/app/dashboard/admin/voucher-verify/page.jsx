export const runtime = 'nodejs'

import VerifyClient from './VerifyClient'
import { getCompanies } from '@/app/actions/admin'

export const metadata = {
  title: 'Verificar Vouchers | Admin | VanCheck',
}

export default async function VoucherVerifyPage() {
  // Traemos las empresas desde el servidor de una
  const companies = await getCompanies()

  return (
    <main className="container-fluid py-4" style={{ height: 'calc(100vh - 80px)' }}>
      <header className="mb-3 px-2">
        <h1 className="h3 fw-bold text-dark m-0">Verificación de Vouchers (QA)</h1>
        <p className="text-secondary m-0">Entrenamiento de IA mediante verificación humana.</p>
      </header>
      
      {/* Pasamos la pega al cliente */}
      <VerifyClient companies={companies} />
    </main>
  )
}