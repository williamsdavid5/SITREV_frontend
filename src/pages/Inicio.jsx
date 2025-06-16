import '../styles/inicio.css'

import MenuSuperior from "../components/MenuSuperior"
import MapaPercurso from "../components/MapaPercurso"
import MotoristaIndividualPage from '../components/MotoristaIndividualPage'
import { use, useRef, useState } from 'react'


export default function Inicio() {

    const [paginaMotoristaIndividual, mostrarPaginaMotoristaIndividual] = useState(false);
    const [motoristaSelecionado, setMotoristaSelecionado] = useState();

    const centralizarProximoMotorista = useRef(false)

    return (
        <>
            <div className="telInicioContent">
                <MapaPercurso
                    motoristaSelecionado={motoristaSelecionado}
                    setMotoristaSelecionado={setMotoristaSelecionado}
                    mostrarPaginaMotoristaIndividual={mostrarPaginaMotoristaIndividual}
                    centralizarProximoMotorista={centralizarProximoMotorista}
                ></MapaPercurso>
            </div>

            {paginaMotoristaIndividual && (
                <MotoristaIndividualPage
                    motoristaId={motoristaSelecionado}
                    setPaginaMotoristaInidividual={mostrarPaginaMotoristaIndividual}
                    centralizarProximoMotorista={false}
                ></MotoristaIndividualPage>
            )}

            <MenuSuperior></MenuSuperior>
        </>
    )
}