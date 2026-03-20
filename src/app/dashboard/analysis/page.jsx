import Link from 'next/link'
import { Stars, JournalCheck } from 'react-bootstrap-icons'

export const metadata = {
  title: 'Análisis | VanCheck',
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
        <div className="card h-100 shadow-sm bg-light hover-shadow transition border-0">
          <div className="card-body d-flex flex-column gap-2 p-4">
            <div className="d-flex align-items-center gap-3">
              <div className="text-primary d-flex align-items-center">
                {icon}
              </div>
              <h3 className="card-title h5 text-dark m-0 fw-bold">{title}</h3>
            </div>
            <p className="card-text text-secondary m-0">{description}</p>
          </div>
        </div>
      </Link>
    </div>
  )
}

export default function AnalysisIndexPage() {
  return (
    <main className="container py-5" style={{ maxWidth: '900px' }}>
      
      <header className="d-flex justify-content-between align-items-center mb-5 border-bottom pb-3">
        <h1 className="display-6 fw-bold text-dark m-0">Análisis de planillas</h1>
        <Link href="/dashboard" className="btn btn-outline-dark fw-medium px-4">
          Volver
        </Link>
      </header>

      <section className="row mt-4">
        <Item 
          title="Analizar documento" 
          description="Selecciona una planilla y crúzala con tus vouchers para encontrar pagos pendientes."
          path="/dashboard/analysis/model" 
          icon={<Stars className="text-primary" size={28} />}
        />
        <p>Se están trabajando nuevas funcionalidades...</p>
      </section>

    </main>
  )
}