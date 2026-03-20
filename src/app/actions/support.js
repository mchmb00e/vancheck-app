'use server'

import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { logAuditAction } from '@/app/actions/logs'

/* Gestiona la creación de tickets de soporte técnico vinculando automáticamente las preferencias de contacto del perfil del usuario. */

export async function submitSupportTicket(formData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autorizado' }
  }

  const message = formData.get('message')
  const contactMethod = formData.get('contact_method')

  if (!message || message.trim() === '') {
    redirect('/dashboard/support?error=El mensaje no puede estar vacío')
  }

  let isSuccess = false

  try {
    const perfil = await prisma.users.findUnique({
      where: { id: user.id },
      select: { tel: true, email: true }
    })

    let contactTag = ''
    if (contactMethod === 'whatsapp') {
      contactTag = `[WhatsApp: ${perfil.tel || 'No registrado'}]`
    } else {
      contactTag = `[Correo Electrónico: ${perfil.email || 'No registrado'}]`
    }

    const finalMessage = `${contactTag} ${message.trim()}`

    await prisma.support.create({
      data: {
        user_id: user.id,
        message: finalMessage,
      }
    })
    
    isSuccess = true
  } catch (error) {
    isSuccess = false
  }

  if (isSuccess) {
    await logAuditAction(user.id, true, 'submit ticket support')
    redirect('/dashboard/support?success=Un administrador se comunicará pronto contigo para entregarte una solución por el medio de comunicación que seleccionaste.')
  } else {
    await logAuditAction(user.id, false, 'submit ticket support')
    redirect('/dashboard/support?error=Hubo un problema al enviar el mensaje')
  }
}