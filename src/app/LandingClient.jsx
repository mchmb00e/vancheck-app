'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { 
  ShieldCheck, 
  Speedometer2, 
  Calculator, 
  CheckCircleFill, 
  CashStack,
  Headset
} from 'react-bootstrap-icons'
import 'animate.css'

// ==========================================
// COMPONENTE PARA ANIMAR AL HACER SCROLL
// ==========================================
function ScrollReveal({ children, animation = 'animate__fadeInUp', delay = 0 }) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const currentRef = ref.current
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(currentRef)
        }
      },
      { threshold: 0.15 }
    )

    if (currentRef) observer.observe(currentRef)
    return () => {
      if (currentRef) observer.unobserve(currentRef)
    }
  }, [])

  return (
    <div
      ref={ref}
      className={`${isVisible ? `animate__animated ${animation}` : 'opacity-0'}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

// ==========================================
// COMPONENTE PRINCIPAL DE LA LANDING
// ==========================================
export default function LandingClient() {
  // Estado para controlar el Acordeón de FAQ con React (sin depender del JS de Bootstrap)
  const [activeFaq, setActiveFaq] = useState(1)

  const toggleFaq = (id) => {
    setActiveFaq(activeFaq === id ? null : id)
  }

  return (
    <div className="bg-light min-vh-100 overflow-hidden">
      
      {/* NAVBAR */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top py-3">
        <div className="container">
          <Link className="navbar-brand fs-3 d-flex align-items-center" href="/">
            {/* LOGO PERSONALIZADO */}
            <Image src="/logo.webp" alt="VanCheck Logo" width={32} height={32} className="me-2" />
            <span className="text-dark fw-bold">Van</span>
            <span className="text-primary fw-bolder">Check</span>
          </Link>
          <button className="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span className="navbar-toggler-icon"></span>
          </button>
          
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav mx-auto fw-medium">
              <li className="nav-item"><a className="nav-link px-3" href="#caracteristicas">Características</a></li>
              <li className="nav-item"><a className="nav-link px-3" href="#beneficios">Beneficios</a></li>
              <li className="nav-item"><a className="nav-link px-3" href="#precios">Precios</a></li>
              <li className="nav-item"><a className="nav-link px-3" href="#faq">Preguntas Frecuentes</a></li>
            </ul>
            <div className="d-flex gap-2 mt-3 mt-lg-0">
              <Link href="/login" className="btn btn-outline-primary fw-bold px-4">
                Iniciar Sesión
              </Link>
              <a href="#precios" className="btn btn-primary fw-bold px-4">
                Contratar
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className="py-5">
        <div className="container py-5 text-center">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <ScrollReveal animation="animate__fadeInDown">
                <span className="badge bg-primary bg-opacity-10 text-primary mb-3 px-3 py-2 border border-primary-subtle rounded-pill">
                  Un software a medida para conductores
                </span>
              </ScrollReveal>
              
              <ScrollReveal animation="animate__zoomIn" delay={200}>
                <h1 className="display-4 fw-bolder text-dark mb-4">
                  Analiza tus viajes y <span className="text-primary">no pierdas pagos</span>
                </h1>
              </ScrollReveal>

              <ScrollReveal animation="animate__fadeInUp" delay={400}>
                <p className="lead text-secondary mb-5 px-md-5">
                  VanCheck cruza tus vouchers con las planillas de pago de tu empresa automáticamente. 
                  Descubre al instante si te deben plata y mantén el control total de tus ingresos.
                </p>
                <div className="d-flex flex-column flex-sm-row justify-content-center gap-3">
                  <a href="#precios" className="btn btn-primary btn-lg fw-bold px-5 py-3 shadow-sm">
                    Comenzar ahora
                  </a>
                  <a href="#contacto" className="btn btn-white btn-lg fw-bold px-5 py-3 shadow-sm border">
                    Contactar
                  </a>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </header>

      {/* CARACTERÍSTICAS */}
      <section id="caracteristicas" className="py-5 bg-white">
        <div className="container py-5">
          <ScrollReveal animation="animate__fadeIn">
            <div className="text-center mb-5">
              <h2 className="fw-bold text-dark">¿Cómo funciona VanCheck?</h2>
              <p className="text-muted">Olvídate de revisar papel por papel. Nosotros hacemos el trabajo sucio.</p>
            </div>
          </ScrollReveal>
          
          <div className="row g-4">
            <div className="col-md-4">
              <ScrollReveal animation="animate__fadeInUp" delay={100}>
                <div className="card h-100 border-0 shadow-sm bg-light p-4 text-center hover-shadow transition">
                  <div className="text-primary mb-3"><Calculator size={48} /></div>
                  <h4 className="fw-bold h5">1. Sube tus Vouchers</h4>
                  <p className="text-muted mb-0">Sube una imagen de tu voucher o ingrésalo manualmente al final del día. Quedarán guardados de forma segura.</p>
                </div>
              </ScrollReveal>
            </div>
            <div className="col-md-4">
              <ScrollReveal animation="animate__fadeInUp" delay={300}>
                <div className="card h-100 border-0 shadow-sm bg-light p-4 text-center hover-shadow transition">
                  <div className="text-primary mb-3"><Speedometer2 size={48} /></div>
                  <h4 className="fw-bold h5">2. Carga la Planilla</h4>
                  <p className="text-muted mb-0">Sube el PDF que te entrega la empresa a fin de mes. Nuestro sistema extrae todos los datos en segundos.</p>
                </div>
              </ScrollReveal>
            </div>
            <div className="col-md-4">
              <ScrollReveal animation="animate__fadeInUp" delay={500}>
                <div className="card h-100 border-0 shadow-sm bg-light p-4 text-center hover-shadow transition">
                  <div className="text-primary mb-3"><ShieldCheck size={48} /></div>
                  <h4 className="fw-bold h5">3. Cruce Automático</h4>
                  <p className="text-muted mb-0">Te mostramos exactamente qué viajes no te pagaron o qué vouchers te faltan por rendir. Cuentas claras.</p>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFICIOS */}
      <section id="beneficios" className="py-5 bg-primary text-white">
        <div className="container py-5">
          <div className="row align-items-center">
            <div className="col-lg-6 mb-4 mb-lg-0">
              <ScrollReveal animation="animate__fadeInLeft">
                <h2 className="fw-bold display-6 mb-4">No regales tu trabajo</h2>
                <p className="fs-5 mb-4 opacity-75">
                  Muchos choferes pierden entre un 5% y un 10% de sus ingresos mensuales por viajes traspapelados o errores de la empresa. VanCheck es tu copiloto contable.
                </p>
                <ul className="list-unstyled fs-5">
                  <li className="mb-3 d-flex align-items-center gap-2"><CheckCircleFill className="text-warning"/> La revisión manual que toma horas ahora toma segundos.</li>
                  <li className="mb-3 d-flex align-items-center gap-2"><CheckCircleFill className="text-warning"/> Respaldo digital de todos tus viajes.</li>
                  <li className="mb-3 d-flex align-items-center gap-2"><CheckCircleFill className="text-warning"/> Evidencia clara para reclamar tus viajes no pagados.</li>
                </ul>
              </ScrollReveal>
            </div>
            <div className="col-lg-5 offset-lg-1">
              <ScrollReveal animation="animate__fadeInRight" delay={200}>
                <div className="card border-0 shadow-lg bg-white text-dark p-4 rounded-4">
                  <div className="card-body text-center">
                    <CashStack size={64} className="text-success mb-3" />
                    <h3 className="fw-bold">Recupera tu inversión</h3>
                    <p className="text-muted">Usando nuestro analizador puedes recuperar hasta 10 veces el costo de la suscripción.</p>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* PRECIOS */}
      <section id="precios" className="py-5 bg-light">
        <div className="container py-5 text-center">
          <ScrollReveal animation="animate__fadeIn">
            <h2 className="fw-bold text-dark mb-3">Planes simples y transparentes</h2>
            <p className="text-muted mb-5">Elige el plan que mejor se adapte a tu volumen de viajes.</p>
          </ScrollReveal>

          <div className="row justify-content-center g-4">
            {/* Plan Mensual */}
            <div className="col-md-5 col-lg-4">
              <ScrollReveal animation="animate__fadeInUp" delay={100}>
                <div className="card h-100 border-0 shadow-sm p-4 rounded-4">
                  <h4 className="fw-bold text-secondary text-uppercase mb-3">Plan Mensual</h4>
                  <div className="display-4 fw-bolder text-dark mb-4">$14.990<span className="fs-5 text-muted fw-normal">/mes</span></div>
                  <ul className="list-unstyled text-start mb-4 text-secondary">
                    <li className="mb-2 d-flex gap-2"><CheckCircleFill className="text-primary mt-1"/> Escaneo de vouchers ilimitados</li>
                    <li className="mb-2 d-flex gap-2"><CheckCircleFill className="text-primary mt-1"/> Escaneo de planillas ilimitados</li>
                    <li className="mb-2 d-flex gap-2"><CheckCircleFill className="text-primary mt-1"/> Soporte mediante la plataforma</li>
                  </ul>
                  <a href="#contacto" className="btn btn-outline-primary btn-lg fw-bold mt-auto w-100">Elegir Mensual</a>
                </div>
              </ScrollReveal>
            </div>

            {/* Plan Trimensual */}
            <div className="col-md-5 col-lg-4">
              <ScrollReveal animation="animate__fadeInUp" delay={300}>
                <div className="card h-100 border-2 border-primary shadow p-4 rounded-4 position-relative">
                  <span className="position-absolute top-0 start-50 translate-middle badge rounded-pill bg-danger px-3 py-2">
                    UNO GRATIS
                  </span>
                  <h4 className="fw-bold text-primary text-uppercase mb-3">Plan Trimensual</h4>
                  <div className="display-4 fw-bolder text-dark mb-4">$29.990<span className="fs-5 text-muted fw-normal">/3meses</span></div>
                  <ul className="list-unstyled text-start mb-4 text-secondary">
                    <li className="mb-2 d-flex gap-2"><CheckCircleFill className="text-primary mt-1"/> Todo lo del plan mensual</li>
                    <li className="mb-2 d-flex gap-2"><CheckCircleFill className="text-primary mt-1"/> Soporte prioritario</li>
                    <li className="mb-2 d-flex gap-2"><CheckCircleFill className="text-primary mt-1"/> Descuento en pago trimensual</li>
                  </ul>
                  <a href="#contacto" className="btn btn-primary btn-lg fw-bold mt-auto w-100 shadow-sm">Elegir Trimensual</a>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-5 bg-white">
        <div className="container py-5">
          <ScrollReveal animation="animate__fadeInDown">
            <h2 className="text-center fw-bold mb-5">Preguntas Frecuentes</h2>
          </ScrollReveal>
          
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <ScrollReveal animation="animate__fadeInUp" delay={200}>
                <div className="accordion shadow-sm" id="faqAccordion">
                  
                  {/* Pregunta 1 */}
                  <div className="accordion-item border-0 border-bottom">
                    <h2 className="accordion-header">
                      <button 
                        className={`accordion-button fw-bold text-dark bg-white ${activeFaq !== 1 ? 'collapsed' : ''}`} 
                        type="button" 
                        onClick={() => toggleFaq(1)}
                      >
                        ¿Cómo lee la aplicación mis vouchers y planillas de pago?
                      </button>
                    </h2>
                    <div className={`accordion-collapse collapse ${activeFaq === 1 ? 'show' : ''}`}>
                      <div className="accordion-body text-muted">
                        Usamos un modelo de inteligencia artifical entrenado de forma privada, el procesador escanea el archivo y detecta en segundos los datos importantes para el análisis.
                      </div>
                    </div>
                  </div>

                  {/* Pregunta 2 */}
                  <div className="accordion-item border-0 border-bottom">
                    <h2 className="accordion-header">
                      <button 
                        className={`accordion-button fw-bold text-dark bg-white ${activeFaq !== 2 ? 'collapsed' : ''}`} 
                        type="button" 
                        onClick={() => toggleFaq(2)}
                      >
                        ¿Mis datos están seguros?
                      </button>
                    </h2>
                    <div className={`accordion-collapse collapse ${activeFaq === 2 ? 'show' : ''}`}>
                      <div className="accordion-body text-muted">
                        Tus datos son protegidos y gestionados por plataformas de software externas a VanCheck de alto prestigio. Tus datos personales nunca serán usados para ningún fin externo al sistema.
                      </div>
                    </div>
                  </div>

                  {/* Pregunta 3 */}
                  <div className="accordion-item border-0 border-bottom">
                    <h2 className="accordion-header">
                      <button 
                        className={`accordion-button fw-bold text-dark bg-white ${activeFaq !== 3 ? 'collapsed' : ''}`} 
                        type="button" 
                        onClick={() => toggleFaq(3)}
                      >
                        ¿Qué pasa si la empresa me paga un voucher en fechas raras?
                      </button>
                    </h2>
                    <div className={`accordion-collapse collapse ${activeFaq === 3 ? 'show' : ''}`}>
                      <div className="accordion-body text-muted">
                        Si tu planilla de enero tiene pagos realizados durante diciembre o febrero, el sistema tiene opciones para personalizar las fechas de inicio y término del pago en un planilla.
                      </div>
                    </div>
                  </div>

                  {/* Pregunta 4 */}
                  <div className="accordion-item border-0">
                    <h2 className="accordion-header">
                      <button 
                        className={`accordion-button fw-bold text-dark bg-white ${activeFaq !== 4 ? 'collapsed' : ''}`} 
                        type="button" 
                        onClick={() => toggleFaq(4)}
                      >
                        ¿El análisis puede fallar?
                      </button>
                    </h2>
                    <div className={`accordion-collapse collapse ${activeFaq === 4 ? 'show' : ''}`}>
                      <div className="accordion-body text-muted">
                        Al ser un modelo de inteligencia artificial entrenado, siempre pueden ocurrir fallos. Sin embargo, las pruebas de calidad resultaron en que el 98% vouchers son escaneados con éxito mientras que el 100% planillas son escaneadas con éxito.
                      </div>
                    </div>
                  </div>

                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACTO CTA */}
      <section id="contacto" className="py-5 bg-dark text-white text-center">
        <div className="container py-5">
          <ScrollReveal animation="animate__zoomIn">
            <Headset size={48} className="text-primary mb-4" />
            <h2 className="display-6 fw-bold mb-3">¿Listo para tomar el control de tu plata?</h2>
            <p className="lead mb-5 opacity-75">
              Háblanos por WhatsApp para resolver tus dudas o activar tu cuenta hoy mismo.
            </p>
            <a href="https://wa.me/56933372677" target="_blank" rel="noreferrer" className="btn btn-success btn-lg fw-bold px-5 py-3 shadow">
              Contactar por WhatsApp
            </a>
          </ScrollReveal>
        </div>
      </section>

    </div>
  )
}