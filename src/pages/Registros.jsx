import { useEffect, useState } from "react"
import MenuSuperior from "../components/MenuSuperior"
import '../styles/registros.css'
import api from "../server/api";

import ModalCarregandoDados from "../components/ModalCarregandoDados";
import MapaPercursoSelecionado from "../components/MapaPercursoSelecionado";

export default function Registros() {

    const [registros, setRegistros] = useState([]);
    const [carregando, setcarregando] = useState(true);

    // para a pesquisa entre os registros
    const [termoBusca, setTermoBusca] = useState('');
    const [dataInicio, setDataInicio] = useState({ dia: '', mes: '' });
    const [dataFim, setDataFim] = useState({ dia: '', mes: '' });

    // para a lógica de seleção de viagens na lista lateral
    const [viagemSelecionada, setViagemSelecionada] = useState(null);


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

    async function resgatarRegistros() {
        try {
            let resposta = await api.get('/viagens/limpo');

            const ordenados = resposta.data.sort((a, b) => {
                const dataA = new Date(a.data_viagem);
                const dataB = new Date(b.data_viagem);

                if (dataA > dataB) return -1;
                if (dataA < dataB) return 1;

                return b.id - a.id;
            });

            setRegistros(ordenados);
            setcarregando(false);
        } catch (err) {
            console.log('Erro ao resgatar registros, ', err);
            alert('Erro ao resgatar registros');
        }
    }

    function formatarDataHora(isoString) {
        const data = new Date(isoString);

        const dia = String(data.getUTCDate()).padStart(2, '0');
        const mes = String(data.getUTCMonth() + 1).padStart(2, '0');
        const ano = data.getUTCFullYear();

        const hora = String(data.getUTCHours()).padStart(2, '0');
        const minuto = String(data.getUTCMinutes()).padStart(2, '0');

        return `${dia}/${mes}/${ano} - ${hora}:${minuto}`;
    }

    useEffect(() => {
        resgatarRegistros();
    }, [])

    if (carregando) {
        return (
            <ModalCarregandoDados></ModalCarregandoDados>
        )
    } else {

        return (
            <>
                <div className="registrosPage">
                    <div className="esquerdaRegistros">
                        <div className="topoRegistros">
                            <h2>Registros</h2>
                            <p>Procure entre registros, veículos, motoristas e datas, tudo acessível por aqui.</p>
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
                        </div>
                        <div className="divRegistros">
                            {registros
                                .filter(registro => {
                                    const termo = termoBusca.toLowerCase();
                                    const corresponde = (
                                        registro.nome_motorista.toLowerCase().includes(termo) ||
                                        registro.identificador_veiculo.toLowerCase().includes(termo) ||
                                        registro.modelo_veiculo.toLowerCase().includes(termo) ||
                                        formatarDataHora(registro.data_viagem).includes(termo)
                                    );
                                    return corresponde && dentroDoIntervalo(registro.data_viagem);
                                })

                                .map(registro => {
                                    return (
                                        <div
                                            className={`registroItemLista ${viagemSelecionada && viagemSelecionada.id === registro.id ? 'selecionado' : ''}`}
                                            key={registro.id}
                                            onClick={() => setViagemSelecionada(registro)}
                                        >

                                            <p>{formatarDataHora(registro.data_viagem)}</p>
                                            <p><b>Motorista: </b> {registro.nome_motorista}</p>
                                            <p><b>Veículo usado: </b>{registro.identificador_veiculo}</p>
                                            <p><b>Modelo veículo: </b>{registro.modelo_veiculo}</p>
                                            <p><b>Alertas nessa viagem: </b>{registro.quantidade_alertas}</p>
                                        </div>
                                    )
                                })}
                        </div>
                    </div>
                    <div className="direitaRegistros">
                        <MapaPercursoSelecionado viagemId={viagemSelecionada?.id} />
                        <div className="divAuxiliarSombra" style={{ width: '75%' }}></div>
                    </div>
                </div>
                <MenuSuperior></MenuSuperior>
            </>
        )
    }
}