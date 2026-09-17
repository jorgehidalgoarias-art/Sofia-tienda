import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import Header from './components/Header'
import NavBar from './components/NavBar'
import { cargarCliente } from './components/Identificacion'
import { cargarCarrito, guardarCarrito } from './carrito'
import Inicio from './pages/Inicio'
import Pedido from './pages/Pedido'
import Sofia from './pages/Sofia'
import Desafios from './components/Desafios'

// ────────────────────────────────────────────────────────────────────────
// Prototipo local de la TIENDA de SofIA — separado a propósito del
// tablero interno (sofia-clase2-react). Ahora con páginas de verdad:
// Inicio (el local + la carta) es la puerta de entrada; decidir comprar
// lleva a "Tu pedido", una página aparte, para que mirar el menú no se
// sienta como estar comprando. Chat/voz y desafíos también tienen su
// propia página, así el inicio queda simple.
//
// El estado del cliente y del carrito vive acá arriba (persistido en
// localStorage) y se pasa a cada página vía el context de la ruta
// (useOutletContext) — así sobrevive la navegación entre páginas.
// ────────────────────────────────────────────────────────────────────────
function Layout() {
  const [cliente, setCliente] = useState(cargarCliente)
  const [carrito, setCarrito] = useState(cargarCarrito)

  useEffect(() => {
    guardarCarrito(carrito)
  }, [carrito])

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

  const cantidadCarrito = carrito.reduce((s, c) => s + c.cantidad, 0)

  return (
    <>
      <Header />
      <NavBar cantidadCarrito={cantidadCarrito} />
      <main className="tienda-main">
        <Outlet context={{ cliente, setCliente, carrito, agregarAlCarrito, quitarDelCarrito, vaciarCarrito: () => setCarrito([]) }} />
      </main>
      <footer className="tienda-footer">
        Prototipo local · Café SofIA — ADEN Business School
      </footer>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Inicio />} />
          <Route path="/pedido" element={<Pedido />} />
          <Route path="/sofia" element={<Sofia />} />
          <Route path="/desafios" element={<Desafios />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
