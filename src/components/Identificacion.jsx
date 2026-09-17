import { useState } from 'react'

const CLAVE_STORAGE = 'sofia_cliente_v1'

export function cargarCliente() {
  try {
    const guardado = localStorage.getItem(CLAVE_STORAGE)
    return guardado ? JSON.parse(guardado) : null
  } catch {
    return null
  }
}

function guardarCliente(cliente) {
  try {
    if (cliente) localStorage.setItem(CLAVE_STORAGE, JSON.stringify(cliente))
    else localStorage.removeItem(CLAVE_STORAGE)
  } catch {
    // localStorage puede fallar (modo privado, cuota llena) — no es crítico
  }
}

// ────────────────────────────────────────────────────────────────────────
// Identificación simple del cliente: nombre + email o celular (alcanza
// con uno de los dos). Se guarda en este navegador (localStorage), así
// que la próxima vez que vuelva desde el mismo dispositivo ya lo
// reconoce sin volver a preguntarle. El dato viaja con cada pedido para
// poder armarle historial de compras.
// ────────────────────────────────────────────────────────────────────────
export default function Identificacion({ cliente, onCambiar }) {
  const [editando, setEditando] = useState(!cliente)
  const [nombre, setNombre] = useState(cliente?.nombre || '')
  const [email, setEmail] = useState(cliente?.email || '')
  const [telefono, setTelefono] = useState(cliente?.telefono || '')

  function guardar(e) {
    e.preventDefault()
    if (!nombre.trim() || (!email.trim() && !telefono.trim())) return
    const nuevo = { nombre: nombre.trim(), email: email.trim(), telefono: telefono.trim() }
    guardarCliente(nuevo)
    onCambiar(nuevo)
    setEditando(false)
  }

  function olvidar() {
    guardarCliente(null)
    onCambiar(null)
    setNombre('')
    setEmail('')
    setTelefono('')
    setEditando(true)
  }

  if (!editando && cliente) {
    return (
      <div className="identificacion identificacion-lista">
        <span>👋 Hola, <b>{cliente.nombre}</b></span>
        <button type="button" className="identificacion-link" onClick={() => setEditando(true)}>Cambiar</button>
        <button type="button" className="identificacion-link" onClick={olvidar}>No soy yo</button>
      </div>
    )
  }

  return (
    <form className="identificacion identificacion-form" onSubmit={guardar}>
      <input placeholder="Tu nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
      <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <span className="identificacion-o">o</span>
      <input placeholder="Celular" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
      <button type="submit" className="tbtn vende">Guardar</button>
      {cliente && (
        <button type="button" className="identificacion-link" onClick={() => setEditando(false)}>Cancelar</button>
      )}
    </form>
  )
}
