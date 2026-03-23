export const metadata = {
  title: 'Gestión de Vouchers | VanCheck',
};

import Link from 'next/link';

export default function VoucherHubPage() {
  return (
    <main className="container py-5" style={{ maxWidth: '900px' }}>
      
      {/* Estilos CSS puros para el hover, así evitamos el error del Server Component */}
      <style>{`
        .hover-card {
          transition: transform 0.2s ease-in-out;
          cursor: pointer;
        }
        .hover-card:hover {
          transform: scale(1.03);
        }
      `}</style>

      <header className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
        <h1 className="display-6 fw-bold text-dark m-0">Gestión de Vouchers</h1>
        <Link href="/dashboard" className="btn btn-outline-dark fw-medium px-4">
          Volver
        </Link>
      </header>

      <div className="row g-4 mt-2">
        {/* Card: Añadir Individual */}
        <div className="col-md-4">
          <Link href="/dashboard/voucher/individual" className="text-decoration-none">
            <div className="card h-100 shadow-sm border-0 bg-white hover-card">
              <div className="card-body d-flex flex-column">
                <h5 className="card-title text-primary fw-bold mb-3">Añadir individual</h5>
                <p className="card-text text-muted small mb-0">
                  Agrega un voucher escribiendo sus datos de forma manual o usando un escaneo automático del voucher.
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* Card: Añadir Masivo */}
        <div className="col-md-4">
          <Link href="/dashboard/voucher/massive" className="text-decoration-none">
            <div className="card h-100 shadow-sm border-0 bg-white hover-card">
              <div className="card-body d-flex flex-column">
                <h5 className="card-title text-primary fw-bold mb-3">Añadir masivamente</h5>
                <p className="card-text text-muted small mb-0">
                  Agrega vouchers de forma masiva haciendo uso exclusivo del escaneo automático de imágenes.
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* Card: Gestionar */}
        <div className="col-md-4">
          <Link href="/dashboard/voucher/manage" className="text-decoration-none">
            <div className="card h-100 shadow-sm border-0 bg-white hover-card">
              <div className="card-body d-flex flex-column">
                <h5 className="card-title text-primary fw-bold mb-3">Gestionar vouchers</h5>
                <p className="card-text text-muted small mb-0">
                  Agrega, edita, elimina y visualiza los datos e imágenes subidas de tus vouchers.
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}