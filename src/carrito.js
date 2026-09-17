// Persistencia simple del carrito en este navegador — para que sea una
// experiencia real, no se debería perder el pedido si el cliente
// recarga la página o vuelve a entrar más tarde (igual que el cliente
// identificado, ver Identificacion.jsx).
const CLAVE_STORAGE = 'sofia_carrito_v1'

export function cargarCarrito() {
  try {
    const guardado = localStorage.getItem(CLAVE_STORAGE)
    return guardado ? JSON.parse(guardado) : []
  } catch {
    return []
  }
}

export function guardarCarrito(carrito) {
  try {
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify(carrito))
  } catch {
    // localStorage puede fallar (modo privado, cuota llena) — no es crítico
  }
}
