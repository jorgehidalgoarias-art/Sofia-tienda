// ────────────────────────────────────────────────────────────────────────
// Capa de comunicación con el backend real de SofIA (el mismo Apps
// Script que usa el tablero de sofia-clase2-react). Este prototipo es
// de SOLO LECTURA salvo por el chat: no toca stock, caja ni ventas —
// por eso no necesita nada del panel /admin ni de sus tokens.
// ────────────────────────────────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_APPS_SCRIPT_URL
const APPS_SCRIPT_TOKEN = import.meta.env.VITE_APPS_SCRIPT_TOKEN

function chequearUrl() {
  if (!BASE_URL) {
    throw new Error('Falta VITE_APPS_SCRIPT_URL en tu .env')
  }
}

function chequearToken() {
  if (!APPS_SCRIPT_TOKEN) {
    throw new Error('Falta VITE_APPS_SCRIPT_TOKEN en tu .env')
  }
}

async function llamar(params) {
  chequearUrl()
  const url = new URL(BASE_URL)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error('Error de red: ' + res.status)
  return res.json()
}

export function probarHerramienta(nombre, args = {}) {
  return llamar({ action: 'tool', nombre, args: JSON.stringify(args) })
}

export function consultarCarta() {
  return probarHerramienta('consultarCarta')
}

export function consultarStock() {
  return probarHerramienta('consultarStock')
}

export function consultarReceta(producto) {
  return probarHerramienta('consultarReceta', { producto })
}

/**
 * Arma el catálogo completo: cada café de la carta, con su precio, si
 * está disponible de verdad, y CUÁNTAS unidades se pueden armar hoy con
 * el stock real de insumos (la misma idea que "un café no tiene stock
 * propio, se calcula mirando la receta"). `maxDisponible` es lo que
 * limita el selector de cantidad en la tienda — así nunca se deja pedir
 * más de lo que hoy se puede preparar. Es una llamada extra por producto
 * (consultarReceta), aceptable para una carta chica; si crece mucho, esto
 * se resuelve mejor con una única herramienta nueva en el backend.
 */
export async function obtenerCatalogo() {
  const [carta, stock] = await Promise.all([consultarCarta(), consultarStock()])
  const stockPorNombre = {}
  stock.forEach((s) => { stockPorNombre[s.nombre] = Number(s.stock) })

  const catalogo = await Promise.all(
    carta.map(async (item) => {
      try {
        const receta = await consultarReceta(item.nombre)
        const componentes = receta.se_arma_con || []
        const maxDisponible = componentes.length > 0
          ? Math.min(...componentes.map((c) => Math.floor((stockPorNombre[c.insumo] ?? 0) / Number(c.cantidad))))
          : Infinity
        return { ...item, disponible: maxDisponible > 0, maxDisponible, se_arma_con: componentes }
      } catch {
        return { ...item, disponible: true, maxDisponible: Infinity, se_arma_con: [] }
      }
    })
  )
  return catalogo
}

/**
 * Confirma el pedido con el backend real — valida stock ahí mismo antes
 * de crear nada (por si cambió algo desde que se cargó el catálogo) y
 * devuelve el alias de SINPE Móvil y la referencia para transferir.
 * `items`: [{ id_item, cantidad }, ...]. `cliente` es opcional:
 * { nombre, email, telefono } — si viene, queda guardado junto al
 * pedido y se usa para el historial de compras.
 */
export function crearPedido(items, cliente) {
  return probarHerramienta('crearPedidoTransferencia', { items, cliente })
}

/**
 * Historial de compras de un cliente ya identificado — busca por
 * nombre, email o celular (lo que se le haya pasado como identificador,
 * que tiene que coincidir con lo que se guardó en algún pedido
 * confirmado anteriormente).
 */
export function consultarHistorialCliente(identificador) {
  return probarHerramienta('consultarHistorialCliente', { identificador })
}

// ────────────────────────────────────────────────────────────────────────
// El chat con SofIA — mismo contrato que el tablero: POST con
// Content-Type text/plain (evita el preflight de CORS) y el token
// adentro del body.
// ────────────────────────────────────────────────────────────────────────
export async function chatConSofia(historial) {
  chequearUrl()
  chequearToken()
  const url = new URL(BASE_URL)
  url.searchParams.set('action', 'chat')
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ historial, token: APPS_SCRIPT_TOKEN })
  })
  if (!res.ok) throw new Error('Error de red: ' + res.status)

  const data = await res.json()
  if (data && data.status === 401) {
    throw new Error('No autorizado: el token no coincide con el backend (' + data.error + ')')
  }
  if (!data.ok) throw new Error(data.error || 'SofIA no pudo responder.')
  return data.respuesta
}
