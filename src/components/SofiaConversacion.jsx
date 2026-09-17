import { useState, useRef, useEffect } from 'react'
import { RetellClient } from 'retell-client-js-sdk'
import { chatVendedora } from '../api'
import SofiaAvatarFoto from './SofiaAvatarFoto'

const RETELL_PUBLIC_KEY = import.meta.env.VITE_RETELL_PUBLIC_KEY
const RETELL_AGENT_ID = import.meta.env.VITE_RETELL_AGENT_ID
const CLAVE_STORAGE = 'sofia_chat_historial_v1'

function cargarHistorial() {
  try {
    const guardado = localStorage.getItem(CLAVE_STORAGE)
    return guardado ? JSON.parse(guardado) : []
  } catch {
    return []
  }
}

function formatearHora(iso) {
  try {
    return new Date(iso).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

// El agente de Retell no tiene noción de qué hora es salvo que se la
// demos: sin esto, asume "buenos días" por defecto sin importar cuándo
// llames. Se la pasamos como "dynamic variable" (ver el Global Prompt
// de Retell, {{saludo}}) usando SIEMPRE la hora de Costa Rica.
function saludoSegunHoraCR_() {
  const hora = Number(
    new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: 'America/Costa_Rica' }).format(new Date())
  )
  if (hora >= 5 && hora < 12) return 'Buenos días'
  if (hora >= 12 && hora < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

// ────────────────────────────────────────────────────────────────────────
// Una sola tarjeta, un solo avatar de SofIA — el cliente elige si quiere
// escribirle o hablarle, pero es la misma "cara" en los dos casos.
//
// Importante: acá SofIA es la VENDEDORA del café — usa chatVendedora
// (no chatConSofia), que en el backend no tiene NINGUNA herramienta
// conectada a stock/ventas/caja: solo puede charlar de café en general
// y de Costa Rica. La voz usa el mismo agente de Retell que el tablero
// interno (no hay forma de tener dos prompts distintos sin crear un
// segundo agente en Retell — si hace falta esa misma restricción por
// voz, es una charla aparte).
// ────────────────────────────────────────────────────────────────────────
export default function SofiaConversacion() {
  const [modo, setModo] = useState('texto') // 'texto' | 'voz'

  // ── texto ──
  const [historial, setHistorial] = useState(cargarHistorial)
  const [texto, setTexto] = useState('')
  const [cargando, setCargando] = useState(false)
  const [errorTexto, setErrorTexto] = useState(null)
  const [enfocado, setEnfocado] = useState(false)
  const [animando, setAnimando] = useState(null) // { index, texto, visible }
  const historialRef = useRef(null)

  // ── voz ──
  const [estadoLlamada, setEstadoLlamada] = useState('idle') // idle | connecting | live
  const [hablandoSofia, setHablandoSofia] = useState(false)
  const [errorVoz, setErrorVoz] = useState(null)
  const clientRef = useRef(null)
  const callRef = useRef(null)

  useEffect(() => {
    const el = historialRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [historial, cargando, animando])

  useEffect(() => {
    try { localStorage.setItem(CLAVE_STORAGE, JSON.stringify(historial)) } catch { /* no crítico */ }
  }, [historial])

  useEffect(() => {
    if (!animando) return
    if (animando.visible >= animando.texto.length) {
      const fin = setTimeout(() => setAnimando(null), 200)
      return () => clearTimeout(fin)
    }
    const paso = Math.max(1, Math.ceil(animando.texto.length / 60))
    const id = setTimeout(() => {
      setAnimando((a) => a && { ...a, visible: Math.min(a.texto.length, a.visible + paso) })
    }, 22)
    return () => clearTimeout(id)
  }, [animando])

  useEffect(() => {
    // cortar la llamada si el componente se desmonta con una activa
    return () => { callRef.current?.end().catch(() => {}) }
  }, [])

  async function enviarTexto(e) {
    e.preventDefault()
    const mensaje = texto.trim()
    if (!mensaje || cargando) return

    const nuevoHistorial = [...historial, { rol: 'user', texto: mensaje, hora: new Date().toISOString() }]
    setHistorial(nuevoHistorial)
    setTexto('')
    setErrorTexto(null)
    setCargando(true)
    try {
      const respuesta = await chatVendedora(nuevoHistorial.map(({ rol, texto }) => ({ rol, texto })))
      const historialConRespuesta = [...nuevoHistorial, { rol: 'model', texto: respuesta, hora: new Date().toISOString() }]
      setHistorial(historialConRespuesta)
      setAnimando({ index: historialConRespuesta.length - 1, texto: respuesta, visible: 0 })
    } catch (err) {
      setErrorTexto(err.message)
    } finally {
      setCargando(false)
    }
  }

  function nuevaCharla() {
    if (historial.length > 0 && !confirm('¿Borrar esta conversación y empezar una nueva?')) return
    setHistorial([])
    setErrorTexto(null)
    setAnimando(null)
    try { localStorage.removeItem(CLAVE_STORAGE) } catch { /* no crítico */ }
  }

  function getClient() {
    if (!clientRef.current) clientRef.current = new RetellClient({ key: RETELL_PUBLIC_KEY })
    return clientRef.current
  }

  function iniciarLlamada() {
    if (!RETELL_PUBLIC_KEY || !RETELL_AGENT_ID) {
      setErrorVoz('Falta VITE_RETELL_PUBLIC_KEY o VITE_RETELL_AGENT_ID en tu .env')
      return
    }
    setErrorVoz(null)
    setEstadoLlamada('connecting')
    const call = getClient().createWebCall({
      agent_id: RETELL_AGENT_ID,
      retell_llm_dynamic_variables: { saludo: saludoSegunHoraCR_() },
      hooks: {
        onStatus: (status) => {
          if (status === 'live') setEstadoLlamada('live')
          if (status === 'ended') { setEstadoLlamada('idle'); setHablandoSofia(false) }
        },
        onAgentStartTalking: () => setHablandoSofia(true),
        onAgentStopTalking: () => setHablandoSofia(false),
        onError: (err) => { setErrorVoz(err.message || 'No se pudo conectar la llamada.'); setEstadoLlamada('idle') }
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

  function cambiarModo(nuevoModo) {
    if (modo === 'voz' && nuevoModo === 'texto' && estadoLlamada !== 'idle') colgar()
    setModo(nuevoModo)
  }

  const enLlamada = estadoLlamada === 'live' || estadoLlamada === 'connecting'
  const estadoCara = modo === 'voz'
    ? (estadoLlamada === 'connecting' ? 'thinking' : hablandoSofia ? 'speaking' : enLlamada ? 'listening' : 'idle')
    : (cargando ? 'thinking' : animando ? 'speaking' : enfocado ? 'listening' : 'idle')

  const etiquetaEstado = modo === 'voz'
    ? ({ connecting: 'Conectando…', live: hablandoSofia ? 'Hablando…' : 'Escuchándote…' }[estadoLlamada] || 'Llamá a SofIA')
    : ({ listening: 'Escuchando…', thinking: 'Pensando…', speaking: 'Respondiendo…', idle: 'SofIA' }[estadoCara])

  return (
    <div className="card sofia-conversacion">
      <div className="chat-header">
        <h3>SofIA</h3>
        {modo === 'texto' && historial.length > 0 && (
          <button type="button" className="chat-nueva" onClick={nuevaCharla} title="Nueva conversación">
            🗑️ Nueva charla
          </button>
        )}
      </div>

      <div className="chat-avatar-zona">
        <SofiaAvatarFoto estado={estadoCara} size={130} />
        <div className={`chat-avatar-estado chat-avatar-estado-${estadoCara}`}>{etiquetaEstado}</div>
      </div>

      <div className="sofia-modos">
        <button type="button" className={'sofia-modo' + (modo === 'texto' ? ' sofia-modo-activo' : '')} onClick={() => cambiarModo('texto')}>
          ✍️ Escribir
        </button>
        <button type="button" className={'sofia-modo' + (modo === 'voz' ? ' sofia-modo-activo' : '')} onClick={() => cambiarModo('voz')}>
          🎙️ Hablar
        </button>
      </div>

      {modo === 'texto' ? (
        <>
          <div className="chat-historial" ref={historialRef}>
            {historial.length === 0 && !cargando && (
              <div className="vacio">Preguntale algo de café o de Costa Rica…</div>
            )}
            {historial.map((m, i) => {
              const esLaQueAnima = animando && animando.index === i
              const txt = esLaQueAnima ? m.texto.slice(0, animando.visible) : m.texto
              return (
                <div key={i} className={`chat-burbuja ${m.rol === 'user' ? 'chat-user' : 'chat-sofia'}`}>
                  <div className="chat-texto">
                    {txt}
                    {esLaQueAnima && animando.visible < animando.texto.length && <span className="chat-cursor" />}
                  </div>
                  {m.hora && <div className="chat-hora">{formatearHora(m.hora)}</div>}
                </div>
              )
            })}
            {cargando && (
              <div className="chat-burbuja chat-sofia chat-pensando">
                SofIA está pensando
                <span className="chat-puntos"><span></span><span></span><span></span></span>
              </div>
            )}
          </div>
          {errorTexto && <div className="tools-note">⚠️ {errorTexto}</div>}
          <form className="chat-form" onSubmit={enviarTexto}>
            <input
              type="text"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onFocus={() => setEnfocado(true)}
              onBlur={() => setEnfocado(false)}
              placeholder="Escribile a SofIA…"
              disabled={cargando}
            />
            <button type="submit" className="tbtn vende" disabled={cargando || !texto.trim()}>Enviar</button>
          </form>
        </>
      ) : (
        <>
          {errorVoz && <div className="tools-note">⚠️ {errorVoz}</div>}
          <div className="voz-acciones">
            {enLlamada ? (
              <button type="button" className="tbtn voz-colgar" onClick={colgar}>📴 Colgar</button>
            ) : (
              <button type="button" className="tbtn voz-llamar" onClick={iniciarLlamada}>🎙️ Hablar con SofIA</button>
            )}
          </div>
          <div className="voz-nota">Requiere permiso de micrófono.</div>
        </>
      )}
    </div>
  )
}
