import '../styles/inicio.css'

//obviamente o componente do menu superior
import MenuSuperior from "../components/MenuSuperior"
//o mapa percurso é o mapa usado na tela de motoristas, a ideia é que ele mostre em tempo real a atualização deles no mapa
//ele é importado aqui por ter essa função
import MapaPercurso from "../components/MapaPercurso"
//pagina individual com dados de historico dos motoristas, é util para que o usuário acesse esses dados sem precisar trocar de tela
import MotoristaIndividualPage from '../components/MotoristaIndividualPage'
import { use, useRef, useState } from 'react'

//a tela inicio é uma tela simples que mostra o mapa atualizado em tempo real com as localizações de cada veículo e as cercas atuantes
//a ideia é que seja uma tela simples mesmo, apenas para monitoriamento
export default function Inicio() {

    const [paginaMotoristaIndividual, mostrarPaginaMotoristaIndividual] = useState(false); //estado para mostrar ou não a tela individual
    const [motoristaSelecionado, setMotoristaSelecionado] = useState(); //armazena o motorista selecionado para passar a outra tela

    //useRef que impede a centralização do motorista quando clicado no mapa, mas permite que centralize quando clicado na lista lateral da tela de Motoristas
    //essa logica será explicada em MapaPercurso e TelaMosotirsta
    //mas nesta tela ela está desativada, pois só há mapa, não há lista lateral
    //então o mapa nunca irá centralizar o carro clicado!
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

            {/* mostra a pagina de motorista individualn se a flag mudar*/}
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