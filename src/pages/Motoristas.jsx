import MenuSuperior from "../components/MenuSuperior"
import '../styles/motoristas.css'
import api from '../server/api.js'
import { useEffect, useRef, useState } from "react";

import ModalCarregandoDados from "../components/ModalCarregandoDados.jsx";
import MotoristaitemLista from "../components/MotoristaitemLista.jsx";
import MapaPercurso from "../components/MapaPercurso.jsx";
import MotoristaIndividualPage from "../components/MotoristaIndividualPage.jsx";

export default function Motoristas() {

    const [carregando, setCarregando] = useState(true);
    const [motoristas, setMotoristas] = useState();
    const [pesquisa, setPesquisa] = useState('');
    const [paginaMotoristaInidividual, setPaginaMotoristaInidividual] = useState(false);


    //para a logica de seleção compartilhada entre mapa e lista
    const [motoristaSelecionado, setMotoristaSelecionado] = useState(null);

    const centralizarProximoMotorista = useRef(true);

    const motoristasFiltrados = motoristas?.filter(motorista => motorista.nome.toLowerCase().includes(pesquisa.toLowerCase()));

    async function resgatarMotoristas() {
        try {
            let motoristasDados = await api.get('/motoristas/limpo');
            setMotoristas(motoristasDados.data)
            setCarregando(false);
        } catch (err) {
            console.log('erro ao resgatar motoristas, ', err);
            alert('Erro ao resgatar motoristas!');
            setCarregando(false);
        }
    }

    const [motoristaVerMaisId, setMotoristaVerMaisId] = useState();
    function mostrarPaginaMotoristaIndividual(id) {
        setMotoristaVerMaisId(id);
        setPaginaMotoristaInidividual(true);
    }

    useEffect(() => {
        resgatarMotoristas();
    }, [])

    if (carregando) {
        return (
            <ModalCarregandoDados></ModalCarregandoDados>
        )
    } else {
        return (
            <>
                <div className="contentMotoristas">
                    <div className="esquerdaMotoristas">
                        <div id="topoListaMotoristas">
                            <h1>Motoristas</h1>
                            <p>Procure entre todos os motoristas cadastrados no sistema</p>
                            <input
                                type="text"
                                name=""
                                id="inputPesquisarMotorista"
                                placeholder="Pesquisar"
                                onChange={e => setPesquisa(e.target.value)}
                            />
                        </div>
                        <div className="containerRolavelLista">
                            {motoristasFiltrados.map(motorista => (
                                <div
                                    key={motorista.id}
                                    onClick={() => {
                                        centralizarProximoMotorista.current = true;
                                        setMotoristaSelecionado(motorista.id);
                                    }}
                                    className="itemListaDiv"
                                >
                                    <MotoristaitemLista
                                        motorista={motorista}
                                        selecionado={motoristaSelecionado === motorista.id}
                                        mostrarPaginaMotoristaIndividual={mostrarPaginaMotoristaIndividual}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="direitaMotoristas">
                        <MapaPercurso
                            motoristaSelecionado={motoristaSelecionado}
                            setMotoristaSelecionado={setMotoristaSelecionado}
                            mostrarPaginaMotoristaIndividual={mostrarPaginaMotoristaIndividual}
                            centralizarProximoMotorista={centralizarProximoMotorista}
                        ></MapaPercurso>
                        <div className="divAuxiliarSombra" style={{ width: '75%' }}></div>
                    </div>
                </div>

                {paginaMotoristaInidividual && (
                    <MotoristaIndividualPage
                        motoristaId={motoristaVerMaisId}
                        setPaginaMotoristaInidividual={setPaginaMotoristaInidividual}
                    ></MotoristaIndividualPage>
                )}

                <MenuSuperior></MenuSuperior>
            </>
        )
    }
}