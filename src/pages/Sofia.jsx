import ChatSofia from '../components/ChatSofia'
import VozSofia from '../components/VozSofia'

export default function Sofia() {
  return (
    <>
      <div className="pagina-header">
        <h2>Hablá con SofIA</h2>
        <span className="catalogo-sub">Preguntale por la carta, pedile una recomendación, o charlemos de café</span>
      </div>
      <div className="asistente-grid">
        <ChatSofia />
        <VozSofia />
      </div>
    </>
  )
}
