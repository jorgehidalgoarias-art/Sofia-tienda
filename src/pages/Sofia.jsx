import SofiaConversacion from '../components/SofiaConversacion'

export default function Sofia() {
  return (
    <>
      <div className="pagina-header">
        <h2>Hablá con SofIA</h2>
        <span className="catalogo-sub">Charlemos de café o de Costa Rica — escribile o hablale, como prefieras</span>
      </div>
      <div className="sofia-conversacion-zona">
        <SofiaConversacion />
      </div>
    </>
  )
}
