import '../styles/alertas.css'
import '../styles/registros.css'
import { useEffect, useState } from "react";
import api from "../server/api";

import MenuSuperior from "../components/MenuSuperior"
import ModalCarregandoDados from '../components/ModalCarregandoDados';
import Registros from './Registros';

import MapaAlertas from '../components/MapaAlertas';

//tela responsável
export default function Alertas() {

    // para a pesquisa entre os registros
    const [termoBusca, setTermoBusca] = useState('');
    const [dataInicio, setDataInicio] = useState({ dia: '', mes: '' });
    const [dataFim, setDataFim] = useState({ dia: '', mes: '' });

    // para a lógica de seleção de viagens na lista lateral
    const [viagemSelecionada, setViagemSelecionada] = useState(null);

    const [carregando, setCarregando] = useState(true);
    const [alertas, setAlertas] = useState([]);

    const [mostrarTodos, setMostrarTodos] = useState(false);

    async function carregarAlertas() {
        try {
            let resposta = await api.get('/alertas/limpo');
            setAlertas(resposta.data);
            setCarregando(false);
        } catch (err) {
            console.log(err);
            alert('Erro ao carregar alertas!');
            setCarregando(false);
        }
    }

    useEffect(() => {
        carregarAlertas();
    }, [])

    // para a logica de pesquisar por periodo
    function dentroDoIntervalo(dataIso) {
        if (!dataInicio.dia || !dataInicio.mes || !dataFim.dia || !dataFim.mes) return true;

        const data = new Date(dataIso);
        const dia = data.getDate();
        const mes = data.getMonth() + 1;

        const dataAlerta = mes * 100 + dia;
        const dataInicioNum = parseInt(dataInicio.mes) * 100 + parseInt(dataInicio.dia);
        const dataFimNum = parseInt(dataFim.mes) * 100 + parseInt(dataFim.dia);

        return dataAlerta >= dataInicioNum && dataAlerta <= dataFimNum;
    }

    //para formar a data da forma como vem do BD
    function formatarDataHora(isoString) {
        const data = new Date(isoString);

        const dia = String(data.getUTCDate()).padStart(2, '0');
        const mes = String(data.getUTCMonth() + 1).padStart(2, '0');
        const ano = data.getUTCFullYear();

        const hora = String(data.getUTCHours()).padStart(2, '0');
        const minuto = String(data.getUTCMinutes()).padStart(2, '0');

        return `${dia}/${mes}/${ano} - ${hora}:${minuto}`;
    }

    if (carregando) {
        return (
            <ModalCarregandoDados></ModalCarregandoDados>
        )
    } else {
        return (
            <>
                <div className="alertasPage">
                    <div className="esquerdaAlertas">
                        <div className="topoEsquerdaAlertasPage">
                            <h2>Alertas</h2>
                            <p>Busque entre todos os alertas do sistema</p>
                            <input
                                type="text"
                                placeholder="Pesquise qualquer coisa"
                                className="inputPesquisaQualquerCoisa"
                                value={termoBusca}
                                onChange={(e) => setTermoBusca(e.target.value)}
                            />

                            <p>Pesquisar por período:</p>
                            <div className="pesquisaPorData">
                                <div className="pesquisaPorDataInputs">
                                    <input
                                        type="number"
                                        placeholder="DD"
                                        className="inputdata"
                                        value={dataInicio.dia}
                                        onChange={e => setDataInicio({ ...dataInicio, dia: e.target.value })}
                                    />
                                    <input
                                        type="number"
                                        placeholder="MM"
                                        className="inputdata"
                                        value={dataInicio.mes}
                                        onChange={e => setDataInicio({ ...dataInicio, mes: e.target.value })}
                                    />
                                </div>
                                <p>a</p>
                                <div className="pesquisaPorDataInputs">
                                    <input
                                        type="number"
                                        placeholder="DD"
                                        className="inputdata"
                                        value={dataFim.dia}
                                        onChange={e => setDataFim({ ...dataFim, dia: e.target.value })}
                                    />
                                    <input
                                        type="number"
                                        placeholder="MM"
                                        className="inputdata"
                                        value={dataFim.mes}
                                        onChange={e => setDataFim({ ...dataFim, mes: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="divMostrarTodosAlertas">
                                <label htmlFor="">Mostrar todos os alertas no mapa</label>
                                <input type="checkbox" name="mostrarTodos" id="mostrarTodos" onChange={e => setMostrarTodos(e.target.checked)} />
                            </div>
                        </div>
                        <div className='divRegistros'>
                            {alertas
                                .filter(alerta => {
                                    const termo = termoBusca.toLocaleLowerCase();
                                    const corresponde = (
                                        alerta.nome_motorista.toLowerCase().includes(termo) ||
                                        alerta.veiculo_identificador.toLowerCase().includes(termo) ||
                                        alerta.veiculo_modelo.toLowerCase().includes(termo) ||
                                        formatarDataHora(alerta.data_hora).includes(termo)
                                    );
                                    return corresponde && dentroDoIntervalo(alerta.data_hora);
                                })
                                .map(alerta => {
                                    return (
                                        <div
                                            className={`registroItemLista ${viagemSelecionada && viagemSelecionada.id === alerta.id ? 'selecionado' : ''}`}
                                            key={alerta.alerta_id}
                                            onClick={() => setViagemSelecionada(alerta.alerta_id)}
                                        >
                                            <p>{formatarDataHora(alerta.data_hora)}</p>
                                            <p><b>Motorista envolvido: </b>{alerta.nome_motorista}</p>
                                            <p><b>Veículo envolvido: </b>{alerta.veiculo_identificador}</p>
                                            <p><b>Modelo: </b>{alerta.veiculo_modelo}</p>
                                        </div>
                                    )
                                })
                            }
                        </div>
                    </div>
                    <div className="direitaAlertas">
                        <MapaAlertas viagemId={viagemSelecionada} mostrarTodos={mostrarTodos} ></MapaAlertas>
                    </div>
                </div>

                <MenuSuperior></MenuSuperior>
            </>
        )
    }
}