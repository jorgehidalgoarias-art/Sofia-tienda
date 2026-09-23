import { llamarAppsScript } from './_lib/appsScript.js'

// ────────────────────────────────────────────────────────────────────────
// POST /api/confirmar-pedido   { items: [{ id_item, cantidad }, ...], cliente? }
//
// Único punto donde el navegador dice "esta compra está confirmada".
// Esta función es la que de verdad habla con Apps Script (action
// confirmarPedidoEcommerce): valida el body acá, ese endpoint valida
// stock del lado del backend y, si alcanza, descuenta stock por receta,
// suma la caja y registra la venta — todo en un solo paso, sin dejar el
// pedido "pendiente" (ver confirmarPedidoEcommerce en apps-script/Code.js
// para la decisión de negocio detrás de eso).
// ────────────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Método no permitido.' })
    return
  }

  const { items, cliente } = req.body || {}
  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ ok: false, error: 'El pedido no tiene ítems.' })
    return
  }
  const itemsLimpios = items.map((it) => ({ id_item: it.id_item, cantidad: Number(it.cantidad) }))
  if (itemsLimpios.some((it) => !it.id_item || !(it.cantidad > 0))) {
    res.status(400).json({ ok: false, error: 'Cada ítem necesita id_item y una cantidad mayor que cero.' })
    return
  }

  try {
    const resultado = await llamarAppsScript('confirmarPedidoEcommerce', {
      items: itemsLimpios,
      cliente: cliente && typeof cliente === 'object' ? cliente : undefined,
      metodo: 'sinpe_transferencia'
    })
    res.status(200).json(resultado)
  } catch (e) {
    res.status(502).json({ ok: false, error: e.message })
  }
}
