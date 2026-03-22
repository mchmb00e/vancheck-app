'use server'

import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { DocumentProcessorServiceClient } from '@google-cloud/documentai'
import { PDFDocument } from 'pdf-lib'
import { logAuditAction } from '@/app/actions/logs'

/* Ejecuta el análisis de cruce de datos entre planillas PDF y vouchers del usuario utilizando Google Document AI, validando la extensión del documento y registrando resultados y feedback de auditoría. */

const documentAiClient = new DocumentProcessorServiceClient()

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

export async function processSpreadsheetAnalysis(spreadsheetId, companyDates, startPage = 2, endPage = null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('No estás autorizado')

  try {
    const spreadsheet = await prisma.spreadsheets.findUnique({
      where: { id: spreadsheetId }
    })
    if (!spreadsheet) throw new Error('Planilla no encontrada')

    const companies = await prisma.companies.findMany()

    // Calcular límites globales para optimizar la consulta a la BD
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

    // Traer vouchers usando el rango global
    const rawVouchers = await prisma.vouchers.findMany({
      where: {
        user_id: user.id,
        voucher_date: {
          gte: globalStartDate,
          lte: globalEndDate
        }
      }
    })

    // Filtrar estrictamente por el rango de cada mundo
    const userVouchers = rawVouchers.filter(v => {
      // Si no tiene mundo o es un mundo excluido (no mapeado), lo aceptamos dentro del límite global
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
        if (dateIndex === -1) continue
        const fecha = line.tokens[dateIndex].text
        let id_viaje = dateIndex > 0 ? line.tokens[0].text : ""
        if (!id_viaje.match(/\d/)) continue

        let montoToken = null
        let montoText = "0" 
        for (let k = dateIndex + 1; k < line.tokens.length; k++) {
          const t = line.tokens[k]
          if (t.text === '$') continue
          if (t.text.match(/[\d\.]+/)) {
            montoToken = t
            montoText = t.text.replace('$', '').trim()
            break
          }
        }

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
        extractedData.push({ id_viaje, fecha, monto: montoText, mundo: mundoName, mundo_id: mundoId })
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

    extractedData.forEach(item => {
      item.monto = parseInt(item.monto.replace(/\./g, ''), 10) || 0
      item.hubo_match = !!userVouchers.find(v => v.voucher_number === item.id_viaje)
    })

    const matched = extractedData.filter(item => item.hubo_match)
    const missingInPlanilla = userVouchers.filter(v => !extractedData.some(item => item.id_viaje === v.voucher_number))
    const missingInProfile = extractedData.filter(item => !item.hubo_match)
    const execTimeSeconds = parseFloat(((Date.now() - startTime) / 1000).toFixed(2))

    const newAnalysis = await prisma.analysis.create({
      data: {
        spreadsheet_id: spreadsheetId,
        user_id: user.id,
        start_date: globalStartDate,
        end_date: globalEndDate,
        start_page: startPage,
        end_page: loopEnd,
        error_count: missingInPlanilla.length,
        exec_time: execTimeSeconds
      }
    })

    await logAuditAction(user.id, true, `process spreadsheet analysis ${spreadsheetId}`)

    return { 
      success: true, 
      data: { analysisId: newAnalysis.id, matched, missingInPlanilla, missingInProfile } 
    }
  } catch (error) {
    await logAuditAction(user.id, false, `process spreadsheet analysis ${spreadsheetId}`)
    throw error
  }
}

// ¡Acá está la que se te había borrado!
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