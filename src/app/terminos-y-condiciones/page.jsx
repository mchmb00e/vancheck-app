import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeftCircle, ShieldLockFill, ExclamationTriangleFill } from 'react-bootstrap-icons'

export const metadata = {
  title: 'Términos y Condiciones | VanCheck',
}

export default function TerminosPage() {
  return (
    <div className="bg-light min-vh-100 pb-5">
      
      {/* NAVBAR SIMPLE PARA VOLVER */}
      <nav className="navbar navbar-light bg-white shadow-sm sticky-top py-3">
        <div className="container">
          <Link className="navbar-brand fs-4 d-flex align-items-center" href="/">
            <Image src="/logo.webp" alt="VanCheck Logo" width={28} height={28} className="me-2" />
            <span className="text-dark fw-bold">Van</span>
            <span className="text-primary fw-bolder">Check</span>
          </Link>
          <Link href="/" className="btn btn-outline-dark btn-sm fw-medium d-flex align-items-center gap-2">
            <ArrowLeftCircle /> Volver al inicio
          </Link>
        </div>
      </nav>

      <main className="container py-5" style={{ maxWidth: '800px' }}>
        
        <header className="text-center mb-5">
          <ShieldLockFill size={48} className="text-primary mb-3" />
          <h1 className="display-6 fw-bold text-dark mb-3">Términos y Condiciones de Uso</h1>
          <p className="text-muted">Última actualización: {new Date().toLocaleDateString('es-CL')}</p>
        </header>

        <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5 bg-white">
          
          <div className="alert alert-primary bg-primary bg-opacity-10 border-0 d-flex gap-3 mb-5">
            <ExclamationTriangleFill size={24} className="text-primary flex-shrink-0 mt-1" />
            <p className="mb-0 small text-dark">
              <strong>Importante:</strong> Al registrarte y utilizar VanCheck, aceptas los siguientes términos. Te recomendamos leerlos con atención antes de comenzar a subir tus documentos.
            </p>
          </div>

          <section className="mb-5">
            <h3 className="h5 fw-bold text-dark mb-3">1. Naturaleza del Servicio y Exención de Responsabilidad</h3>
            <p className="text-secondary mb-3">
              VanCheck es una herramienta de apoyo tecnológico y gestión personal diseñada para facilitar el cruce de información entre vouchers de viaje y planillas de pago. <strong>VanCheck no es un servicio de contabilidad oficial, auditoría legal ni financiera.</strong>
            </p>
            <p className="text-secondary mb-0">
              Nuestro sistema utiliza modelos de Inteligencia Artificial (OCR) para extraer datos de imágenes y documentos PDF. Aunque la tecnología tiene un alto nivel de precisión, <strong>está sujeta a un margen de error</strong>. El usuario comprende y acepta que es su responsabilidad exclusiva revisar, verificar y validar los datos extraídos antes de utilizarlos para emitir reclamos, cobros o cualquier gestión ante su empleador o terceros. VanCheck no se responsabiliza por pérdidas económicas derivadas de lecturas incorrectas o datos no detectados.
              Solo en el caso del <b>Plan Soporte</b>, el equipo de soporte es el responsable de entregar resultados confiables bajo los datos entregados por el usuario, es de completa responsabilidad del usuario entregar los vouchers y planilla correspondientes para un correcto análisis.
            </p>
          </section>

          <section className="mb-5">
            <h3 className="h5 fw-bold text-dark mb-3">2. Privacidad y Manejo de Datos Sensibles</h3>
            <p className="text-secondary mb-3">
              Para el correcto funcionamiento del servicio, VanCheck procesa y almacena imágenes de vouchers y archivos PDF de planillas de pago. Estos archivos son procesados utilizando infraestructuras seguras de terceros (como Google Cloud y plataformas de almacenamiento en la nube cifradas).
            </p>
            <p className="text-secondary mb-3">
              <strong>Tus datos son tuyos.</strong> VanCheck se compromete a no vender, comercializar ni distribuir tus documentos personales, financieros, ni tus datos de contacto a terceros ajenos a la operación básica del sistema.
            </p>
            <p className="text-secondary mb-0">
                Un administrador podría verificar en forma confidencial tus datos (vouchers y planillas) siempre y cuando se haya abierto un ticket de soporte por los canales de comunicación oficiales (Módulo de soporte web y WhatsApp).
            </p>
          </section>

          <section className="mb-5">
            <h3 className="h5 fw-bold text-dark mb-3">3. Disponibilidad del Servicio (SLA)</h3>
            <p className="text-secondary mb-0">
              El servicio de VanCheck se proporciona "tal cual" (as is). Nos esforzamos por mantener la plataforma operativa las 24 horas del día, los 7 días de la semana. Sin embargo, no garantizamos que el servicio sea ininterrumpido o libre de errores operativos. VanCheck no asume responsabilidad alguna por lucro cesante, retrasos en pagos o perjuicios que el usuario pueda sufrir debido a caídas temporales de los servidores, mantenimientos programados o problemas técnicos imprevistos.
            </p>
          </section>

          <section className="mb-5">
            <h3 className="h5 fw-bold text-dark mb-3">4. Soporte de la aplicación y Plan Soporte</h3>
            
            <p className="text-secondary mb-3">
              Los usuarios pueden comunicarse con el equipo de soporte de VanCheck para resolver dudas o problemas a través de los siguientes canales oficiales:
            </p>
            <ul className="text-secondary mb-3">
              <li>Mensajería de WhatsApp.</li>
              <li>Módulo de soporte integrado dentro de la aplicación.</li>
            </ul>
            <p className="text-secondary mb-4">
              El horario de atención oficial del administrador es de <strong>lunes a viernes de 9:00 a 18:00 horas</strong>. El administrador podrá, a su entera discreción, responder consultas o requerimientos en horarios complementarios o fines de semana, sin que esto constituya una obligación o compromiso permanente por parte de la plataforma.
            </p>

            <h4 className="h6 fw-bold text-dark mb-3">Condiciones especiales para usuarios del Plan Soporte</h4>
            <p className="text-secondary mb-3">
              El "Plan Soporte" está pensado especialmente para aquellos usuarios a los que se les dificulta el uso de plataformas web y desean delegar la carga y tener una gestión más personalizada de sus datos.
            </p>
            <ul className="text-secondary mb-0">
              <li className="mb-2">
                <strong>Privacidad y acceso a datos:</strong> Al contratar este plan, el usuario acepta y autoriza expresamente que un administrador de VanCheck tendrá acceso al 100% de los datos registrados en la aplicación bajo su cuenta, incluyendo sus archivos personales (vouchers y planillas).
              </li>
              <li className="mb-2">
                <strong>Metodología de trabajo:</strong> Al iniciar el plan, el usuario y el administrador deberán fijar de mutuo acuerdo la vía de recepción de los archivos (vouchers y planillas) y el formato en el que el usuario desea recibir los resultados del análisis. Estos métodos y tiempos están sujetos a modificaciones en cualquier momento, con el fin de priorizar la comodidad de ambas partes.
              </li>
              <li className="mb-2">
                <strong>Revisión de calidad:</strong> A diferencia de los planes 100% automatizados, los resultados generados a través del Plan Soporte incluyen una revisión humana exhaustiva antes de ser entregados al usuario, asegurando una capa adicional de calidad en el proceso.
              </li>
              <li className="mb-0">
                <strong>Tiempos de entrega (SLA):</strong> El plazo máximo para el envío de los resultados del análisis por parte del administrador es de <strong>48 horas</strong>. Este plazo se calcula haciendo uso exclusivo del horario oficial de soporte (lunes a viernes de 9:00 a 18:00 hrs).
              </li>
            </ul>
          </section>

          <section className="mb-5">
            <h3 className="h5 fw-bold text-dark mb-3">5. Conducta del Usuario y Mal Uso de la Plataforma</h3>
            <p className="text-secondary mb-3">
              El usuario se compromete a utilizar VanCheck de buena fe y exclusivamente con documentos legítimos que le pertenezcan o sobre los cuales tenga autorización de uso.
            </p>
            <p className="text-secondary mb-0">
              Queda estrictamente prohibido subir documentos adulterados, vouchers falsificados, material ilegal o intentar vulnerar la seguridad de la plataforma. VanCheck se reserva el derecho absoluto de <strong>suspender o eliminar definitivamente</strong> cualquier cuenta que infrinja esta norma o que haga un uso abusivo del sistema, sin derecho a reembolso de las suscripciones pagadas.
            </p>
          </section>

          <section className="mb-5">
            <h3 className="h5 fw-bold text-dark mb-3">6. Pagos y reembolsos</h3>
            
            <p className="text-secondary mb-3">
              Al contratar VanCheck, el usuario acepta las siguientes condiciones respecto a la facturación, cobros y naturaleza del servicio:
            </p>
            
            <ul className="text-secondary mb-4">
              <li className="mb-2">
                <strong>Naturaleza del pago:</strong> El pago de la suscripción constituye única y exclusivamente una licencia de uso mensual de la plataforma. En ningún caso este pago otorga al usuario derechos de propiedad, participación accionaria o calidad de colaborador sobre el proyecto VanCheck.
              </li>
              <li className="mb-2">
                <strong>Tarifa definitiva:</strong> El monto establecido desde tu pago inicial es de carácter definitivo. Dicho valor base no sufrirá incrementos a menos que el usuario esté expresamente de acuerdo con el cambio (por ejemplo, al solicitar una mejora de plan).
              </li>
              <li className="mb-0">
                <strong>Ciclo de facturación y plazos:</strong> El cobro de la suscripción es mensual y se emite el mismo día en que se contrató originalmente el servicio. El usuario contará con un periodo de gracia de <strong>5 días hábiles</strong> para realizar el pago correspondiente. Transcurrido este plazo sin recibir el pago, la cuenta y sus funciones serán inhabilitadas temporalmente hasta regularizar la situación.
              </li>
            </ul>

            <h4 className="h6 fw-bold text-dark mb-3">Políticas de Reembolso</h4>
            <p className="text-secondary mb-3">
              La devolución del dinero correspondiente a una mensualidad pagada procederá única y exclusivamente bajo los siguientes escenarios:
            </p>
            
            <ul className="text-secondary mb-0">
              <li className="mb-2">
                <strong>Reembolso sin causa:</strong> El usuario podrá solicitar la devolución íntegra de su dinero, sin necesidad de justificación, siempre y cuando la solicitud se realice dentro de los <strong>3 días hábiles</strong> posteriores a la fecha del pago, siempre y cuando el usuario no haya hecho uso de las siguientes funcionalidades: Análisis automático de vouchers, análisis masivo de vouchers, análisis de planillas y resultados.
              </li>
              <li className="mb-0">
                <strong>Reembolso por faltas de calidad (Exclusivo Plan Soporte):</strong> Para los usuarios que hayan contratado el "Plan Soporte", procederá un reembolso en caso de comprobarse faltas graves y reiteradas en la calidad del análisis y entrega de los resultados por parte del administrador.
              </li>
            </ul>
          </section>

          <section className="text-center">
            <h3 className="h6 fw-bold text-dark mb-3">¿Tienes dudas sobre estos términos?</h3>
            <p className="text-secondary small mb-4">
              Si algo no te queda claro, no dudes en contactarnos directamente antes de usar la plataforma.
            </p>
            <a href="https://wa.me/56933372677" target="_blank" rel="noreferrer" className="btn btn-outline-success fw-medium">
              Contactar a soporte
            </a>
          </section>
          

        </div>
      </main>
    </div>
  )
}