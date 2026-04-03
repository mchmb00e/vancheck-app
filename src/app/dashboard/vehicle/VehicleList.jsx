'use client'

import { useState } from 'react'
import { updateVehicle, deleteVehicle } from '@/app/actions/vehicle'
import { Clock, Pen, PencilFill, PenFill, Trash } from 'react-bootstrap-icons'

export default function VehicleList({ initialVehicles }) {
    const [editingId, setEditingId] = useState(null)
    const [loadingAction, setLoadingAction] = useState(null)
    const [errorMsg, setErrorMsg] = useState('')

    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro que deseas eliminar este vehículo? Esta acción no se puede deshacer.')) return

        setLoadingAction(`delete-${id}`)
        try {
            await deleteVehicle(id)
        } catch (err) {
            alert('Error al eliminar (Quizás el vehículo ya tiene datos asociados): ' + err.message)
        } finally {
            setLoadingAction(null)
        }
    }

    const handleUpdate = async (e, id) => {
        e.preventDefault()
        setLoadingAction(`edit-${id}`)
        setErrorMsg('')
        const formData = new FormData(e.target)

        try {
            await updateVehicle(id, formData)
            setEditingId(null)
        } catch (err) {
            setErrorMsg(err.message)
        } finally {
            setLoadingAction(null)
        }
    }

    if (!initialVehicles?.length) {
        return (
            <div className="text-center p-5 border rounded bg-white text-muted">
                Aún no tienes vehículos registrados. ¡Añade uno arriba al tiro!
            </div>
        )
    }

    return (
        <div className="bg-white rounded shadow-sm border-0 p-3">
            {errorMsg && <div className="alert alert-danger mb-3">{errorMsg}</div>}
            <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                        <tr>
                            <th>Apodo</th>
                            <th>Patente</th>
                            <th className="text-end">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {initialVehicles.map((vehicle) => (
                            <tr key={vehicle.id}>
                                {editingId === vehicle.id ? (
                                    <td colSpan="3">
                                        <form onSubmit={(e) => handleUpdate(e, vehicle.id)} className="row g-2 align-items-center">
                                            <div className="col-sm-5">
                                                <input type="text" name="name" defaultValue={vehicle.name} className="form-control form-control-sm" required />
                                            </div>
                                            <div className="col-sm-4">
                                                <input type="text" name="patent" defaultValue={vehicle.patent} className="form-control form-control-sm text-uppercase" required />
                                            </div>
                                            <div className="col-sm-3 text-end d-flex gap-2 justify-content-end">
                                                <button type="submit" className="btn btn-sm btn-success" disabled={loadingAction === `edit-${vehicle.id}`}>
                                                    {loadingAction === `edit-${vehicle.id}` ? '...' : 'Guardar'}
                                                </button>
                                                <button type="button" className="btn btn-sm btn-secondary" onClick={() => setEditingId(null)}>
                                                    Cancelar
                                                </button>
                                            </div>
                                        </form>
                                    </td>
                                ) : (
                                    <>
                                        <td className="fw-medium">{vehicle.name}</td>
                                        <td><span className="badge bg-secondary">{vehicle.patent}</span></td>
                                        <td className="text-end">
                                            <button
                                                onClick={() => setEditingId(vehicle.id)}
                                                className="btn btn-sm btn-outline-primary me-2"
                                                title="Editar vehículo"
                                                disabled={loadingAction !== null}
                                            >
                                                {/* Aquí va el lapicito para editar */}
                                                <PencilFill  size={16} />
                                            </button>

                                            <button
                                                onClick={() => handleDelete(vehicle.id)}
                                                className="btn btn-sm btn-outline-danger"
                                                title="Eliminar vehículo"
                                                disabled={loadingAction === `delete-${vehicle.id}`}
                                            >
                                                {/* Y aquí dejamos solo la lógica del relojito o el basurero */}
                                                {loadingAction === `delete-${vehicle.id}` ? (
                                                    <Clock  size={16} />
                                                ) : (
                                                    <Trash  size={16} />
                                                )}
                                            </button>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}