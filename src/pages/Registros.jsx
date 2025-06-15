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


    function dentroDoIntervalo(dataIso) {
        const data = new Date(dataIso);
        const ano = data.getUTCFullYear();

        if (!dataInicio.dia || !dataInicio.mes || !dataFim.dia || !dataFim.mes) return true;

        const inicio = new Date(`${ano}-${dataInicio.mes.padStart(2, '0')}-${dataInicio.dia.padStart(2, '0')}`);
        const fim = new Date(`${ano}-${dataFim.mes.padStart(2, '0')}-${dataFim.dia.padStart(2, '0')}`);
        return data >= inicio && data <= fim;
    }

    async function resgatarRegistros() {
        try {
            let resposta = await api.get('/viagens/limpo');
            setRegistros(resposta.data);
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
                            <p>Busque entre todos os registros armazenados pelo sistema</p>
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
                                            <p><b>Alertas nessa viagem: </b>{registro.quantidade_alertas}</p>
                                        </div>
                                    )
                                })}
                        </div>
                    </div>
                    <div className="direitaRegistros">
                        <MapaPercursoSelecionado viagemId={viagemSelecionada?.id} />
                    </div>
                </div>
                <MenuSuperior></MenuSuperior>
            </>
        )
    }
}