import MenuSuperior from "../components/MenuSuperior"
import '../styles/motoristas.css'
import api from '../server/api.js'
import { useEffect, useState } from "react";

import ModalCarregandoDados from "../components/ModalCarregandoDados.jsx";
import MotoristaitemLista from "../components/MotoristaitemLista.jsx";
import MapaPercurso from "../components/MapaPercurso.jsx";

export default function Motoristas() {

    const [carregando, setCarregando] = useState(true);
    const [motoristas, setMotoristas] = useState();
    const [pesquisa, setPesquisa] = useState('');

    //para a logica de seleção compartilhada entre mapa e lista
    const [motoristaSelecionado, setMotoristaSelecionado] = useState(null);

    const motoristasFiltrados = motoristas?.filter(motorista => motorista.nome.toLowerCase().includes(pesquisa.toLowerCase()));

    async function resgatarMotoristas() {
        try {
            let motoristasDados = await api.get('/motoristas/limpo');
            setMotoristas(motoristasDados.data)
            console.log(motoristasDados.data);
            setCarregando(false);
        } catch (err) {
            console.log('erro ao resgatar motoristas, ', err);
            alert('Erro ao resgatar motoristas!');
            setCarregando(false);
        }
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
                                <MotoristaitemLista
                                    motorista={motorista}
                                    key={motorista.id}
                                    selecionado={motoristaSelecionado === motorista.id}
                                    aoSelecionar={() => setMotoristaSelecionado(motorista.id)}
                                ></MotoristaitemLista>
                            ))}
                        </div>
                    </div>

                    <div className="direitaMotoristas">
                        <MapaPercurso
                            motoristaSelecionado={motoristaSelecionado}
                            setMotoristaSelecionado={setMotoristaSelecionado}
                        ></MapaPercurso>
                    </div>
                </div>

                <MenuSuperior></MenuSuperior>

            </>
        )
    }
}