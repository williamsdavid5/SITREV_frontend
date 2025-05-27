import { NavLink } from "react-router-dom"
import './styles/menuSuperior.css'

export default function MenuSuperior() {
    return (
        <header>
            <nav className="menuSuperior">
                <NavLink to={'/'} end className={"link"}>Início</NavLink>
                <NavLink to={'/motoristas'} end className={"link"}>Motoristas</NavLink>
                <NavLink to={'/veiculos'} className={"link"}>Veículos</NavLink>
                <NavLink to={'/alertas'} className={"link"}>Alertas</NavLink>
            </nav>
        </header>
    )
}