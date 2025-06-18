import '../styles/alertas.css'
import '../styles/registros.css'
import { useEffect, useState } from "react";
import api from "../server/api";

import MenuSuperior from "../components/MenuSuperior"
import ModalCarregandoDados from '../components/ModalCarregandoDados';
import Registros from './Registros';

import MapaAlertas from '../components/MapaAlertas';

export default function Alertas() {

    // para a pesquisa entre os registros
    const [termoBusca, setTermoBusca] = useState('');
    const [dataInicio, setDataInicio] = useState({ dia: '', mes: '' });
    const [dataFim, setDataFim] = useState({ dia: '', mes: '' });

    // para a lógica de seleção de viagens na lista lateral
    const [viagemSelecionada, setViagemSelecionada] = useState(null);

    const [carregando, setCarregando] = useState(true);
    const [alertas, setAlertas] = useState([]);

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

    //função para a lógica da pesquisa por período
    function dentroDoIntervalo(dataIso) {
        const data = new Date(dataIso);
        const ano = data.getUTCFullYear();

        if (!dataInicio.dia || !dataInicio.mes || !dataFim.dia || !dataFim.mes) return true;

        const inicio = new Date(`${ano}-${dataInicio.mes.padStart(2, '0')}-${dataInicio.dia.padStart(2, '0')}`);
        const fim = new Date(`${ano}-${dataFim.mes.padStart(2, '0')}-${dataFim.dia.padStart(2, '0')}`);
        return data >= inicio && data <= fim;
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
                                <input type="checkbox" name="" id="" /><label htmlFor="">Mostrar todos</label>
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
                        <MapaAlertas viagemId={viagemSelecionada} ></MapaAlertas>
                    </div>
                </div>

                <MenuSuperior></MenuSuperior>
            </>
        )
    }
}