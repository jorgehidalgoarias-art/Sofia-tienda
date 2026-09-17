import { useState } from 'react'
import { crearPedido } from '../api'

function fmt(n) {
  return '₡' + Number(n || 0).toLocaleString('es-CR')
}

// ────────────────────────────────────────────────────────────────────────
// El carrito del cliente. Al confirmar, el backend vuelve a chequear el
// stock real antes de crear el pedido (por si algo cambió desde que se
// armó el carrito) — si algo ya no alcanza, avisa cuál, sin crear nada a
// medias. Si todo está bien, deja el pedido "pendiente" y devuelve el
// alias de SINPE Móvil para transferir; el equipo lo confirma después
// desde /admin, y recién ahí se descuenta stock y se registra la venta.
// ────────────────────────────────────────────────────────────────────────
export default function Carrito({ carrito, cliente, onQuitar, onVaciar }) {
  const [confirmando, setConfirmando] = useState(false)
  const [pedidoListo, setPedidoListo] = useState(null)
  const [error, setError] = useState(null)
  const [copiado, setCopiado] = useState(false)

  const total = carrito.reduce((s, c) => s + c.precio * c.cantidad, 0)

  async function confirmar() {
    setError(null)
    setConfirmando(true)
    try {
      const resultado = await crearPedido(
        carrito.map((c) => ({ id_item: c.id, cantidad: c.cantidad })),
        cliente || undefined
      )
      if (!resultado.ok) {
        setError(resultado.error)
        return
      }
      setPedidoListo(resultado)
      onVaciar()
    } catch (e) {
      setError(e.message)
    } finally {
      setConfirmando(false)
    }
  }

  async function copiarAlias() {
    try {
      await navigator.clipboard.writeText(pedidoListo.alias)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      // el alias sigue visible para copiar a mano si el navegador bloquea el portapapeles
    }
  }

  if (pedidoListo) {
    return (
      <section className="carrito card">
        <h3>🎉 Pedido confirmado</h3>
        <div className="tools-note" style={{ background: '#e6f6ee', borderColor: '#bfe6cf', color: '#1f6b3f' }}>
          Referencia <b>{pedidoListo.orderId}</b> · Total <b>{fmt(pedidoListo.monto)}</b>
        </div>
        <p className="carrito-instrucciones">{pedidoListo.mensaje}</p>
        <div className="transfer-alias">
          <span>{pedidoListo.alias}</span>
          <button type="button" className="tbtn" onClick={copiarAlias}>
            {copiado ? 'Copiado ✓' : 'Copiar alias'}
          </button>
        </div>
        <button type="button" className="desafios-btn" style={{ marginTop: 16 }} onClick={() => setPedidoListo(null)}>
          Hacer otro pedido
        </button>
      </section>
    )
  }

  return (
    <section className="carrito card">
      <h3>🛒 Tu pedido</h3>
      {carrito.length === 0 ? (
        <div className="vacio">Todavía no agregaste nada de la carta.</div>
      ) : (
        <>
          <div className="carrito-lista">
            {carrito.map((c) => (
              <div key={c.id} className="carrito-fila">
                <div>
                  <b>{c.cantidad}×</b> {c.nombre}
                </div>
                <div className="carrito-fila-derecha">
                  <span>{fmt(c.precio * c.cantidad)}</span>
                  <button type="button" className="carrito-quitar" onClick={() => onQuitar(c.id)}>✕</button>
                </div>
              </div>
            ))}
          </div>
          <div className="carrito-total">
            <span>Total</span>
            <span>{fmt(total)}</span>
          </div>
          {error && <div className="catalogo-error">⚠️ {error}</div>}
          <button type="button" className="tbtn vende producto-btn" style={{ width: '100%' }} onClick={confirmar} disabled={confirmando}>
            {confirmando ? 'Confirmando…' : 'Confirmar pedido — pagar con SINPE Móvil'}
          </button>
        </>
      )}
    </section>
  )
}
