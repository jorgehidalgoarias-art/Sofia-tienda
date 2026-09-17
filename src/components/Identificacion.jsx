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

// El cliente puede identificarse solo con ESTO cuando lo muestra, sea
// cual sea el dato que haya elegido dar.
export function nombreParaMostrar(cliente) {
  return cliente?.nombre || cliente?.email || cliente?.telefono || ''
}

const OPCIONES = [
  { tipo: 'nombre', etiqueta: 'Nombre', placeholder: 'Tu nombre', inputType: 'text' },
  { tipo: 'email', etiqueta: 'Email', placeholder: 'tu@email.com', inputType: 'email' },
  { tipo: 'telefono', etiqueta: 'Celular', placeholder: 'Tu celular', inputType: 'tel' }
]

// ────────────────────────────────────────────────────────────────────────
// Identificación del cliente: elige UN solo dato — nombre, email o
// celular, lo que prefiera — nunca los tres. Es opcional, y se le
// explica para qué sirve. Se guarda en este navegador (localStorage),
// así que la próxima vez que vuelva ya lo reconoce sin preguntarle de
// nuevo. Ese dato viaja con cada pedido para poder armarle historial de
// compras.
// ────────────────────────────────────────────────────────────────────────
export default function Identificacion({ cliente, onCambiar }) {
  const [editando, setEditando] = useState(!cliente)
  const [tipo, setTipo] = useState(() => OPCIONES.find((o) => cliente?.[o.tipo])?.tipo || 'nombre')
  const [valor, setValor] = useState(() => cliente?.[tipo] || '')

  function elegirTipo(nuevoTipo) {
    setTipo(nuevoTipo)
    setValor(cliente?.[nuevoTipo] || '')
  }

  function guardar(e) {
    e.preventDefault()
    if (!valor.trim()) return
    const nuevo = { nombre: '', email: '', telefono: '', [tipo]: valor.trim() }
    guardarCliente(nuevo)
    onCambiar(nuevo)
    setEditando(false)
  }

  function olvidar() {
    guardarCliente(null)
    onCambiar(null)
    setValor('')
    setEditando(true)
  }

  if (!editando && cliente) {
    return (
      <div className="identificacion identificacion-lista">
        <span>👋 Hola, <b>{nombreParaMostrar(cliente)}</b></span>
        <button type="button" className="identificacion-link" onClick={() => setEditando(true)}>Cambiar</button>
        <button type="button" className="identificacion-link" onClick={olvidar}>No soy yo</button>
      </div>
    )
  }

  const opcion = OPCIONES.find((o) => o.tipo === tipo)

  return (
    <form className="identificacion identificacion-form" onSubmit={guardar}>
      <div className="identificacion-tipos">
        {OPCIONES.map((o) => (
          <button
            key={o.tipo}
            type="button"
            className={'identificacion-tipo' + (tipo === o.tipo ? ' identificacion-tipo-activo' : '')}
            onClick={() => elegirTipo(o.tipo)}
          >
            {o.etiqueta}
          </button>
        ))}
      </div>
      <input
        type={opcion.inputType}
        placeholder={opcion.placeholder}
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        required
      />
      <button type="submit" className="tbtn vende">Guardar</button>
      {cliente && (
        <button type="button" className="identificacion-link" onClick={() => setEditando(false)}>Cancelar</button>
      )}
      <p className="identificacion-motivo">
        Es opcional — te lo pedimos solo para reconocerte si volvés y darte una atención de mejor calidad
        (por ejemplo, recordar lo que sueles pedir). No lo compartimos con nadie.
      </p>
    </form>
  )
}
