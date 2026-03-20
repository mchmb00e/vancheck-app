'use client'

import { useState, useRef } from 'react'
import { FileEarmarkPdf, PencilSquare, FileArrowUp, Trash, CheckLg, XLg, ArrowDownUp, ExclamationTriangleFill, CheckCircleFill } from 'react-bootstrap-icons'
import { deleteSpreadsheet, updateSpreadsheetName, replaceSpreadsheetFile } from '@/app/actions/spreadsheet'

export default function SpreadsheetList({ initialSpreadsheets, publicUrlBase }) {
  const [spreadsheets, setSpreadsheets] = useState(initialSpreadsheets)
  const [dateFilter, setDateFilter] = useState('all')
  const [sortDesc, setSortDesc] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null)
  
  const fileInputRef = useRef(null)
  const [replacingId, setReplacingId] = useState(null)

  const filteredAndSorted = spreadsheets.filter(s => {
    if (dateFilter === 'all') return true
    const sDate = new Date(s.created_at).getTime()
    const now = new Date().getTime()
    const diffDays = (now - sDate) / (1000 * 3600 * 24)

    if (dateFilter === 'today') return diffDays <= 1
    if (dateFilter === 'week') return diffDays <= 7
    if (dateFilter === 'month') return diffDays <= 30
    if (dateFilter === 'year') return diffDays <= 365
    return true
  }).sort((a, b) => {
    const dateA = new Date(a.created_at).getTime()
    const dateB = new Date(b.created_at).getTime()
    return sortDesc ? dateB - dateA : dateA - dateB
  })

  const handleDelete = async (id, fileUrl) => {
    setStatus(null)
    if (confirm('¿Estás seguro de que quieres eliminar esta planilla?')) {
      setLoading(true)
      try {
        await deleteSpreadsheet(id, fileUrl)
        setSpreadsheets(spreadsheets.filter(s => s.id !== id))
        setStatus({ type: 'success', msg: 'Planilla eliminada correctamente.' })
      } catch (err) {
        setStatus({ type: 'danger', msg: 'Hubo un problema al intentar eliminar el archivo.' })
      } finally {
        setLoading(false)
      }
    }
  }

  const handleSaveName = async (id) => {
    setStatus(null)
    setLoading(true)
    try {
      await updateSpreadsheetName(id, editName)
      setSpreadsheets(spreadsheets.map(s => s.id === id ? { ...s, name: editName } : s))
      setEditingId(null)
      setStatus({ type: 'success', msg: 'Nombre actualizado con éxito.' })
    } catch (err) {
      setStatus({ type: 'danger', msg: 'No se pudo actualizar el nombre.' })
    } finally {
      setLoading(false)
    }
  }

  const triggerFileReplace = (id) => {
    setReplacingId(id)
    fileInputRef.current.click()
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file || !replacingId) return

    setStatus(null)
    setLoading(true)
    const spreadsheet = spreadsheets.find(s => s.id === replacingId)
    
    const formData = new FormData()
    formData.append('file', file)

    try {
      await replaceSpreadsheetFile(spreadsheet.id, spreadsheet.file_url, formData)
      setStatus({ type: 'success', msg: 'Archivo PDF actualizado correctamente.' })
    } catch (err) {
      setStatus({ type: 'danger', msg: 'Error al intentar reemplazar el archivo PDF.' })
    } finally {
      setReplacingId(null)
      e.target.value = '' 
      setLoading(false)
    }
  }

  return (
    <div className="mt-5 animate__animated animate__fadeIn">
      <h2 className="h4 fw-bold text-dark mb-4 border-bottom pb-2">Mis Planillas</h2>

      {status && (
        <div className={`alert alert-${status.type} shadow-sm d-flex align-items-center gap-2 mb-4 animate__animated animate__fadeIn`}>
          {status.type === 'success' ? <CheckCircleFill size={20} /> : <ExclamationTriangleFill size={20} />}
          {status.msg}
        </div>
      )}

      <input 
        type="file" 
        accept=".pdf" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        onChange={handleFileChange} 
      />

      <div className="d-flex flex-column flex-md-row gap-3 mb-4">
        <select className="form-select w-auto" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
          <option value="all">Todas las fechas</option>
          <option value="today">Hoy</option>
          <option value="week">Última semana</option>
          <option value="month">Último mes</option>
          <option value="year">Último año</option>
        </select>

        <button className="btn btn-outline-secondary d-flex align-items-center gap-2" onClick={() => setSortDesc(!sortDesc)}>
          <ArrowDownUp size={16} />
          {sortDesc ? 'Descendente' : 'Ascendente'}
        </button>
      </div>

      <div className="list-group">
        {filteredAndSorted.length === 0 ? (
          <div className="text-center text-muted py-5">No hay planillas para mostrar.</div>
        ) : (
          filteredAndSorted.map((spreadsheet) => (
            <div key={spreadsheet.id} className="list-group-item d-flex justify-content-between align-items-center p-3 shadow-sm mb-2 rounded border-0">
              
              <div className="d-flex flex-column w-50">
                {editingId === spreadsheet.id ? (
                  <div className="d-flex gap-2 align-items-center">
                    <input 
                      type="text" 
                      className="form-control form-control-sm" 
                      value={editName} 
                      onChange={(e) => setEditName(e.target.value)} 
                    />
                    <button className="btn btn-sm btn-success" onClick={() => handleSaveName(spreadsheet.id)} disabled={loading}><CheckLg /></button>
                    <button className="btn btn-sm btn-light" onClick={() => setEditingId(null)} disabled={loading}><XLg /></button>
                  </div>
                ) : (
                  <h6 className="mb-1 fw-bold text-dark text-truncate" title={spreadsheet.name}>
                    {spreadsheet.name}
                  </h6>
                )}
                <small className="text-muted">
                  Subido el: {new Date(spreadsheet.created_at).toLocaleDateString('es-CL')}
                </small>
              </div>

              <div className="d-flex gap-2">
                <a 
                  href={spreadsheet.publicUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="btn btn-sm btn-outline-primary"
                  title="Ver PDF"
                >
                  <FileEarmarkPdf size={18} />
                </a>

                <button 
                  className="btn btn-sm btn-outline-warning" 
                  onClick={() => { setEditingId(spreadsheet.id); setEditName(spreadsheet.name); }}
                  disabled={loading}
                  title="Editar nombre"
                >
                  <PencilSquare size={18} />
                </button>

                <button 
                  className="btn btn-sm btn-outline-success" 
                  onClick={() => triggerFileReplace(spreadsheet.id)}
                  disabled={loading}
                  title="Reemplazar archivo PDF"
                >
                  <FileArrowUp size={18} />
                </button>

                <button 
                  className="btn btn-sm btn-outline-danger" 
                  onClick={() => handleDelete(spreadsheet.id, spreadsheet.file_url)}
                  disabled={loading}
                  title="Eliminar planilla"
                >
                  <Trash size={18} />
                </button>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  )
}