export const metadata = {
  title: 'Gestión de Vouchers | VanCheck',
};

import Link from 'next/link';
import { FileEarmarkPlus, Images, Folder2Open } from 'react-bootstrap-icons';

// Componente Item reutilizable adaptado para 3 columnas (col-md-4)
function Item({ title, description, path, disabled, icon }) {
  const href = disabled ? '#' : (path || '#');

  return (
    <div className="col-12 col-md-4 mb-4">
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
  );
}

export default function VoucherHubPage() {
  return (
    <main className="container py-5" style={{ maxWidth: '900px' }}>
      
      <header className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
        <h1 className="display-6 fw-bold text-dark m-0">Gestión de Vouchers</h1>
        <Link href="/dashboard" className="btn btn-outline-dark fw-medium px-4">
          Volver
        </Link>
      </header>

      <div className="row mt-2">
        <Item 
          title="Añadir un voucher" 
          description="Agrega un voucher escribiendo sus datos de forma manual o usando un escaneo automático del voucher."
          path="/dashboard/voucher/individual" 
          icon={<FileEarmarkPlus className="text-black" size={24} />}
        />
        <Item 
          title="Añadir varios vouchers" 
          description="Agrega vouchers de forma masiva haciendo uso exclusivo del escaneo automático de imágenes."
          path="/dashboard/voucher/massive"
          icon={<Images className="text-black" size={24} />}
        />
        <Item 
          title="Gestionar mis vouchers" 
          description="Agrega, edita, elimina y visualiza los datos e imágenes subidas de tus vouchers."
          path="/dashboard/voucher/manage"
          icon={<Folder2Open className="text-black" size={24} />}
        />
      </div>
      
    </main>
  );
}