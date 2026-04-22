'use server'

import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { DocumentProcessorServiceClient } from '@google-cloud/documentai'
import { PDFDocument } from 'pdf-lib'
import { logAuditAction } from '@/app/actions/logs'

const documentAiClient = new DocumentProcessorServiceClient({
  credentials: {
    client_email: process.env.GCP_CLIENT_EMAIL,
    private_key: process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }
})

const getTokenText = (token, fullText) => {
  const segments = token.layout?.textAnchor?.textSegments
  if (!segments || segments.length === 0) return ''
  const startIndex = segments[0].startIndex || 0
  const endIndex = segments[0].endIndex
  return fullText.substring(startIndex, endIndex).trim()
}

const getMidX = (token) => {
  const vertices = token.layout?.boundingPoly?.normalizedVertices
  if (!vertices || vertices.length === 0) return 0
  const xs = vertices.map(v => v.x)
  return (Math.min(...xs) + Math.max(...xs)) / 2
}

const getMidY = (token) => {
  const vertices = token.layout?.boundingPoly?.normalizedVertices
  if (!vertices || vertices.length === 0) return 0
  const ys = vertices.map(v => v.y)
  return (Math.min(...ys) + Math.max(...ys)) / 2
}

// ✨ Modificamos para recibir el vehicleId
export async function processSpreadsheetAnalysis(spreadsheetId, companyDates, startPage = 2, endPage = null, vehicleId = null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('No estás autorizado')

  try {
    const spreadsheet = await prisma.spreadsheets.findUnique({
      where: { id: spreadsheetId }
    })
    if (!spreadsheet) throw new Error('Planilla no encontrada')

    const companies = await prisma.companies.findMany()

    let globalStartDate = new Date('2099-01-01T00:00:00Z')
    let globalEndDate = new Date('1970-01-01T00:00:00Z')
    const parsedDates = {}

    for (const [compId, dates] of Object.entries(companyDates)) {
      const start = new Date(`${dates.start}T00:00:00Z`)
      const end = new Date(`${dates.end}T23:59:59Z`)
      parsedDates[compId] = { start, end }

      if (start < globalStartDate) globalStartDate = start
      if (end > globalEndDate) globalEndDate = end
    }

    // Armamos el WHERE base
    const whereClause = {
      user_id: user.id,
      voucher_date: {
        gte: globalStartDate,
        lte: globalEndDate
      }
    }

    // ✨ Si hay un vehículo seleccionado, filtramos estrictamente por él
    if (vehicleId) {
      whereClause.vehicle_id = vehicleId
    }

    const rawVouchers = await prisma.vouchers.findMany({
      where: whereClause,
      include: { companies: true }
    })

    const userVouchers = rawVouchers.filter(v => {
      if (!v.voucher_company_id) return true;
      
      const compDate = parsedDates[v.voucher_company_id]
      if (compDate) {
        return v.voucher_date >= compDate.start && v.voucher_date <= compDate.end
      }
      return true; 
    })

    const startTime = Date.now()

    const { data: fileData, error: downloadError } = await supabase.storage
      .from('vancheck-bucket')
      .download(spreadsheet.file_url)

    if (downloadError) throw new Error('No se pudo descargar el PDF')

    const arrayBuffer = await fileData.arrayBuffer()

    const pdfDoc = await PDFDocument.load(arrayBuffer)
    const pageCount = pdfDoc.getPageCount()

    if (pageCount > 10) {
      throw new Error(`El documento tiene ${pageCount} páginas. Máximo 10 permitidas.`)
    }

    const encodedPdf = Buffer.from(arrayBuffer).toString('base64')
    const name = `projects/${process.env.GOOGLE_CLOUD_PROJECT_ID}/locations/${process.env.GOOGLE_DOCUMENT_AI_LOCATION}/processors/${process.env.GOOGLE_DOCUMENT_AI_PROCESSOR_ID}`

    const request = {
      name,
      rawDocument: {
        content: encodedPdf,
        mimeType: 'application/pdf',
      }
    }

    const [result] = await documentAiClient.processDocument(request)
    const fullText = result.document.text
    const pages = result.document.pages

    const extractedData = []
    const loopStart = Math.max(0, startPage - 1)
    const loopEnd = endPage ? Math.min(endPage, pages.length) : pages.length

    for (let i = loopStart; i < loopEnd; i++) {
      const page = pages[i]
      const tokens = page.tokens
      if (!tokens) continue

      let lines = []
      const Y_TOLERANCE = 0.008

      for (const token of tokens) {
        const text = getTokenText(token, fullText).trim()
        if (!text) continue
        const midX = getMidX(token)
        const midY = getMidY(token)
        let foundLine = lines.find(l => Math.abs(l.midY - midY) < Y_TOLERANCE)
        if (foundLine) {
          foundLine.tokens.push({ text, midX, midY })
          foundLine.midY = ((foundLine.midY * (foundLine.tokens.length - 1)) + midY) / foundLine.tokens.length
        } else {
          lines.push({ midY, tokens: [{ text, midX, midY }] })
        }
      }

      lines.sort((a, b) => a.midY - b.midY)
      for (const line of lines) line.tokens.sort((a, b) => a.midX - b.midX)

      let pageHeaders = []
      for (const line of lines) {
        for (const token of line.tokens) {
          const textUpper = token.text.toUpperCase()
          const matchCompany = companies.find(c => textUpper.includes(c.name.toUpperCase()))
          if (matchCompany && !pageHeaders.find(h => h.companyId === matchCompany.id)) {
            pageHeaders.push({ companyId: matchCompany.id, name: matchCompany.name, midX: token.midX })
          }
        }
      }

      for (const line of lines) {
        const dateIndex = line.tokens.findIndex(t => t.text.match(/\d{2}[-\/]\d{2}[-\/]\d{4}/))
        const fecha = dateIndex !== -1 ? line.tokens[dateIndex].text : "Sin fecha"
        
        // ✨ LA MAGIA NUEVA: Juntamos todo el texto de la línea para buscar IDs
        const textoFilaCompleto = line.tokens.map(t => t.text).join(' ');
        
        // Expresión regular: busca de 6 a 8 números, un guión, y 1 o 2 números (ej: 2726504-5 o 2687562-18)
        const idRegex = /\b\d{6,8}-\d{1,2}\b/g;
        const matches = [...textoFilaCompleto.matchAll(idRegex)];

        // Si no hay nada que parezca un ID en esta fila, seguimos con la siguiente
        if (matches.length === 0) continue; 

        // Extraemos todos los IDs que la Regex pilló en esta fila
        const idsEncontrados = matches.map(m => m[0]);

        // Buscamos el monto igual que antes
        let montoToken = null
        let montoText = "0" 
        let searchStart = dateIndex !== -1 ? dateIndex + 1 : 1;
        
        for (let k = searchStart; k < line.tokens.length; k++) {
          const t = line.tokens[k]
          if (t.text === '$') continue
          if (t.text.match(/[\d\.]+/)) {
            montoToken = t
            montoText = t.text.replace('$', '').trim()
            break
          }
        }

        // Buscamos a qué empresa (mundo) corresponde
        let mundoName = null
        let mundoId = null
        if (montoToken && pageHeaders.length > 0) {
          let closestHeader = pageHeaders[0]
          let minDiff = Math.abs(montoToken.midX - pageHeaders[0].midX)
          for (let h = 1; h < pageHeaders.length; h++) {
            const diff = Math.abs(montoToken.midX - pageHeaders[h].midX)
            if (diff < minDiff) {
              minDiff = diff
              closestHeader = pageHeaders[h]
            }
          }
          mundoName = closestHeader.name
          mundoId = closestHeader.companyId
        }

        // ✨ NUEVO: Guardamos un registro por CADA ID que hayamos encontrado en la línea.
        // Así, si Document AI juntó 3 IDs en la misma fila, guardamos los 3.
        for (const id_viaje of idsEncontrados) {
          extractedData.push({ 
            id_viaje: id_viaje, 
            fecha, 
            monto: montoText, 
            mundo: mundoName, 
            mundo_id: mundoId 
          });
        }
      }
    }


    for (let i = 0; i < extractedData.length; i++) {
      if (!extractedData[i].mundo) {
        if (i > 0 && extractedData[i - 1].mundo) {
          extractedData[i].mundo = extractedData[i - 1].mundo
          extractedData[i].mundo_id = extractedData[i - 1].mundo_id
        } else if (i < extractedData.length - 1) {
          let lookahead = i + 1;
          while (lookahead < extractedData.length && !extractedData[lookahead].mundo) lookahead++;
          if (lookahead < extractedData.length) {
            extractedData[i].mundo = extractedData[lookahead].mundo
            extractedData[i].mundo_id = extractedData[lookahead].mundo_id
          }
        }
      }
    }

    // ✨ NUEVO: Función para limpiar IDs (respeta los guiones que vienen en tu planilla)
    const limpiarId = (id) => {
      if (id === null || id === undefined) return '';
      return String(id).trim().toLowerCase();
    };


    extractedData.forEach(item => {
      item.monto = parseInt(item.monto.replace(/\./g, ''), 10) || 0
      
      const idPdfLimpio = limpiarId(item.id_viaje);
      
      item.hubo_match = !!userVouchers.find(v => {
        const idBdLimpio = limpiarId(v.voucher_number);
        
        
        return idBdLimpio === idPdfLimpio;
      })
    })

    const matched = extractedData.filter(item => item.hubo_match)
    
    // 1. Buscamos los que faltan en la planilla (aquí pueden venir repetidos si el usuario subió el mismo varias veces)
    const missingInPlanillaBruto = userVouchers.filter(v => {
      const idBdLimpio = limpiarId(v.voucher_number);
      return !extractedData.some(item => limpiarId(item.id_viaje) === idBdLimpio);
    })

    // ✨ 2. NUEVO: Pasamos el filtro VIP para eliminar los duplicados
    const idsVistos = new Set();
    const missingInPlanilla = missingInPlanillaBruto.filter(v => {
      const idLimpio = limpiarId(v.voucher_number);
      
      // Si ya vimos este ID antes, lo pateamos (false)
      if (idsVistos.has(idLimpio)) {
        return false; 
      } 
      
      // Si es nuevecito, lo anotamos en la lista VIP y lo dejamos pasar (true)
      idsVistos.add(idLimpio);
      return true;
    });
    
    const missingInProfile = extractedData.filter(item => !item.hubo_match)

    const execTimeSeconds = parseFloat(((Date.now() - startTime) / 1000).toFixed(2))

    let analyzedVehicle = null
    if (vehicleId) {
      analyzedVehicle = await prisma.vehicles.findUnique({ where: { id: vehicleId } })
    }

    const newAnalysis = await prisma.analysis.create({
      data: {
        spreadsheet_id: spreadsheetId,
        user_id: user.id,
        start_date: globalStartDate,
        end_date: globalEndDate,
        start_page: startPage,
        end_page: loopEnd,
        error_count: missingInPlanilla.length,
        exec_time: execTimeSeconds,
        vehicle_id: vehicleId 
      }
    })

    await logAuditAction(user.id, true, `process spreadsheet analysis ${spreadsheetId}`)

    return { 
      success: true, 
      data: { analysisId: newAnalysis.id, matched, missingInPlanilla, missingInProfile, analyzedVehicle } 
    }
  } catch (error) {
    await logAuditAction(user.id, false, `process spreadsheet analysis ${spreadsheetId}`)
    throw error
  }
}

