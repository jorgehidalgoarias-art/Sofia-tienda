import { useState, useRef, useEffect } from 'react'
import { chatConSofia } from '../api'
import SofiaAvatarFoto from './SofiaAvatarFoto'

// Guardamos el historial acá para que sobreviva a un F5. No es sensible
// (son las mismas preguntas que ya viajan al backend en cada turno), así
// que localStorage alcanza — no hace falta persistirlo en el servidor.
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

export default function ChatSofia() {
  const [historial, setHistorial] = useState(cargarHistorial)
  const [texto, setTexto] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)
  const [enfocado, setEnfocado] = useState(false)
  // Efecto "máquina de escribir" para la última respuesta de SofIA: no es
  // streaming real (la API devuelve el texto entero de una), lo simulamos
  // acá para que la cara tenga algo que "hablar" mientras se revela.
  const [animando, setAnimando] = useState(null) // { index, texto, visible }
  const historialRef = useRef(null)

  useEffect(() => {
    // Antes usábamos finRef.scrollIntoView(), pero eso hace scroll de TODA
    // la página (busca centrar el elemento en la ventana), no solo del
    // cuadrito del historial — el efecto era que la tarjeta entera se corría
    // hacia arriba y tapaba la respuesta recién llegada. Moviendo el scrollTop
    // del propio contenedor, el scroll queda contenido ahí adentro y la
    // página no se mueve.
    const el = historialRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [historial, cargando, animando])

  useEffect(() => {
    try {
      localStorage.setItem(CLAVE_STORAGE, JSON.stringify(historial))
    } catch {
      // localStorage puede fallar (modo privado, cuota llena, etc.) — no es
      // crítico para el chat, así que lo ignoramos en silencio.
    }
  }, [historial])

  useEffect(() => {
    if (!animando) return
    if (animando.visible >= animando.texto.length) {
      const fin = setTimeout(() => setAnimando(null), 200)
      return () => clearTimeout(fin)
    }
    // ritmo parejo sin importar el largo: ~60 pasos totales por respuesta
    const paso = Math.max(1, Math.ceil(animando.texto.length / 60))
    const id = setTimeout(() => {
      setAnimando((a) => a && { ...a, visible: Math.min(a.texto.length, a.visible + paso) })
    }, 22)
    return () => clearTimeout(id)
  }, [animando])

  async function enviar(e) {
    e.preventDefault()
    const mensaje = texto.trim()
    if (!mensaje || cargando) return

    const nuevoHistorial = [...historial, { rol: 'user', texto: mensaje, hora: new Date().toISOString() }]
    setHistorial(nuevoHistorial)
    setTexto('')
    setError(null)
    setCargando(true)
    try {
      // Al backend le mandamos solo { rol, texto } por turno — la hora es
      // un dato de UI local, no parte del contrato que espera Apps Script.
      const respuesta = await chatConSofia(nuevoHistorial.map(({ rol, texto }) => ({ rol, texto })))
      const historialConRespuesta = [...nuevoHistorial, { rol: 'model', texto: respuesta, hora: new Date().toISOString() }]
      setHistorial(historialConRespuesta)
      setAnimando({ index: historialConRespuesta.length - 1, texto: respuesta, visible: 0 })
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  function nuevaCharla() {
    if (historial.length > 0 && !confirm('¿Borrar esta conversación y empezar una nueva?')) return
    setHistorial([])
    setError(null)
    setAnimando(null)
    try {
      localStorage.removeItem(CLAVE_STORAGE)
    } catch {
      // ver nota arriba
    }
  }

  const estadoCara = cargando ? 'thinking' : animando ? 'speaking' : enfocado ? 'listening' : 'idle'
  const etiquetaEstado = {
    listening: 'Escuchando…',
    thinking: 'Pensando…',
    speaking: 'Respondiendo…',
    idle: 'SofIA'
  }[estadoCara]

  return (
    <div className="card col-6">
      <div className="chat-header">
        <h3>Hablá con SofIA</h3>
        {historial.length > 0 && (
          <button type="button" className="chat-nueva" onClick={nuevaCharla} title="Nueva conversación">
            🗑️ Nueva charla
          </button>
        )}
      </div>
      <div className="chat-avatar-zona">
        <SofiaAvatarFoto estado={estadoCara} size={120} />
        <div className={`chat-avatar-estado chat-avatar-estado-${estadoCara}`}>{etiquetaEstado}</div>
      </div>
      <div className="chat-historial" ref={historialRef}>
        {historial.length === 0 && !cargando && (
          <div className="vacio">Preguntale algo: "¿cuánto café queda?", "¿cuál es el más vendido?"…</div>
        )}
        {historial.map((m, i) => {
          const esLaQueAnima = animando && animando.index === i
          const texto = esLaQueAnima ? m.texto.slice(0, animando.visible) : m.texto
          return (
            <div key={i} className={`chat-burbuja ${m.rol === 'user' ? 'chat-user' : 'chat-sofia'}`}>
              <div className="chat-texto">
                {texto}
                {esLaQueAnima && animando.visible < animando.texto.length && <span className="chat-cursor" />}
              </div>
              {m.hora && <div className="chat-hora">{formatearHora(m.hora)}</div>}
            </div>
          )
        })}
        {cargando && (
          <div className="chat-burbuja chat-sofia chat-pensando">
            SofIA está pensando
            <span className="chat-puntos">
              <span></span><span></span><span></span>
            </span>
          </div>
        )}
      </div>
      {error && <div className="tools-note">⚠️ {error}</div>}
      <form className="chat-form" onSubmit={enviar}>
        <input
          type="text"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onFocus={() => setEnfocado(true)}
          onBlur={() => setEnfocado(false)}
          placeholder="Escribile a SofIA…"
          disabled={cargando}
        />
        <button type="submit" className="tbtn vende" disabled={cargando || !texto.trim()}>
          Enviar
        </button>
      </form>
    </div>
  )
}
