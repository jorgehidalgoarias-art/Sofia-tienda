import { useState } from 'react'

// ────────────────────────────────────────────────────────────────────────
// "Desafíos" — una mini-trivia de café + IA para entretener al cliente
// mientras espera o charla con SofIA. Autocontenida, sin llamadas al
// backend: las preguntas viven acá. Si más adelante se quiere que
// SofIA misma las genere o las varíe, este es el lugar para conectarlo.
// ────────────────────────────────────────────────────────────────────────
const PREGUNTAS = [
  {
    tema: 'Café',
    pregunta: '¿En qué país se originó el cultivo del café, según la leyenda de Kaldi?',
    opciones: ['Brasil', 'Etiopía', 'Colombia', 'Costa Rica'],
    correcta: 1,
    explicacion: 'La leyenda de Kaldi, el pastor de cabras, ubica el descubrimiento del café en Etiopía.'
  },
  {
    tema: 'Café',
    pregunta: '¿Qué método de preparación usa presión para extraer el café rápidamente?',
    opciones: ['Espresso', 'Prensa francesa', 'Chemex', 'Cold brew'],
    correcta: 0,
    explicacion: 'El espresso se prepara forzando agua caliente a presión a través del café molido.'
  },
  {
    tema: 'Café',
    pregunta: '¿Cuál de estos NO es un método de preparación de café?',
    opciones: ['V60', 'Aeropress', 'Sifón', 'Decantador'],
    correcta: 3,
    explicacion: 'El decantador se usa para vino, no para café.'
  },
  {
    tema: 'Café',
    pregunta: 'Costa Rica prohíbe por ley el cultivo de una variedad de café. ¿Cuál?',
    opciones: ['Arábica', 'Robusta', 'Bourbon', 'Typica'],
    correcta: 1,
    explicacion: 'Desde 1989, Costa Rica solo permite cultivar café Arábica por su mayor calidad.'
  },
  {
    tema: 'IA',
    pregunta: '¿Qué pregunta planteó Alan Turing en 1950, la que inspiró el "test de Turing"?',
    opciones: [
      '¿Pueden pensar las máquinas?',
      '¿Puede una máquina hacer café?',
      '¿Puede una IA tener emociones?',
      '¿Puede una máquina aprender sola?'
    ],
    correcta: 0,
    explicacion: 'Turing la planteó en su paper "Computing Machinery and Intelligence".'
  },
  {
    tema: 'IA',
    pregunta: '¿Qué es un "agente de IA", a diferencia de un simple chatbot?',
    opciones: [
      'Un chatbot con más memoria',
      'Uno que puede usar herramientas y tomar acciones, no solo responder',
      'Una IA que solo funciona por voz',
      'Un chatbot que nunca se equivoca'
    ],
    correcta: 1,
    explicacion: 'Un agente decide qué herramientas usar (consultar datos, ejecutar acciones) para cumplir un objetivo — como hace SofIA con el stock y la caja.'
  },
  {
    tema: 'IA',
    pregunta: 'En este café, SofIA nunca hace algo con dinero o stock sin que un humano confirme antes. ¿Por qué?',
    opciones: [
      'Porque todavía no es lo bastante inteligente',
      'Porque a un modelo se le puede pedir algo, pero solo el código lo puede obligar',
      'Por una limitación técnica de Google Sheets',
      'Porque así lo pide la ley'
    ],
    correcta: 1,
    explicacion: 'Es la idea central del "modo real": las instrucciones se le piden al modelo, pero las reglas que no pueden romperse (como no gastar más de lo que hay en caja) están en el código.'
  },
  {
    tema: 'IA',
    pregunta: '¿Qué significa que el "cerebro" de SofIA es intercambiable?',
    opciones: [
      'Que puede olvidar cosas',
      'Que el modelo de lenguaje que usa es un enchufe: se puede cambiar sin rehacer el resto del sistema',
      'Que tiene varias personalidades',
      'Que aprende de cada conversación'
    ],
    correcta: 1,
    explicacion: 'Hoy SofIA usa un modelo de OpenAI, pero el resto del café no se entera de cuál "cerebro" está enchufado.'
  }
]

export default function Desafios() {
  const [indice, setIndice] = useState(0)
  const [elegida, setElegida] = useState(null)
  const [puntaje, setPuntaje] = useState(0)
  const [terminado, setTerminado] = useState(false)

  const actual = PREGUNTAS[indice]
  const esUltima = indice === PREGUNTAS.length - 1

  function elegir(i) {
    if (elegida !== null) return
    setElegida(i)
    if (i === actual.correcta) setPuntaje((p) => p + 1)
  }

  function siguiente() {
    if (esUltima) {
      setTerminado(true)
      return
    }
    setIndice((i) => i + 1)
    setElegida(null)
  }

  function reiniciar() {
    setIndice(0)
    setElegida(null)
    setPuntaje(0)
    setTerminado(false)
  }

  return (
    <section className="desafios">
      <div className="desafios-header">
        <h2>Desafíos de café e IA</h2>
        <span className="catalogo-sub">Mientras esperás tu pedido, ponete a prueba</span>
      </div>

      <div className="desafios-card">
        {terminado ? (
          <div className="desafios-final">
            <div className="desafios-puntaje-grande">{puntaje} / {PREGUNTAS.length}</div>
            <p>
              {puntaje === PREGUNTAS.length
                ? '¡Perfecto! Sabés tanto de café como SofIA.'
                : puntaje >= PREGUNTAS.length / 2
                ? 'Nada mal — seguí charlando con SofIA para aprender más.'
                : 'Preguntale a SofIA por chat o por voz, ella sabe de esto.'}
            </p>
            <button className="desafios-btn" onClick={reiniciar}>Jugar de nuevo</button>
          </div>
        ) : (
          <>
            <div className="desafios-progreso">
              <span className="desafios-tema">{actual.tema}</span>
              <span>{indice + 1} / {PREGUNTAS.length}</span>
            </div>
            <h3 className="desafios-pregunta">{actual.pregunta}</h3>
            <div className="desafios-opciones">
              {actual.opciones.map((op, i) => {
                let clase = 'desafios-opcion'
                if (elegida !== null) {
                  if (i === actual.correcta) clase += ' opcion-correcta'
                  else if (i === elegida) clase += ' opcion-incorrecta'
                }
                return (
                  <button key={i} className={clase} onClick={() => elegir(i)} disabled={elegida !== null}>
                    {op}
                  </button>
                )
              })}
            </div>
            {elegida !== null && (
              <div className="desafios-explicacion">
                {elegida === actual.correcta ? '✅ ' : '❌ '}
                {actual.explicacion}
                <button className="desafios-btn desafios-siguiente" onClick={siguiente}>
                  {esUltima ? 'Ver resultado' : 'Siguiente →'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