export async function submitAnalysisFeedback(analysisId, isConforme) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')

  try {
    await prisma.analysis.update({
      where: { id: analysisId },
      data: { user_feedback: isConforme }
    })
    
    await logAuditAction(user.id, true, `submit analysis feedback ${analysisId}`)
    return { success: true }
  } catch (error) {
    await logAuditAction(user.id, false, `submit analysis feedback ${analysisId}`)
    return { success: false }
  }
}

export async function getSpreadsheetUrl(spreadsheetId) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')

  const spreadsheet = await prisma.spreadsheets.findUnique({
    where: { id: spreadsheetId, user_id: user.id }
  })

  if (!spreadsheet) throw new Error('Planilla no encontrada')

  const { data, error } = await supabase.storage
    .from('vancheck-bucket')
    .createSignedUrl(spreadsheet.file_url, 3600) 

  if (error || !data) throw new Error('Error al generar enlace de la planilla')
  
  return data.signedUrl
}

export async function generateUnpaidVouchersPdf(missingVouchersIds) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')

  try {
    const vouchers = await prisma.vouchers.findMany({
      where: { 
        user_id: user.id,
        id: { in: missingVouchersIds },
        file_path: { not: null } 
      }
    })

    if (vouchers.length === 0) throw new Error('No hay vouchers con imagen para descargar.')

    const pdfDoc = await PDFDocument.create()

    for (const voucher of vouchers) {
      const { data: fileData, error } = await supabase.storage
        .from('vancheck-bucket')
        .download(voucher.file_path)

      if (error || !fileData) continue

      const imageBuffer = await fileData.arrayBuffer()
      
      let image;
      try {
        try {
          image = await pdfDoc.embedJpg(imageBuffer)
        } catch (jpgErr) {
          image = await pdfDoc.embedPng(imageBuffer)
        }
      } catch (e) {
        console.error(`Formato no soportado o archivo corrupto para el voucher ${voucher.id}:`, e)
        continue; 
      }

      const page = pdfDoc.addPage()
      const { width, height } = page.getSize()
      const imgDims = image.scaleToFit(width - 100, height - 100)

      page.drawImage(image, {
        x: page.getWidth() / 2 - imgDims.width / 2,
        y: page.getHeight() / 2 - imgDims.height / 2,
        width: imgDims.width,
        height: imgDims.height,
      })

      page.drawText(`Voucher ID: ${voucher.voucher_number}`, {
        x: 50,
        y: height - 50,
        size: 14,
      })
    }

    if (pdfDoc.getPageCount() === 0) {
      throw new Error('No se pudo procesar ninguna imagen. Es posible que estén en un formato no soportado (ej: HEIC, WEBP).')
    }

    const pdfBytes = await pdfDoc.save()
    const base64Pdf = Buffer.from(pdfBytes).toString('base64')
    
    return { success: true, pdfBase64: base64Pdf }
  } catch (error) {
    console.error("Error generando PDF:", error)
    return { success: false, error: error.message }
  }
}