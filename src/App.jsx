import { useState } from 'react'
import Header from './components/Header'
import Identificacion, { cargarCliente } from './components/Identificacion'
import Bienvenida from './components/Bienvenida'
import Catalogo from './components/Catalogo'
import Carrito from './components/Carrito'
import ChatSofia from './components/ChatSofia'
import VozSofia from './components/VozSofia'
import Desafios from './components/Desafios'

// ────────────────────────────────────────────────────────────────────────
// Prototipo local de la TIENDA de SofIA — separado a propósito del
// tablero interno (sofia-clase2-react). Acá solo vive lo que un cliente
// real debería ver: la carta con disponibilidad real, el pedido, el chat
// y la voz de SofIA como vendedora, y los desafíos. Nada de caja, ventas
// históricas, bitácora ni mensajes internos del equipo.
// ────────────────────────────────────────────────────────────────────────
export default function App() {
  const [cliente, setCliente] = useState(cargarCliente) // { nombre, email, telefono } | null
  const [carrito, setCarrito] = useState([]) // [{ id, nombre, precio, cantidad }]

  function agregarAlCarrito(item, cantidad) {
    setCarrito((actual) => {
      const existe = actual.find((c) => c.id === item.id)
      if (existe) {
        return actual.map((c) => (c.id === item.id ? { ...c, cantidad: c.cantidad + cantidad } : c))
      }
      return [...actual, { id: item.id, nombre: item.nombre, precio: item.precio, cantidad }]
    })
  }

  function quitarDelCarrito(id) {
    setCarrito((actual) => actual.filter((c) => c.id !== id))
  }

  return (
    <>
      <Header />
      <main className="tienda-main">
        <div className="identificacion-zona">
          <Identificacion cliente={cliente} onCambiar={setCliente} />
          <Bienvenida cliente={cliente} />
        </div>

        <div className="catalogo-y-carrito">
          <Catalogo carrito={carrito} onAgregar={agregarAlCarrito} />
          <Carrito carrito={carrito} cliente={cliente} onQuitar={quitarDelCarrito} onVaciar={() => setCarrito([])} />
        </div>

        <section className="asistente">
          <div className="asistente-header">
            <h2>Hablá con SofIA</h2>
            <span className="catalogo-sub">Preguntale por la carta, pedile una recomendación, o charlemos de café</span>
          </div>
          <div className="asistente-grid">
            <ChatSofia />
            <VozSofia />
          </div>
        </section>

        <Desafios />
      </main>
      <footer className="tienda-footer">
        Prototipo local · Café SofIA — ADEN Business School
      </footer>
    </>
  )
}
