import { useEffect, useRef, useState } from 'react'
import { RetellClient } from 'retell-client-js-sdk'
import SofiaAvatarFoto from './SofiaAvatarFoto'

// ────────────────────────────────────────────────────────────────────────
// Llamada de voz con SofIA (Retell AI), directo desde el navegador.
//
// A diferencia del chat de texto (que pasa por tu Apps Script), esta
// llamada va: navegador → Retell AI → n8n → tu Google Sheet. Acá no hay
// backend propio de por medio: el SDK de Retell habla directo con sus
// servidores usando una "public key" — a propósito distinta de tu API
// key secreta, pensada para vivir en el navegador. Retell la valida
// contra los dominios que autorizaste para esa key (ver Retell →
// Settings → API Keys), así que aunque cualquiera pueda verla en el
// bundle, no sirve fuera de tu propio sitio.
//
// VITE_RETELL_PUBLIC_KEY y VITE_RETELL_AGENT_ID no son secretos (por
// eso llevan el prefijo VITE_, igual que VITE_APPS_SCRIPT_TOKEN).
// ────────────────────────────────────────────────────────────────────────

const RETELL_PUBLIC_KEY = import.meta.env.VITE_RETELL_PUBLIC_KEY
const RETELL_AGENT_ID = import.meta.env.VITE_RETELL_AGENT_ID

// El agente de Retell no tiene noción de qué hora es (ni real ni
// simulada) salvo que se la demos: sin esto, asume "buenos días" por
// defecto sin importar cuándo llames. Se la pasamos como "dynamic
// variable" al iniciar la llamada — en el Global Prompt de Retell se
// referencia como {{saludo}}. Usamos SIEMPRE la hora de Costa Rica
// (timeZone explícito), no la hora local del dispositivo de quien
// llama — el café está en Costa Rica, sin importar desde dónde se
// pruebe la llamada.
function saludoSegunHoraCR_() {
  const hora = Number(
    new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      hour12: false,
      timeZone: 'America/Costa_Rica'
    }).format(new Date())
  )
  if (hora >= 5 && hora < 12) return 'Buenos días'
  if (hora >= 12 && hora < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

export default function VozSofia() {
  const [estadoLlamada, setEstadoLlamada] = useState('idle') // idle | connecting | live | ended
  const [hablandoSofia, setHablandoSofia] = useState(false)
  const [error, setError] = useState(null)
  const clientRef = useRef(null)
  const callRef = useRef(null)

  useEffect(() => {
    // Cortar la llamada si el usuario navega fuera o recarga con la
    // llamada activa — no dejar el micrófono abierto de fondo.
    return () => {
      callRef.current?.end().catch(() => {})
    }
  }, [])

  function getClient() {
    if (!clientRef.current) {
      clientRef.current = new RetellClient({ key: RETELL_PUBLIC_KEY })
    }
    return clientRef.current
  }

  function iniciarLlamada() {
    if (!RETELL_PUBLIC_KEY || !RETELL_AGENT_ID) {
      setError(
        'Falta VITE_RETELL_PUBLIC_KEY o VITE_RETELL_AGENT_ID. Copiá .env.example a .env y completalos.'
      )
      return
    }
    setError(null)
    setEstadoLlamada('connecting')

    const call = getClient().createWebCall({
      agent_id: RETELL_AGENT_ID,
      retell_llm_dynamic_variables: { saludo: saludoSegunHoraCR_() },
      hooks: {
        onStatus: (status) => {
          // connecting → live → ended (ver session/events.ts del SDK)
          if (status === 'live') setEstadoLlamada('live')
          if (status === 'ended') {
            setEstadoLlamada('idle')
            setHablandoSofia(false)
          }
        },
        onAgentStartTalking: () => setHablandoSofia(true),
        onAgentStopTalking: () => setHablandoSofia(false),
        onError: (err) => {
          setError(err.message || 'No se pudo conectar la llamada.')
          setEstadoLlamada('idle')
        }
      }
    })
    callRef.current = call
  }

  async function colgar() {
    await callRef.current?.end().catch(() => {})
    callRef.current = null
    setEstadoLlamada('idle')
    setHablandoSofia(false)
  }

  const enLlamada = estadoLlamada === 'live' || estadoLlamada === 'connecting'
  const estadoCara = estadoLlamada === 'connecting' ? 'thinking' : hablandoSofia ? 'speaking' : enLlamada ? 'listening' : 'idle'
  const etiquetaEstado = {
    connecting: 'Conectando…',
    live: hablandoSofia ? 'Hablando…' : 'Escuchándote…'
  }[estadoLlamada] || 'Llamá a SofIA'

  return (
    <div className="card col-6">
      <div className="chat-header">
        <h3>🎙️ Llamá a SofIA</h3>
      </div>
      <div className="chat-avatar-zona">
        <SofiaAvatarFoto estado={estadoCara} size={120} />
        <div className={`chat-avatar-estado chat-avatar-estado-${estadoCara}`}>{etiquetaEstado}</div>
      </div>
      {error && <div className="tools-note">⚠️ {error}</div>}
      <div className="voz-acciones">
        {enLlamada ? (
          <button type="button" className="tbtn voz-colgar" onClick={colgar}>
            📴 Colgar
          </button>
        ) : (
          <button type="button" className="tbtn voz-llamar" onClick={iniciarLlamada}>
            🎙️ Hablar con SofIA
          </button>
        )}
      </div>
      <div className="voz-nota">Requiere permiso de micrófono. La conversación es la misma SofIA que atiende por voz en el café.</div>
    </div>
  )
}
