import { useEffect, useState } from 'react'
import { consultarHistorialCliente } from '../api'
import { nombreParaMostrar } from './Identificacion'

// ────────────────────────────────────────────────────────────────────────
// Cuando el cliente ya se identificó, buscamos su historial real de
// compras confirmadas y le sugerimos su favorito — la idea de "si
// vuelve, que lo reconozcamos". Si nunca compró antes (cliente nuevo o
// identificador distinto), no muestra nada raro, solo un saludo simple.
// ────────────────────────────────────────────────────────────────────────
export default function Bienvenida({ cliente }) {
  const [historial, setHistorial] = useState(null)

  useEffect(() => {
    if (!cliente) { setHistorial(null); return }
    const identificador = cliente.email || cliente.telefono || cliente.nombre
    consultarHistorialCliente(identificador).then(setHistorial).catch(() => setHistorial(null))
  }, [cliente])

  if (!cliente) return null
  const nombre = nombreParaMostrar(cliente)

  return (
    <div className="bienvenida">
      {historial?.encontrado ? (
        <>
          ¡Qué bueno tenerte de nuevo, <b>{nombre}</b>! Ya pediste{' '}
          <b>{historial.bebidas_compradas}</b> {historial.bebidas_compradas === 1 ? 'bebida' : 'bebidas'} acá,
          y tu favorito es <b>{historial.favorito}</b> ({historial.veces_favorito}×). ¿Repetimos?
        </>
      ) : (
        <>¡Bienvenido, <b>{nombre}</b>! Este es tu primer pedido con nosotros — mirá la carta y armá el tuyo.</>
      )}
    </div>
  )
}
