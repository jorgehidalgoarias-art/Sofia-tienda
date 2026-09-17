import { NavLink } from 'react-router-dom'

export default function NavBar({ cantidadCarrito }) {
  return (
    <nav className="navbar">
      <NavLink to="/" end className={({ isActive }) => 'navbar-link' + (isActive ? ' navbar-activo' : '')}>
        Carta
      </NavLink>
      <NavLink to="/sofia" className={({ isActive }) => 'navbar-link' + (isActive ? ' navbar-activo' : '')}>
        Hablá con SofIA
      </NavLink>
      <NavLink to="/desafios" className={({ isActive }) => 'navbar-link' + (isActive ? ' navbar-activo' : '')}>
        Desafíos
      </NavLink>
      <NavLink to="/pedido" className={({ isActive }) => 'navbar-link navbar-pedido' + (isActive ? ' navbar-activo' : '')}>
        🛒 Tu pedido{cantidadCarrito > 0 ? ` (${cantidadCarrito})` : ''}
      </NavLink>
    </nav>
  )
}
