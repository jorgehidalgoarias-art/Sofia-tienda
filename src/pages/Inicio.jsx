import { useOutletContext } from 'react-router-dom'
import Identificacion from '../components/Identificacion'
import Bienvenida from '../components/Bienvenida'
import Catalogo from '../components/Catalogo'

// ────────────────────────────────────────────────────────────────────────
// La puerta de entrada de la tienda: el local y su carta, nada más. Acá
// el cliente decide qué le gusta; recién si agrega algo pasa a "Tu
// pedido" (otra página) para confirmar la compra.
// ────────────────────────────────────────────────────────────────────────
export default function Inicio() {
  const { cliente, setCliente, carrito, agregarAlCarrito } = useOutletContext()

  return (
    <>
      <div className="identificacion-zona">
        <Identificacion cliente={cliente} onCambiar={setCliente} />
        <Bienvenida cliente={cliente} />
      </div>

      <Catalogo carrito={carrito} onAgregar={agregarAlCarrito} />
    </>
  )
}
