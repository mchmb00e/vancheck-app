'use client'

import { useState, useEffect } from 'react'
import { getPendingVouchers, verifyVoucher } from '@/app/actions/admin'
import { getVoucherImageUrl } from '@/app/actions/voucher'
import { 
  CheckCircle, 
  ChevronLeft, 
  ChevronRight, 
  ExclamationTriangle,
  CardImage,
  PlayCircle
} from 'react-bootstrap-icons'

export default function VerifyClient({ companies }) {
  const [vouchers, setVouchers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [isLoadingList, setIsLoadingList] = useState(true)
  
  const [selectedVoucher, setSelectedVoucher] = useState(null)
  const [isSequential, setIsSequential] = useState(false) 
  
  const [imageUrl, setImageUrl] = useState(null)
  const [isImageLoading, setIsImageLoading] = useState(false)

  const [formData, setFormData] = useState({
    voucher_number: '',
    voucher_date: '',
    voucher_company_id: ''
  })
  const [isSaving, setIsSaving] = useState(false)

  const [zoomStyle, setZoomStyle] = useState({ 
    transformOrigin: 'center center', 
    transform: 'scale(1)' 
  })

  // Función salvavidas para formatear la fecha sin que la zona horaria nos moleste
  const formatSafeDate = (isoDateString) => {
    if (!isoDateString) return null;
    // Extrae "YYYY-MM-DD", lo separa, lo da vuelta a "DD, MM, YYYY" y lo une con "/"
    return new Date(isoDateString).toISOString().split('T')[0].split('-').reverse().join('/');
  }

  useEffect(() => {
    fetchVouchers(page)
  }, [page])

  useEffect(() => {
    async function fetchImage() {
      if (selectedVoucher?.file_path) {
        setIsImageLoading(true)
        try {
          const url = await getVoucherImageUrl(selectedVoucher.file_path)
          setImageUrl(url)
        } catch (error) {
          console.error("Error al obtener imagen firmada:", error)
          setImageUrl(null)
        } finally {
          setIsImageLoading(false)
        }
      } else {
        setImageUrl(null)
      }
    }

    fetchImage()
  }, [selectedVoucher?.file_path])

  const fetchVouchers = async (currentPage) => {
    setIsLoadingList(true)
    try {
      const { vouchers: data, total: totalCount } = await getPendingVouchers(currentPage)
      setVouchers(data)
      setTotal(totalCount)
    } catch (error) {
      console.error("Error al cargar vouchers:", error)
    } finally {
      setIsLoadingList(false)
    }
  }

  const handleSelectVoucher = (voucher) => {
    setSelectedVoucher(voucher)
    setImageUrl(null)
    setZoomStyle({ transformOrigin: 'center center', transform: 'scale(1)' })
    setFormData({
      voucher_number: voucher.voucher_number || '',
      voucher_date: voucher.voucher_date ? new Date(voucher.voucher_date).toISOString().split('T')[0] : '',
      voucher_company_id: voucher.voucher_company_id || ''
    })
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      await verifyVoucher(selectedVoucher.id, formData)
      
      const newVouchers = vouchers.filter(v => v.id !== selectedVoucher.id)
      setVouchers(newVouchers)
      setTotal(prev => prev - 1)
      
      if (isSequential && newVouchers.length > 0) {
        handleSelectVoucher(newVouchers[0])
      } else {
        setSelectedVoucher(null)
        setImageUrl(null)
      }
      
    } catch (error) {
      alert("Hubo un condoro al guardar: " + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - left) / width) * 100
    const y = ((e.clientY - top) / height) * 100
    
    setZoomStyle({
      transformOrigin: `${x}% ${y}%`,
      transform: 'scale(2.5)' 
    })
  }

  const handleMouseLeave = () => {
    setZoomStyle({
      transformOrigin: 'center center',
      transform: 'scale(1)'
    })
  }

  const totalPages = Math.ceil(total / 50)

  return (
    <div className="row h-100 bg-white rounded shadow-sm border overflow-hidden m-0">
      
      {/* 1. ASIDE IZQUIERDO: Lista de Vouchers */}
      <div className="col-12 col-lg-3 border-end p-0 d-flex flex-column bg-light h-100">
        <div className="p-3 border-bottom bg-white d-flex justify-content-between align-items-center">
          <span className="fw-semibold">Por revisar ({total})</span>
          <div className="btn-group btn-group-sm">
            <button 
              className="btn btn-outline-secondary" 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || isLoadingList}
            >
              <ChevronLeft />
            </button>
            <span className="btn btn-outline-secondary disabled px-3 text-dark">
              {page} / {totalPages || 1}
            </span>
            <button 
              className="btn btn-outline-secondary" 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || isLoadingList}
            >
              <ChevronRight />
            </button>
          </div>
        </div>

        <div className="overflow-auto flex-grow-1 p-2" style={{ maxHeight: '75vh' }}>
          {isLoadingList ? (
            <div className="text-center py-4 text-secondary">Cargando vouchers...</div>
          ) : vouchers.length === 0 ? (
            <div className="text-center py-4 text-secondary">¡Filete! No hay vouchers pendientes.</div>
          ) : (
            <div className="list-group list-group-flush gap-1">
              {vouchers.map(v => (
                <button
                  key={v.id}
                  onClick={() => handleSelectVoucher(v)}
                  className={`list-group-item list-group-item-action border rounded ${selectedVoucher?.id === v.id ? 'active shadow-sm' : ''}`}
                >
                  <div className="d-flex w-100 justify-content-between align-items-center">
                    <div className="text-truncate">
                      <h6 className="mb-1 text-truncate">Nº {v.voucher_number || 'Sin número'}</h6>
                      {/* Arreglado el problema de zona horaria aquí */}
                      <small className={selectedVoucher?.id === v.id ? 'text-light opacity-75' : 'text-muted'}>
                        {v.voucher_date ? formatSafeDate(v.voucher_date) : 'Sin fecha'}
                      </small>
                    </div>
                    {v.ai_success === false && <ExclamationTriangle className="text-warning" />}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ÁREA PRINCIPAL: Visualizador y Formulario */}
      <div className="col-12 col-lg-9 p-0 d-flex h-100">
        {selectedVoucher ? (
          <div className="row w-100 m-0">
            
            {/* 2. CENTRO: Visor de Imagen */}
            <div className="col-12 col-xl-7 bg-dark d-flex align-items-center justify-content-center p-0 overflow-hidden" style={{ maxHeight: '85vh' }}>
              {isImageLoading ? (
                <div className="text-white d-flex flex-column align-items-center">
                  <div className="spinner-border text-light mb-3" role="status"></div>
                  <p>Obteniendo firma segura...</p>
                </div>
              ) : imageUrl ? (
                <div 
                  className="w-100 h-100 d-flex align-items-center justify-content-center"
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  style={{ cursor: 'zoom-in', overflow: 'hidden' }}
                >
                  <img 
                    src={imageUrl} 
                    alt="Voucher escaneado" 
                    style={{ 
                      objectFit: 'contain', 
                      width: '100%', 
                      height: '100%',
                      transition: 'transform 0.1s ease-out',
                      ...zoomStyle 
                    }}
                  />
                </div>
              ) : (
                <div className="text-white d-flex flex-column align-items-center">
                  <CardImage size={48} className="mb-2 opacity-50" />
                  <p>Imagen no disponible en servidor</p>
                </div>
              )}
            </div>

            {/* 3. DERECHA: Formulario de Corrección */}
            <div className="col-12 col-xl-5 bg-white p-4 overflow-auto border-start" style={{ maxHeight: '85vh' }}>
              
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="m-0">Corregir y Verificar</h4>
                <div className="form-check form-switch m-0">
                  <input 
                    className="form-check-input" 
                    type="checkbox" 
                    role="switch" 
                    id="sequentialSwitch" 
                    checked={isSequential}
                    onChange={(e) => setIsSequential(e.target.checked)}
                  />
                  <label className="form-check-label text-muted" htmlFor="sequentialSwitch" style={{fontSize: '0.85rem'}}>
                    Secuencial
                  </label>
                </div>
              </div>
              
              <div className="alert alert-secondary p-3 mb-4">
                <h6 className="text-uppercase text-muted mb-2" style={{ fontSize: '0.8rem' }}>Datos escaneados por IA</h6>
                <div className="d-flex flex-column gap-1 text-dark">
                  <span><strong>Nº Documento:</strong> {selectedVoucher.voucher_number || '-'}</span>
                  {/* Arreglado el problema de zona horaria aquí también */}
                  <span><strong>Fecha:</strong> {selectedVoucher.voucher_date ? formatSafeDate(selectedVoucher.voucher_date) : '-'}</span>
                  <span><strong>Empresa:</strong> {selectedVoucher.companies?.name || 'No detectada'}</span>
                </div>
              </div>

              <form onSubmit={handleSave} className="d-flex flex-column gap-3">
                <div>
                  <label className="form-label fw-semibold">Número de Voucher Correcto</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    name="voucher_number"
                    value={formData.voucher_number}
                    onChange={handleChange}
                    onFocus={() => setFormData(prev => ({ ...prev, voucher_number: '' }))}
                    required
                  />
                </div>

                <div>
                  <label className="form-label fw-semibold">Fecha Correcta</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    name="voucher_date"
                    value={formData.voucher_date}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label className="form-label fw-semibold">Empresa Correcta</label>
                  <select 
                    className="form-select"
                    name="voucher_company_id"
                    value={formData.voucher_company_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Selecciona la empresa...</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="mt-4">
                  <button 
                    type="submit" 
                    className="btn btn-success w-100 py-2 d-flex justify-content-center align-items-center gap-2"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={20} />
                        Aprobar y Guardar
                      </>
                    )}
                  </button>
                  <p className="text-muted text-center mt-2" style={{ fontSize: '0.85rem' }}>
                    Al guardar, este voucher pasará a estar verificado y alimentará el dataset.
                  </p>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="w-100 h-100 d-flex flex-column align-items-center justify-content-center text-secondary bg-light">
            <CheckCircle size={64} className="mb-3 opacity-25" />
            <h4 className="fw-normal">Ningún voucher seleccionado</h4>
            <p className="mb-4">Haz clic en un voucher de la lista para empezar a revisar, o inicia el modo automático.</p>
            
            <button 
              className="btn btn-primary btn-lg d-flex align-items-center gap-2 shadow-sm"
              onClick={() => {
                setIsSequential(true)
                if (vouchers.length > 0) handleSelectVoucher(vouchers[0])
              }}
              disabled={vouchers.length === 0}
            >
              <PlayCircle size={24} /> Iniciar Revisión Secuencial
            </button>
          </div>
        )}
      </div>

    </div>
  )
}