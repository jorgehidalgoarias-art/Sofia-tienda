// ────────────────────────────────────────────────────────────────────────
// Avatar de SofIA con foto real (reemplaza al dibujo animado de
// SofiaFace.jsx, que queda en el repo sin usar por si en algún momento se
// quiere volver a él).
//
// Una foto no se puede animar como un dibujo vectorial (no hay boca ni
// ojos que mover cuadro a cuadro), así que el estado de la conversación
// se comunica alrededor de la foto: un anillo que cambia de color según
// el estado, unos "ripples" tipo radar al escuchar, un giro punteado al
// pensar, y un mini ecualizador de voz al hablar — mismo lenguaje visual
// que ya usaba el avatar dibujado, aplicado a un marco en vez de a la
// cara en sí. Una respiración sutil (escala) le da vida en idle.
// ────────────────────────────────────────────────────────────────────────
export default function SofiaAvatarFoto({ estado = 'idle', size = 120 }) {
  return (
    <div
      className={`sofia-foto sofia-foto-${estado}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <span className="sofia-foto-ripple sofia-foto-ripple-1" />
      <span className="sofia-foto-ripple sofia-foto-ripple-2" />
      <span className="sofia-foto-ripple sofia-foto-ripple-3" />
      <span className="sofia-foto-anillo" />
      <img className="sofia-foto-img" src="/sofia-avatar.jpg" alt="SofIA" />
      <span className="sofia-foto-vineta" />
      <span className="sofia-foto-eq">
        <i></i><i></i><i></i><i></i>
      </span>
    </div>
  )
}
