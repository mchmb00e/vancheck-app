export const runtime = 'nodejs'

import Link from 'next/link'
import {
  Check2Square,
  ArrowLeft
} from 'react-bootstrap-icons'

export const metadata = {
  title: 'Administración | VanCheck',
};

function Item({ title, description, path, disabled, icon }) {
  const href = disabled ? '#' : (path || '#')

  return (
    <div className="col-12 col-md-6 mb-4">
      <Link
        href={href}
        className={`text-decoration-none ${disabled ? 'pe-none opacity-50' : ''}`}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : undefined}
      >
        <div className="card h-100 shadow-sm bg-light hover-shadow transition">
          <div className="card-body d-flex flex-column gap-2">
            <div className="d-flex align-items-center gap-2">
              <div className="text-primary d-flex align-items-center">
                {icon}
              </div>
              <h3 className="card-title h5 text-dark m-0">{title}</h3>
            </div>
            <p className="card-text text-secondary m-0">{description}</p>
          </div>
        </div>
      </Link>
    </div>
  )
}

export default function AdminDashboardPage() {
  return (
    <main className="container py-5">
      <header className="mb-4">
        <h1 className="display-5 fw-bold text-dark">
          Administración
        </h1>
        <p className="text-secondary fs-5">
          Panel de control exclusivo para la gestión de la plataforma.
        </p>
      </header>

      <section>
        <div className="row">
          <Item
            title="Verificar vouchers"
            description="Entrenamiento bruto de inteligencia artificial."
            path="/dashboard/admin/voucher-verify"
            icon={<Check2Square className="text-black" size={24} />}
          />
        </div>

        <hr className="my-4 text-secondary opacity-25" />

        <div className="row mt-3">
          <div className="col-12 col-md-4 mb-3">
            <Link
              href="/dashboard"
              className="btn btn-outline-secondary w-100 py-2 d-flex align-items-center justify-content-center gap-2 shadow-sm"
            >
              <ArrowLeft size={20} />
              <span className="fw-semibold">Volver al Dashboard</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}