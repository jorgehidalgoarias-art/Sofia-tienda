// ────────────────────────────────────────────────────────────────────────
// Cliente server-to-server hacia Apps Script, para acciones que mueven
// stock y caja (por ahora, confirmar un pedido del e-commerce).
//
// Corre SOLO en funciones serverless de Vercel (api/**), nunca en el
// navegador — mismo patrón que api/_lib/appsScriptAdmin.js en
// sofia-clase2-react. La URL del backend (VITE_APPS_SCRIPT_URL) no es
// secreta y hoy también vive en el bundle del cliente (src/api.js la usa
// para las lecturas de catálogo/stock), pero el TOKEN de esta llamada
// (APPS_SCRIPT_TOKEN, SIN prefijo VITE_) es server-only a propósito: no
// llega al navegador, así que ya no se puede leer desde las DevTools.
//
// Nota de seguridad real: este token es el MISMO valor que ya vivía en
// VITE_APPS_SCRIPT_TOKEN (expuesto en el bundle hasta ahora). Mover la
// llamada acá evita que se siga filtrando de acá en adelante, pero NO
// invalida el valor que ya quedó público en builds anteriores — para
// cerrar eso del todo hay que rotar la Script Property APPS_SCRIPT_TOKEN
// en Apps Script y actualizarla en ambos proyectos (sofia-clase2-react
// también la usa). Ver la nota que le dejé a Jorge sobre esto.
// ────────────────────────────────────────────────────────────────────────

const BASE_URL = process.env.VITE_APPS_SCRIPT_URL // no es secreta, se reutiliza
const TOKEN = process.env.APPS_SCRIPT_TOKEN

export async function llamarAppsScript(action, body = {}) {
  if (!BASE_URL) {
    throw new Error('Falta VITE_APPS_SCRIPT_URL en las variables de entorno del servidor (Vercel).')
  }
  if (!TOKEN) {
    throw new Error('Falta APPS_SCRIPT_TOKEN en las variables de entorno del servidor (Vercel).')
  }

  const url = new URL(BASE_URL)
  url.searchParams.set('action', action)

  const res = await fetch(url.toString(), {
    method: 'POST',
    // text/plain evita el preflight OPTIONS, que Apps Script no responde bien.
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ ...body, token: TOKEN })
  })

  if (!res.ok) {
    throw new Error('Error de red hacia Apps Script: ' + res.status)
  }

  const data = await res.json()
  if (data && data.status === 401) {
    throw new Error('Apps Script rechazó el token (revisá APPS_SCRIPT_TOKEN en Vercel).')
  }
  return data
}
