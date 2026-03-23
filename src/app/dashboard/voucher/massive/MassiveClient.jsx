'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { processSingleMassiveVoucher, confirmMassiveBatch } from '@/app/actions/voucher'
import imageCompression from 'browser-image-compression' // ✨ IMPORTAMOS LIBRERÍA

export default function MassiveClient({ companies }) {
  const router = useRouter()
  
  // Estados: 'SELECT', 'PROCESSING', 'REVIEW'
  const [step, setStep] = useState('SELECT')
  
  const [files, setFiles] = useState([])
  const [previewUrl, setPreviewUrl] = useState(null)
  
  const [progress, setProgress] = useState(0)
  const [processedResults, setProcessedResults] = useState([])
  const [isSaving, setIsSaving] = useState(false)
  
  const MAX_FILES = 300

  // ---------- PASO 1: SELECCIÓN ----------
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files)
    
    if (files.length + selectedFiles.length > MAX_FILES) {
      alert(`¡Ojo! Solo puedes subir un máximo de ${MAX_FILES} imágenes por sesión.`)
      const allowedSlots = MAX_FILES - files.length
      const filesToAdd = selectedFiles.slice(0, allowedSlots)
      
      const newFiles = filesToAdd.map(file => ({
        file,
        id: crypto.randomUUID(),
        preview: URL.createObjectURL(file)
      }))
      setFiles(prev => [...prev, ...newFiles])
    } else {
      const newFiles = selectedFiles.map(file => ({
        file,
        id: crypto.randomUUID(),
        preview: URL.createObjectURL(file)
      }))
      setFiles(prev => [...prev, ...newFiles])
    }
  }

  const removeFile = (idToRemove) => {
    setFiles(prev => {
      const filtered = prev.filter(f => f.id !== idToRemove)
      const fileToRemove = prev.find(f => f.id === idToRemove)
      if (fileToRemove) URL.revokeObjectURL(fileToRemove.preview)
      return filtered
    })
  }

  const clearAll = () => {
    files.forEach(f => URL.revokeObjectURL(f.preview))
    setFiles([])
  }

  // ---------- PASO 2: PROCESAMIENTO CONCURRENTE ----------
  const startProcessing = async () => {
    setStep('PROCESSING')
    setProgress(0)
    
    const results = []
    let currentIndex = 0
    const CONCURRENCY_LIMIT = 5 // Máximo 5 envíos a la vez a GCloud

    const worker = async () => {
      while (currentIndex < files.length) {
        const index = currentIndex++
        const item = files[index]
        
        try {
          // ✨ INICIO COMPRESIÓN DE IMAGEN
          let fileToUpload = item.file
          try {
            const options = {
              maxSizeMB: 1, // Límite de 1MB
              maxWidthOrHeight: 1920,
              useWebWorker: true
            }
            fileToUpload = await imageCompression(item.file, options)
          } catch (compErr) {
            console.error('Error al comprimir, subiendo original:', compErr)
          }
          // ✨ FIN COMPRESIÓN

          const formData = new FormData()
          // Mandamos el archivo comprimido
          formData.append('file', fileToUpload) 
          
          const res = await processSingleMassiveVoucher(formData)
          
          if (res.success) {
            results.push({
              localId: item.id,
              preview: item.preview,
              dbId: res.dbId,
              extractedId: res.extractedId,
              extractedDate: res.extractedDate,
              companyId: res.companyId
            })
          }
        } catch (error) {
          console.error(`Error procesando ${item.file.name}:`, error)
          results.push({
            localId: item.id,
            preview: item.preview,
            dbId: null, // Falló
            extractedId: '',
            extractedDate: '', 
            companyId: companies[0]?.id
          })
        }
        
        setProgress(prev => prev + 1)
      }
    }

    // Levantar los workers
    const workers = Array.from({ length: Math.min(CONCURRENCY_LIMIT, files.length) }, () => worker())
    await Promise.all(workers)
    
    // Al terminar, pasamos a revisión
    setProcessedResults(results)
    setStep('REVIEW')
  }

  // ---------- PASO 3: REVISIÓN ----------
  const handleResultChange = (localId, field, value) => {
    setProcessedResults(prev => prev.map(item => 
      item.localId === localId ? { ...item, [field]: value } : item
    ))
  }

  const handleFinalSave = async () => {
    const hasErrors = processedResults.some(r => !r.extractedId || !r.extractedDate)
    
    if (hasErrors) {
      alert("¡Ojo! No puedes guardar aún. Faltan datos por completar. Revisa los campos marcados en rojo (ID) y amarillo (Fecha).")
      return 
    }

    setIsSaving(true)
    const validData = processedResults.filter(r => r.dbId)
    
    try {
      const result = await confirmMassiveBatch(validData)
      
      if (!result.success) {
        alert(result.error)
        setIsSaving(false)
        return
      }

      router.push('/dashboard/voucher/manage')
    } catch (error) {
      alert("Hubo un error inesperado al guardar los vouchers. Inténtalo de nuevo.")
      setIsSaving(false)
    }
  }

  return (
    <main className="container py-5" style={{ maxWidth: '1000px' }}>
      <header className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
        <h1 className="display-6 fw-bold text-dark m-0">Carga Masiva</h1>
        {step === 'SELECT' && (
          <Link href="/dashboard/voucher" className="btn btn-outline-dark fw-medium px-4">
            Volver
          </Link>
        )}
      </header>

      {/* ----------- VISTA DE SELECCIÓN ----------- */}
      {step === 'SELECT' && (
        <section className="fade-in">
          <div className="alert alert-warning d-flex align-items-center" role="alert">
            <div><strong>⚠️ Recuerda:</strong> Límite de {MAX_FILES} imágenes por sesión.</div>
          </div>

          <div className="mb-4">
            <label className="d-block text-center p-5 bg-light rounded" style={{ border: '2px dashed #0d6efd', cursor: 'pointer' }}>
              <span className="text-primary fw-bold fs-5 d-block mb-1">Seleccionar imágenes</span>
              <span className="text-muted small">(Usa múltiple selección en tu galería)</span>
              <input type="file" multiple accept="image/*" className="d-none" onChange={handleFileChange} />
            </label>
          </div>

          {files.length > 0 && (
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-header bg-white d-flex justify-content-between align-items-center py-3">
                <h6 className="m-0 fw-bold">Seleccionadas ({files.length})</h6>
                <button onClick={clearAll} className="btn btn-sm btn-link text-danger text-decoration-none p-0">Borrar todo</button>
              </div>
              <ul className="list-group list-group-flush" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {files.map((item, index) => (
                  <li key={item.id} className="list-group-item d-flex justify-content-between align-items-center py-2">
                    <span className="text-truncate" style={{ maxWidth: '70%', fontSize: '0.9rem' }}>{index + 1}. {item.file.name}</span>
                    <div>
                      <button onClick={() => setPreviewUrl(item.preview)} className="btn btn-sm btn-outline-primary me-2">👁️ Ver</button>
                      <button onClick={() => removeFile(item.id)} className="btn btn-sm btn-outline-danger">🗑️</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="d-flex justify-content-end mt-4">
            <button disabled={files.length === 0} onClick={startProcessing} className="btn btn-primary px-5 py-2 fw-medium">
              Extraer Datos ({files.length})
            </button>
          </div>
        </section>
      )}

      {/* ----------- VISTA DE PROCESAMIENTO ----------- */}
      {step === 'PROCESSING' && (
        <section className="text-center py-5 fade-in">
          <h4 className="mb-4">Escaneando vouchers con Inteligencia Artificial...</h4>
          <div className="progress mb-3" style={{ height: '30px' }}>
            <div 
              className="progress-bar progress-bar-striped progress-bar-animated bg-primary" 
              role="progressbar" 
              style={{ width: `${(progress / files.length) * 100}%` }}
            >
              {Math.round((progress / files.length) * 100)}%
            </div>
          </div>
          <p className="text-muted fw-bold">{progress} de {files.length} procesados</p>
          <p className="small text-danger">Por favor no cierres esta ventana.</p>
        </section>
      )}

      {/* ----------- VISTA DE REVISIÓN ----------- */}
      {step === 'REVIEW' && (
        <section className="fade-in">
          <div className="alert alert-success">
            <strong>¡Extracción completada!</strong> Revisa y corrige los datos si es necesario antes de guardarlos.
          </div>
          
          <div className="table-responsive shadow-sm rounded border bg-white mb-4" style={{ maxHeight: '600px' }}>
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light sticky-top">
                <tr>
                  <th scope="col" className="px-3">#</th>
                  <th scope="col">Imagen</th>
                  <th scope="col">ID Viaje</th>
                  <th scope="col">Fecha</th>
                  <th scope="col">Mundo</th>
                </tr>
              </thead>
              <tbody>
                {processedResults.map((res, index) => (
                  <tr key={res.localId}>
                    <td className="px-3 fw-bold text-muted">{index + 1}</td>
                    <td>
                      <img 
                        src={res.preview} 
                        alt="voucher" 
                        className="rounded border cursor-pointer" 
                        style={{ width: '50px', height: '50px', objectFit: 'cover', cursor: 'pointer' }}
                        onClick={() => setPreviewUrl(res.preview)}
                        title="Clic para agrandar"
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        className={`form-control form-control-sm ${!res.extractedId ? 'border-danger border-2 bg-danger bg-opacity-10' : ''}`} 
                        value={res.extractedId} 
                        onChange={(e) => handleResultChange(res.localId, 'extractedId', e.target.value)}
                        placeholder="Ej: 12345"
                      />
                    </td>
                    <td>
                      <input 
                        type="date" 
                        className={`form-control form-control-sm ${!res.extractedDate ? 'border-warning border-2 bg-warning bg-opacity-10' : ''}`} 
                        value={res.extractedDate} 
                        onChange={(e) => handleResultChange(res.localId, 'extractedDate', e.target.value)}
                      />
                    </td>
                    <td>
                      <select 
                        className="form-select form-select-sm" 
                        value={res.companyId || ''} 
                        onChange={(e) => handleResultChange(res.localId, 'companyId', e.target.value)}
                      >
                        {companies.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="d-flex justify-content-between align-items-center">
            <span className="text-muted small">Revisa bien los campos en rojo (sin ID detectado) o amarillo (sin fecha).</span>
            <button onClick={handleFinalSave} disabled={isSaving} className="btn btn-success px-5 py-2 fw-medium">
              {isSaving ? 'Guardando...' : 'Confirmar y Guardar Todos'}
            </button>
          </div>
        </section>
      )}

      {/* ----------- MODAL DE PREVISUALIZACIÓN ----------- */}
      {previewUrl && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" 
          style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1050 }}
        >
          <div className="card border-0" style={{ maxWidth: '90%', maxHeight: '90vh' }}>
            <div className="card-header bg-light d-flex justify-content-end p-2 border-0">
              <button onClick={() => setPreviewUrl(null)} className="btn-close"></button>
            </div>
            <div className="card-body text-center p-3 overflow-auto">
              <img src={previewUrl} alt="Vista previa" style={{ maxHeight: '75vh', maxWidth: '100%', objectFit: 'contain' }} />
            </div>
          </div>
        </div>
      )}
    </main>
  )
}