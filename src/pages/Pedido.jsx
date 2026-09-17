import { useOutletContext } from 'react-router-dom'
import { Link } from 'react-router-dom'
import Carrito from '../components/Carrito'

// ────────────────────────────────────────────────────────────────────────
// La decisión de compra vive en su propia página — separada de la carta
// a propósito, para que mirar el menú no se sienta como "ya estoy
// comprando".
// ────────────────────────────────────────────────────────────────────────
export default function Pedido() {
  const { cliente, carrito, quitarDelCarrito, vaciarCarrito } = useOutletContext()

  return (
    <>
      <div className="pagina-header">
        <h2>Tu pedido</h2>
        <span className="catalogo-sub">Revisá lo que elegiste y confirmá para pagar con SINPE Móvil</span>
      </div>

      <div className="pedido-contenido">
        <Carrito carrito={carrito} cliente={cliente} onQuitar={quitarDelCarrito} onVaciar={vaciarCarrito} />
        {carrito.length === 0 && (
          <Link to="/" className="tbtn vende">← Ver la carta</Link>
        )}
      </div>
    </>
  )
}
