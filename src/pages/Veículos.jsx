import MenuSuperior from "../components/MenuSuperior"
import '../styles/motoristas.css'
import api from '../server/api.js'
import { useEffect, useRef, useState } from "react";

import ModalCarregandoDados from "../components/ModalCarregandoDados.jsx";
import MapaPercurso from "../components/MapaPercurso.jsx";
import VeiculoItemLista from "../components/VeiculoItemLista.jsx";
// import MotoristaIndividualPage from "../components/MotoristaIndividualPage.jsx";
import MotoristaIndividualPage from "../components/MotoristaIndividualPage.jsx";
import VeiculoIndividualPage from "../components/VeiculoIndividualPage.jsx";

export default function Veiculos() {

    const [carregando, setCarregando] = useState(true);
    const [veiculos, setVeiculos] = useState();
    const [pesquisa, setPesquisa] = useState('');
    const centralizarProximoVeiculo = useRef(true);
    const [veiculoSelecionado, setVeiculoSelecionado] = useState(null);
    const [paginaVeiculoIndividual, setPaginaVeiculoInidividual] = useState(false);
    const veiculosFiltrados = veiculos?.filter(veiculo =>
        veiculo.identificador.toLowerCase().includes(pesquisa.toLowerCase()) ||
        veiculo.modelo.toLowerCase().includes(pesquisa.toLowerCase())
    );

    async function resgatarVeiculos() {
        try {
            let veiculosDados = await api.get('/veiculos/limpo');
            setVeiculos(veiculosDados.data)
            setCarregando(false);
        } catch (err) {
            console.log('erro ao resgatar veiculos, ', err);
            alert('Erro ao resgatar veiculos!');
            setCarregando(false);
        }
    }

    const [veiculoVerMaisId, setVeiculoVerMaisId] = useState();
    function mostrarPaginaVeiculoIndividual(id) {
        setVeiculoVerMaisId(id);
        setPaginaVeiculoInidividual(true);
    }

    useEffect(() => {
        resgatarVeiculos();
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
                            <h1>Veículos</h1>
                            <p>Procure entre todos os veículos cadastrados no sistema</p>
                            <input
                                type="text"
                                name=""
                                id="inputPesquisarMotorista"
                                placeholder="Pesquise um identificador ou modelo"
                                onChange={e => setPesquisa(e.target.value)}
                            />
                        </div>
                        <div className="containerRolavelLista">
                            {veiculosFiltrados.map(veiculo => (
                                <div
                                    key={veiculo.id}
                                    onClick={() => {
                                        centralizarProximoVeiculo.current = true;
                                        setVeiculoSelecionado(veiculo.id);
                                    }}
                                    className="itemListaDiv"
                                >
                                    <VeiculoItemLista
                                        veiculo={veiculo}
                                        selecionado={veiculoSelecionado === veiculo.id}
                                        mostrarPaginaVeiculoIndividual={mostrarPaginaVeiculoIndividual}
                                    />

                                </div>
                            ))}
                        </div>

                    </div>

                    <div className="direitaMotoristas">
                        <MapaPercurso
                            motoristaSelecionado={veiculoSelecionado}
                            setMotoristaSelecionado={setVeiculoSelecionado}
                            mostrarPaginaMotoristaIndividual={mostrarPaginaVeiculoIndividual}
                            centralizarProximoMotorista={centralizarProximoVeiculo}
                        ></MapaPercurso>
                        <div className="divAuxiliarSombra" style={{ width: '75%' }}></div>
                    </div>
                </div>

                {paginaVeiculoIndividual && (
                    <VeiculoIndividualPage
                        veiculoId={veiculoVerMaisId}
                        setPaginaVeiculoIndividual={setPaginaVeiculoInidividual}
                    />
                )}

                <MenuSuperior></MenuSuperior>
            </>
        )
    }
}