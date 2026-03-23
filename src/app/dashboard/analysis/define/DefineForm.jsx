'use client'

import { useState, useEffect } from 'react'
import { Stars, ExclamationTriangleFill, PencilSquare, ArrowCounterclockwise } from 'react-bootstrap-icons'
import { useRouter } from 'next/navigation'
import { processSpreadsheetAnalysis } from '@/app/actions/analysis'

export default function DefineForm({ spreadsheetId, companies }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Empezamos con el mes actual por defecto (Formato YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const hoy = new Date()
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`
  })

  // Estado para guardar las fechas finales de cada mundo y si están personalizadas
  const [datesConfig, setDatesConfig] = useState({})

  // Efecto para recalcular las fechas por defecto cada vez que el usuario cambia el mes
  useEffect(() => {
    if (!selectedMonth) return

    const [yearStr, monthStr] = selectedMonth.split('-')
    const year = parseInt(yearStr, 10)
    const month = parseInt(monthStr, 10) // 1 a 12

    const newConfig = { ...datesConfig }

    companies.forEach(company => {
      // Si el usuario ya personalizó este mundo, no le sobreescribimos las fechas
      if (newConfig[company.id]?.isCustom) return

      let startDate, endDate

      // Lógica especial para ACCIONA (del 21 del mes anterior al 20 del mes actual)
      if (company.name.toUpperCase().includes('ACCIONA')) {
        let prevMonth = month - 1
        let prevYear = year
        if (prevMonth === 0) {
          prevMonth = 12
          prevYear -= 1
        }
        startDate = `${prevYear}-${String(prevMonth).padStart(2, '0')}-21`
        endDate = `${year}-${String(month).padStart(2, '0')}-20`
      } 
      // Lógica para el resto: del 1 al último día del mes
      else {
        startDate = `${year}-${String(month).padStart(2, '0')}-01`
        // Magia de JS: el día 0 del mes siguiente nos da el último día del mes actual (cubre bisiestos)
        const lastDay = new Date(year, month, 0).getDate()
        endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
      }

      newConfig[company.id] = {
        isCustom: false,
        start: startDate,
        end: endDate
      }
    })

    setDatesConfig(newConfig)
  }, [selectedMonth, companies]) // Solo se ejecuta si cambia el mes (y al cargar)

  const toggleCustom = (companyId) => {
    setDatesConfig(prev => ({
      ...prev,
      [companyId]: {
        ...prev[companyId],
        isCustom: !prev[companyId].isCustom
      }
    }))
    
    // Si lo apaga, forzamos un pequeño update para que recalcule las fechas por defecto
    if (datesConfig[companyId]?.isCustom) {
      setSelectedMonth(prev => prev) // Trigger re-render of useEffect
    }
  }

  const handleCustomDateChange = (companyId, field, value) => {
    setDatesConfig(prev => ({
      ...prev,
      [companyId]: {
        ...prev[companyId],
        [field]: value
      }
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    
    const formData = new FormData(e.target)
    const startPage = parseInt(formData.get('startPage')) || 2
    const endPageInput = formData.get('endPage')
    const endPage = endPageInput ? parseInt(endPageInput) : null
    
    if (endPage && startPage > endPage) {
      setError('La página de inicio no puede ser mayor a la página de término.')
      return
    }

    // Validar y armar el objeto final de fechas
    const companyDates = {}
    for (const company of companies) {
      const config = datesConfig[company.id]
      if (!config || !config.start || !config.end) {
        setError(`Faltan fechas para el mundo ${company.name}`)
        return
      }
      if (new Date(config.start) > new Date(config.end)) {
        setError(`La fecha de inicio no puede ser posterior a la de corte en ${company.name}.`)
        return
      }
      companyDates[company.id] = { start: config.start, end: config.end }
    }

    setLoading(true)

    try {
      const result = await processSpreadsheetAnalysis(spreadsheetId, companyDates, startPage, endPage)

      if (result.success) {
        // ✨ ACÁ ESTÁ EL CAMBIO: Armamos un nuevo objeto que incluye lo que nos 
        // devuelve el servidor MÁS el spreadsheetId que necesitamos en la otra vista.
        const dataToSave = {
          ...result.data,
          spreadsheetId: spreadsheetId
        }
        
        // Guardamos este nuevo objeto vitaminizado
        sessionStorage.setItem('extractedData', JSON.stringify(dataToSave))
        router.push('/dashboard/analysis/extract')
      } else {
        setError(result.error || 'Ocurrió un problema durante el análisis.')
        setLoading(false)
      }
    } catch (err) {
      console.log(err)
      setError('Hubo un error al analizar el documento. Por favor, inténtalo más tarde.')
      setLoading(false)
    }
  }
  // Función de apoyo para formatear la fecha a la chilena (DD/MM/YYYY)
  const formatearFecha = (fechaString) => {
    if (!fechaString) return ''
    const [y, m, d] = fechaString.split('-')
    return `${d}/${m}/${y}`
  }

  return (
    <form onSubmit={handleSubmit} className="card shadow-sm border-0 bg-light p-4">
      
      {error && (
        <div className="alert alert-danger shadow-sm d-flex align-items-center gap-2 mb-4 animate__animated animate__headShake">
          <ExclamationTriangleFill size={20} />
          <div>{error}</div>
        </div>
      )}

      <div className="row g-4 mb-5">
        <div className="col-12 col-md-4">
          <h3 className="h6 fw-bold text-secondary text-uppercase mb-3">Mes de Análisis</h3>
          <input 
            type="month" 
            className="form-control form-control-lg border-primary shadow-sm" 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            required
          />
        </div>

        <div className="col-12 col-md-8">
          <h3 className="h6 fw-bold text-secondary text-uppercase mb-3">Rango de Páginas a Escanear</h3>
          <div className="d-flex gap-3">
            <div className="w-50">
              <label className="form-label small fw-medium text-dark">Página de Inicio</label>
              <input type="number" className="form-control" name="startPage" defaultValue={2} min={1} required />
            </div>
            <div className="w-50">
              <label className="form-label small fw-medium text-dark">Página de Término (Opcional)</label>
              <input type="number" className="form-control" name="endPage" min={1} />
            </div>
          </div>
        </div>
      </div>

      <h3 className="h6 fw-bold text-secondary text-uppercase mb-3">Periodos por Mundo</h3>
      
      <div className="row g-3">
        {companies.map(company => {
          const config = datesConfig[company.id] || { start: '', end: '', isCustom: false }
          
          return (
            <div key={company.id} className="col-12 col-md-6">
              <div className={`p-3 rounded shadow-sm border ${config.isCustom ? 'bg-white border-warning' : 'bg-white border-light'}`}>
                
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h4 className="h6 fw-bold text-primary m-0">{company.name}</h4>
                  <div className="form-check form-switch">
                    <input 
                      className="form-check-input border border-1 border-black" 
                      type="checkbox" 
                      role="switch" 
                      id={`custom_${company.id}`}
                      checked={config.isCustom}
                      onChange={() => toggleCustom(company.id)}
                      title="Personalizar fechas para este mundo"
                    />
                  </div>
                </div>

                {!config.isCustom ? (
                  <div className="d-flex align-items-center gap-2 text-dark">
                    <span className="fw-medium">{formatearFecha(config.start)}</span>
                    <span className="text-muted small">hasta</span>
                    <span className="fw-medium">{formatearFecha(config.end)}</span>
                  </div>
                ) : (
                  <div className="row g-2 mt-1 animate__animated animate__fadeIn">
                    <div className="col-6">
                      <label className="small text-muted mb-1">Inicio</label>
                      <input 
                        type="date" 
                        className="form-control form-control-sm border-warning" 
                        value={config.start}
                        onChange={(e) => handleCustomDateChange(company.id, 'start', e.target.value)}
                        required 
                      />
                    </div>
                    <div className="col-6">
                      <label className="small text-muted mb-1">Corte</label>
                      <input 
                        type="date" 
                        className="form-control form-control-sm border-warning" 
                        value={config.end}
                        onChange={(e) => handleCustomDateChange(company.id, 'end', e.target.value)}
                        required 
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="d-flex justify-content-end border-top pt-4 mt-4">
        <button 
          type="submit" 
          className="btn btn-primary btn-lg px-5 d-flex align-items-center gap-2 fw-bold shadow"
          disabled={loading || !selectedMonth}
        >
          <Stars size={20} />
          {loading ? 'Procesando PDF...' : 'Analizar Planilla'}
        </button>
      </div>

    </form>
  )
}