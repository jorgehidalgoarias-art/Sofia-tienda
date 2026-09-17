import { useEffect, useState } from 'react'
import { obtenerCatalogo } from '../api'

function fmt(n) {
  return '₡' + Number(n || 0).toLocaleString('es-CR')
}

// ────────────────────────────────────────────────────────────────────────
// El catálogo real de SofIA: nombre, precio y disponibilidad — calculada
// mirando la receta de cada café contra el stock real de insumos (un
// café no tiene stock propio, se calcula solo). El selector de cantidad
// nunca deja pedir más de lo que hoy se puede armar (maxDisponible menos
// lo que ya está en el carrito) — el chequeo real y definitivo lo hace
// igual el backend al confirmar el pedido, esto es para que el cliente
// no se lleve una sorpresa recién ahí.
//
// Sin fotos todavía: la hoja "presentación" existe en el backend pero no
// tiene datos cargados ni una herramienta que la exponga — cuando eso
// esté, este componente es el lugar donde se agregan.
// ────────────────────────────────────────────────────────────────────────
export default function Catalogo({ carrito, onAgregar }) {
  const [items, setItems] = useState(null)
  const [error, setError] = useState(null)
  const [cantidades, setCantidades] = useState({})

  async function cargar() {
    try {
      const catalogo = await obtenerCatalogo()
      setItems(catalogo)
      setError(null)
    } catch (e) {
      setError(e.message)
    }
  }

  useEffect(() => {
    cargar()
    const id = setInterval(cargar, 15000) // la disponibilidad puede cambiar; refresco tranquilo
    return () => clearInterval(id)
  }, [])

  function enCarrito(id) {
    return carrito.find((c) => c.id === id)?.cantidad || 0
  }

  function restante(item) {
    if (item.maxDisponible === Infinity) return Infinity
    return Math.max(0, item.maxDisponible - enCarrito(item.id))
  }

  function cambiarCantidad(id, delta, max) {
    setCantidades((c) => {
      const actual = c[id] ?? 1
      const nueva = Math.min(Math.max(1, actual + delta), Math.max(1, max))
      return { ...c, [id]: nueva }
    })
  }

  return (
    <section className="catalogo">
      <div className="catalogo-header">
        <h2>Nuestra carta</h2>
        <span className="catalogo-sub">Precios y disponibilidad en tiempo real</span>
      </div>

      {error && <div className="catalogo-error">⚠️ {error}</div>}

      {!items && !error && <div className="catalogo-cargando">Cargando la carta…</div>}

      <div className="catalogo-grid">
        {items?.map((item) => {
          const disp = restante(item)
          const agotado = disp <= 0
          const cantidad = Math.min(cantidades[item.id] ?? 1, Math.max(1, disp))

          return (
            <article key={item.id} className={`producto-card ${agotado ? 'producto-agotado' : ''}`}>
              <div className="producto-icono">☕</div>
              <h3>{item.nombre}</h3>
              <div className="producto-precio">{fmt(item.precio)}</div>
              <span className={`producto-badge ${agotado ? 'badge-agotado' : 'badge-ok'}`}>
                {agotado ? 'Agotado' : 'Disponible'}
              </span>

              {!agotado && (
                <div className="producto-agregar">
                  <div className="producto-stepper">
                    <button type="button" onClick={() => cambiarCantidad(item.id, -1, disp)}>−</button>
                    <span>{cantidad}</span>
                    <button type="button" onClick={() => cambiarCantidad(item.id, 1, disp)} disabled={cantidad >= disp}>+</button>
                  </div>
                  <button
                    type="button"
                    className="tbtn vende producto-btn"
                    onClick={() => onAgregar(item, cantidad)}
                  >
                    Agregar
                  </button>
                </div>
              )}

              {enCarrito(item.id) > 0 && (
                <div className="producto-en-carrito">{enCarrito(item.id)} en tu pedido</div>
              )}
            </article>
          )
        })}
      </div>

      {items && items.length === 0 && (
        <div className="catalogo-cargando">Todavía no hay productos activos en la carta.</div>
      )}
    </section>
  )
}
