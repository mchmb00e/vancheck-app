export const runtime = 'nodejs'

import prisma from '@/lib/prisma'
import { cancelAndRollbackVoucher } from '@/app/actions/voucher' 
import { createClient } from '@/lib/supabase/server'
import ReviewForm from './ReviewForm'

export const metadata = {
  title: 'Resultados | VanCheck',
};

export default async function ResultPage({ searchParams }) {
    const params = await searchParams
    const id = params?.id

    if (!id) {
        return <div className="container mt-5 text-center">Falta el ID del voucher.</div>
    }

    const [voucher, companies] = await Promise.all([
        prisma.vouchers.findUnique({
            where: { id },
            include: { companies: true }
        }),
        prisma.companies.findMany({
            orderBy: { name: 'asc' }
        })
    ])

    if (!voucher) {
        return <div className="container mt-5 text-center">Voucher no encontrado.</div>
    }

    const supabase = await createClient()
    const { data: publicUrlData } = supabase.storage
        .from('vancheck-bucket')
        .getPublicUrl(voucher.file_path)

    const handleRollback = async () => {
        'use server'
        await cancelAndRollbackVoucher(voucher.id, voucher.file_path)
    }

    return (
        <main className="container py-5" style={{ maxWidth: '900px' }}>
            <header className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                <h1 className="display-6 fw-bold text-dark m-0">Resultado del Escaneo</h1>
                
                <form action={handleRollback}>
                    <button type="submit" className="btn btn-outline-danger fw-medium px-4">
                        Cancelar y Borrar
                    </button>
                </form>

            </header>

            <ReviewForm 
                voucher={voucher} 
                companies={companies} 
                imageUrl={publicUrlData.publicUrl} 
            />
        </main>
    )
}