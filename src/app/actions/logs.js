'use server'

import prisma from '@/lib/prisma'
import { headers } from 'next/headers'

/* Centraliza el registro de eventos de seguridad y auditoría en la base de datos, capturando automáticamente metadatos de red como la dirección IP y el agente de usuario. */

export async function logAuthAction(user_id, success, action, ip = null, user_agent = null) {
  try {
    const headersList = await headers()
    const finalIp = ip || headersList.get('x-forwarded-for') || 'IP_Desconocida'
    const finalUserAgent = user_agent || headersList.get('user-agent') || 'Navegador_Desconocido'

    await prisma.auth_logs.create({
      data: {
        user_id: user_id,
        success: success,
        action: action,
        ip: finalIp,
        user_agent: finalUserAgent
      }
    })
  } catch (error) {
    // Silenciado para producción
  }
}

export async function logAuditAction(user_id, success, action) {
  try {
    await prisma.audit_logs.create({
      data: {
        user_id: user_id,
        success: success,
        action: action
      }
    })
  } catch (error) {
    // Silenciado para producción
  }
}