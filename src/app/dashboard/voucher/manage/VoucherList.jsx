'use client'

import { useState } from 'react'
import { PencilSquare, Trash, CheckLg, XLg, ArrowDownUp, Eye, Search, ExclamationTriangleFill } from 'react-bootstrap-icons'
import { deleteVoucherRecord, updateVoucherRecord, getVoucherImageUrl } from '@/app/actions/voucher'

export default function VoucherList({ initialVouchers, companies }) {
  const [vouchers, setVouchers] = useState(initialVouchers)
  const [dateFilter, setDateFilter] = useState('all') 
  const [companyFilter, setCompanyFilter] = useState('all') // ✨ NUEVO: Estado para el filtro de mundo
  const [sortDesc, setSortDesc] = useState(true)
  const [searchTerm, setSearchTerm] = useState('') 
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)

  const highlightMatch = (text, query) => {
    if (!query) return text 
    
    const regex = new RegExp(`(${query})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-warning text-dark px-0 rounded-1">{part}</mark>
      ) : (
        part
      )
    )
  }

  const filteredAndSortedVouchers = vouchers.filter(v => {
    // 1. Filtro por búsqueda
    const matchesSearch = v.voucher_number.toLowerCase().includes(searchTerm.toLowerCase())
    if (!matchesSearch) return false

    // 2. ✨ NUEVO: Filtro por mundo (Company)
    if (companyFilter !== 'all' && v.voucher_company_id !== companyFilter) return false

    // 3. Filtro por fecha
    if (dateFilter === 'all') return true
    
    const vDate = new Date(v.voucher_date).getTime()
    const now = new Date().getTime()
    const diffDays = (now - vDate) / (1000 * 3600 * 24)

    if (dateFilter === 'today') return diffDays <= 1
    if (dateFilter === 'week') return diffDays <= 7
    if (dateFilter === 'month') return diffDays <= 30
    if (dateFilter === 'year') return diffDays <= 365
    return true
  }).sort((a, b) => {
    const dateA = new Date(a.voucher_date).getTime()
    const dateB = new Date(b.voucher_date).getTime()
    return sortDesc ? dateB - dateA : dateA - dateB
  })

  const handleDelete = async (id, filePath) => {
    setErrorMessage(null)
    if (confirm('¿Estás seguro de que quieres eliminar este voucher?')) {
      setLoading(true)
      try {
        await deleteVoucherRecord(id, filePath)
        setVouchers(vouchers.filter(v => v.id !== id))
      } catch (err) {
        setErrorMessage('No se pudo eliminar el voucher. Inténtalo de nuevo.')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleEditSubmit = async (e, id) => {
    e.preventDefault()
    setErrorMessage(null)
    setLoading(true)
    const formData = new FormData(e.target)
    
    try {
      await updateVoucherRecord(id, formData)
      
      const updatedVouchers = vouchers.map(v => {
        if (v.id === id) {
          return {
            ...v,
            voucher_number: formData.get('identifier'),
            voucher_date: new Date(formData.get('date')),
            voucher_company_id: formData.get('company_id'),
            companies: companies.find(c => c.id === formData.get('company_id'))
          }
        }
        return v
      })
      
      setVouchers(updatedVouchers)
      setEditingId(null)
    } catch (err) {
      setErrorMessage('Ocurrió un error al actualizar los datos.')
    } finally {
      setLoading(false)
    }
  }

  const handleViewImage = async (filePath) => {
    setErrorMessage(null)
    if (!filePath) {
      setErrorMessage('Este voucher fue ingresado manualmente y no tiene una imagen asociada.')
      return
    }

    setLoading(true)
    try {
      const url = await getVoucherImageUrl(filePath)
      if (url) {
        window.open(url, '_blank')
      } else {
        setErrorMessage('No se pudo cargar la imagen. Es posible que el archivo ya no exista.')
      }
    } catch (error) {
      setErrorMessage('Hubo un error al intentar abrir la imagen.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-5 animate__animated animate__fadeIn">
      <h2 className="h4 fw-bold text-dark mb-4 border-bottom pb-2">Mis Vouchers</h2>

      {errorMessage && (
        <div className="alert alert-danger shadow-sm d-flex align-items-center gap-2 mb-4 animate__animated animate__headShake">
          <ExclamationTriangleFill size={20} />
          {errorMessage}
        </div>
      )}

      <div className="row g-3 mb-4">
        {/* Barra de búsqueda */}
        <div className="col-12 col-md-4">
          <div className="input-group shadow-sm">
            <span className="input-group-text bg-white text-muted border-end-0">
              <Search size={16} />
            </span>
            <input 
              type="text" 
              className="form-control border-start-0 ps-0" 
              placeholder="Buscar por ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Contenedor de Filtros (flex-wrap para que se acomoden bien en celu) */}
        <div className="col-12 col-md-8 d-flex gap-2 justify-content-md-end flex-wrap">
          
          {/* ✨ NUEVO: Select de Mundo (Company) */}
          <select 
            className="form-select w-auto shadow-sm" 
            value={companyFilter} 
            onChange={(e) => setCompanyFilter(e.target.value)}
          >
            <option value="all">Todos los mundos</option>
            {companies.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Select de Fecha */}
          <select 
            className="form-select w-auto shadow-sm" 
            value={dateFilter} 
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="all">Todas las fechas</option>
            <option value="today">Hoy</option>
            <option value="week">Última semana</option>
            <option value="month">Último mes</option>
            <option value="year">Último año</option>
          </select>

          {/* Botón de Orden */}
          <button 
            className="btn btn-outline-secondary d-flex align-items-center gap-2 shadow-sm"
            onClick={() => setSortDesc(!sortDesc)}
          >
            <ArrowDownUp size={16} />
            <span className="d-none d-sm-inline">{sortDesc ? 'Descend' : 'Ascend'}</span>
          </button>
        </div>
      </div>

      <div className="row g-3">
        {filteredAndSortedVouchers.length === 0 ? (
          <div className="col-12 text-center text-muted py-5">
            No se encontraron vouchers que coincidan con tus filtros.
          </div>
        ) : (
          filteredAndSortedVouchers.map((voucher) => (
            <div key={voucher.id} className="col-12 col-md-6 col-lg-4">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-body">
                  
                  {editingId === voucher.id ? (
                    <form onSubmit={(e) => handleEditSubmit(e, voucher.id)}>
                      <input 
                        type="text" 
                        name="identifier" 
                        className="form-control form-control-sm mb-2" 
                        defaultValue={voucher.voucher_number} 
                        required 
                      />
                      <input 
                        type="date" 
                        name="date" 
                        className="form-control form-control-sm mb-2" 
                        defaultValue={new Date(voucher.voucher_date).toISOString().split('T')[0]} 
                        required 
                      />
                      <select 
                        name="company_id" 
                        className="form-select form-select-sm mb-3" 
                        defaultValue={voucher.voucher_company_id} 
                        required
                      >
                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      
                      <div className="d-flex gap-2 justify-content-end">
                        <button type="button" className="btn btn-sm btn-light" onClick={() => setEditingId(null)} disabled={loading}>
                          <XLg />
                        </button>
                        <button type="submit" className="btn btn-sm btn-success" disabled={loading}>
                          <CheckLg />
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <span className="badge bg-primary bg-opacity-10 text-primary border border-primary-subtle">
                          {voucher.companies?.name || 'Sin Mundo'}
                        </span>
                        <div className="d-flex gap-2">
                          <button 
                            className="btn btn-sm btn-outline-info border-0" 
                            onClick={() => handleViewImage(voucher.file_path)}
                            disabled={loading}
                            title="Ver imagen original"
                          >
                            <Eye size={16} />
                          </button>
                          
                          <button 
                            className="btn btn-sm btn-outline-warning border-0" 
                            onClick={() => setEditingId(voucher.id)}
                            title="Editar"
                          >
                            <PencilSquare size={16} />
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-danger border-0" 
                            onClick={() => handleDelete(voucher.id, voucher.file_path)}
                            disabled={loading}
                            title="Eliminar"
                          >
                            <Trash size={16} />
                          </button>
                        </div>
                      </div>
                      <h5 className="card-title text-dark fw-bold mb-1 text-truncate" title={voucher.voucher_number}>
                        {highlightMatch(voucher.voucher_number, searchTerm)}
                      </h5>
                      <p className="card-text text-muted small mb-0">
                        {new Date(voucher.voucher_date).toLocaleDateString('es-CL', { timeZone: 'UTC' })}
                      </p>
                    </>
                  )}

                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}