import { useEffect, useState } from 'react'
import './styles/motoristaIndividualPage.css'
import api from '../server/api';

import loadingGif from '../assets/loadingGif.gif';
import fecharIcon from '../assets/fecharIcon.png'
import MapaMotoristaIndividual from './MapaMotoristaIndividual';
import MapaVeiculoIndividual from './MapaVeiculoIndividual';

// import MapaVeiculoIndividual from './MapaVeiculoIndividual'; // Você precisará criar este componente

export default function VeiculoIndividualPage({ veiculoId, setPaginaVeiculoIndividual }) {
    const [veiculo, setVeiculo] = useState();
    const [carregando, setCarregando] = useState(true);
    const [carregandoRelatorio, setCarregandoRelatorio] = useState(false);

    const [viagemSelecionada, setViagemSelecionada] = useState(null);
    const [alertaSelecionado, setAlertaSelecionado] = useState(null);
    const [mostrarTodos, setMostrarTodos] = useState(false);

    //os filtros para a pesquisa
    const [filtroViagemDia, setFiltroViagemDia] = useState('');
    const [filtroViagemMes, setFiltroViagemMes] = useState('');
    const [filtroAlertaDia, setFiltroAlertaDia] = useState('');
    const [filtroAlertaMes, setFiltroAlertaMes] = useState('');

    // Estados para pesquisa textual
    const [pesquisaViagem, setPesquisaViagem] = useState('');
    const [pesquisaAlerta, setPesquisaAlerta] = useState('');

    async function resgatarVeiculo() {
        try {
            let resposta = await api.get(`veiculos/${veiculoId}`);
            setVeiculo(resposta.data);
            console.log(resposta.data);
            setCarregando(false);
        } catch (err) {
            console.log('erro ao resgatar veiculo individual ', err);
            alert('Erro ao resgatar veiculo individual');
            setCarregando(false);
        }
    }

    // utils/gerarRelatorio.js
    async function gerarRelatorioVeiculo() {
        setCarregandoRelatorio(true);
        try {
            const id = veiculo?.id; // acessa o ID global
            if (!id) {
                alert("ID do veículo não encontrado!");
                return;
            }

            const url = `https://telemetria-fvv4.onrender.com/veiculos/relatorio/${id}`;

            // Faz o fetch do PDF
            const response = await fetch(url);
            if (!response.ok) throw new Error("Erro ao gerar relatório.");

            // Converte o PDF para blob
            const blob = await response.blob();
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `relatorio_veiculo_${id}.pdf`;
            link.click();

            // Limpa o objeto de URL temporário
            URL.revokeObjectURL(link.href);

        } catch (err) {
            console.error("Erro ao baixar relatório:", err);
            alert("Falha ao gerar relatório.");
        } finally {
            setCarregandoRelatorio(false);
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

    // Calcular total de alertas (soma de todos os alertas de todas as viagens)
    const totalAlertas = veiculo?.viagens?.reduce((total, viagem) => {
        return total + (viagem.alertas?.length || 0);
    }, 0) || 0;

    useEffect(() => {
        resgatarVeiculo();
    }, [])

    function contemTermo(texto, termo) {
        if (!texto) return false;
        return texto.toString().toLowerCase().includes(termo.toLowerCase());
    }

    if (carregando) {
        return (
            <div className='divCarregandoMotorista'>
                <img src={loadingGif} alt="" className='loadingGif' />
                <h2>Carregando...</h2>
            </div>
        )
    } else {
        return (
            <div className='paginaMotoristaIndividual'>
                <div id='motoristaIndividualPageEsquerda'>
                    <p>Todos os registro de:</p>
                    <div className='topoMotoristaIndividual'>
                        <div>
                            <h2>{veiculo.identificador}</h2>
                            <p><b>Modelo: </b>{veiculo.modelo}</p>
                            {carregandoRelatorio ?
                                (<img src={loadingGif} alt="" style={{ height: '30px' }} />) :
                                (<button className="botaoGerarRelatorio" onClick={gerarRelatorioVeiculo}>
                                    Gerar Relatório
                                </button>)
                            }
                        </div>
                        <button className='botaoFechar' onClick={() => setPaginaVeiculoIndividual(false)}>
                            <img className='botaofecharImg' src={fecharIcon} alt="" />
                        </button>
                    </div>
                    <div className='motoristaDemaisInformações'>
                        <p> <b> Viagens: </b> {veiculo.viagens.length}</p>
                        <div className='divFiltroMotoristaInidividual'>
                            <input
                                type="number"
                                placeholder='Dia'
                                className='inputFiltroMotorista'
                                value={filtroViagemDia}
                                onChange={e => setFiltroViagemDia(e.target.value)}
                            />
                            <input
                                type="number"
                                placeholder='Mês'
                                className='inputFiltroMotorista'
                                value={filtroViagemMes}
                                onChange={e => setFiltroViagemMes(e.target.value)}
                            />
                        </div>
                        <input
                            type="text"
                            placeholder='Pesquise qualquer coisa'
                            className='inputPesquisaMotoristaIndividual'
                            value={pesquisaViagem}
                            onChange={e => setPesquisaViagem(e.target.value)}
                        />
                        <div className='divViagensMotorista'>
                            {[...veiculo.viagens]
                                .filter(viagem => {
                                    const data = new Date(viagem.inicio);
                                    const dia = String(data.getUTCDate());
                                    const mes = String(data.getUTCMonth() + 1);

                                    const filtroData = (!filtroViagemDia || Number(dia) === Number(filtroViagemDia)) &&
                                        (!filtroViagemMes || Number(mes) === Number(filtroViagemMes));

                                    const filtroTexto = !pesquisaViagem ||
                                        contemTermo(viagem.motorista?.nome, pesquisaViagem) ||
                                        contemTermo(viagem.motorista?.cartao_rfid, pesquisaViagem) ||
                                        contemTermo(formatarDataHora(viagem.inicio), pesquisaViagem) ||
                                        contemTermo(formatarDataHora(viagem.fim), pesquisaViagem);

                                    return filtroData && filtroTexto;
                                })
                                .sort((a, b) => new Date(b.inicio) - new Date(a.inicio))
                                .map(viagem => {
                                    const quantidadeAlertas = viagem.alertas?.length || 0;

                                    return (
                                        <div
                                            className={`viagemMotoristaItemLista ${viagemSelecionada?.id === viagem.id ? 'viagemSelecionada' : ''}`}
                                            key={viagem.id}
                                            onClick={() => {
                                                setViagemSelecionada(viagem);
                                                const alertaRelacionado = viagem.alertas.find(alerta => alerta.viagem_id === viagem.id);

                                                setAlertaSelecionado(alertaRelacionado || null);
                                            }}
                                        >
                                            <p><b>Início:</b> {formatarDataHora(viagem.inicio)}</p>
                                            <p><b>Fim:</b> {viagem.fim ? formatarDataHora(viagem.fim) : 'Em andamento'}</p>
                                            <p><b>Motorista: </b>{viagem.motorista?.nome} - {viagem.motorista?.cartao_rfid}</p>
                                            <p><b>Alertas: </b>{quantidadeAlertas}</p>
                                        </div>
                                    );
                                })
                            }
                        </div>

                        <p><b> Alertas: </b> {totalAlertas}</p>
                        <div className='divFiltroMotoristaInidividual'>
                            <input
                                type="number"
                                placeholder='Dia'
                                className='inputFiltroMotorista'
                                value={filtroAlertaDia}
                                onChange={e => setFiltroAlertaDia(e.target.value)}
                            />
                            <input
                                type="number"
                                placeholder='Mês'
                                className='inputFiltroMotorista'
                                value={filtroAlertaMes}
                                onChange={e => setFiltroAlertaMes(e.target.value)}
                            />
                        </div>
                        <input
                            type="text"
                            placeholder='Pesquise qualquer coisa'
                            className='inputPesquisaMotoristaIndividual'
                            value={pesquisaAlerta}
                            onChange={e => setPesquisaAlerta(e.target.value)}
                        />
                        <div className='divViagensMotorista'>
                            {veiculo.viagens
                                .flatMap(viagem =>
                                    viagem.alertas?.map(alerta => ({
                                        ...alerta,
                                        viagem_inicio: viagem.inicio,
                                        motorista_nome: viagem.motorista?.nome,
                                        motorista_rfid: viagem.motorista?.cartao_rfid
                                    })) || []
                                )
                                .filter(alerta => {
                                    const data = new Date(alerta.timestamp);
                                    const dia = String(data.getUTCDate());
                                    const mes = String(data.getUTCMonth() + 1);

                                    const filtroData = (!filtroAlertaDia || Number(dia) === Number(filtroAlertaDia)) &&
                                        (!filtroAlertaMes || Number(mes) === Number(filtroAlertaMes));

                                    const filtroTexto = !pesquisaAlerta ||
                                        contemTermo(alerta.tipo, pesquisaAlerta) ||
                                        contemTermo(alerta.motorista_nome, pesquisaAlerta) ||
                                        contemTermo(alerta.motorista_rfid, pesquisaAlerta) ||
                                        contemTermo(formatarDataHora(alerta.timestamp), pesquisaAlerta);

                                    return filtroData && filtroTexto;
                                })
                                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                                .map(alerta => (
                                    <div
                                        className={`viagemMotoristaItemLista ${alertaSelecionado?.id === alerta.id ? 'viagemSelecionada' : ''}`}
                                        key={alerta.id}
                                        onClick={() => {
                                            setAlertaSelecionado(alerta);
                                            setViagemSelecionada(null);
                                        }}
                                    >
                                        <p><b>{alerta.tipo}</b></p>
                                        <p><b>Horário: </b>{formatarDataHora(alerta.timestamp)}</p>
                                        <p><b>Motorista: </b>{alerta.motorista_nome} - {alerta.motorista_rfid}</p>
                                        <p><b>Descrição: </b>{alerta.descricao}</p>
                                    </div>
                                ))
                            }
                        </div>

                        <button
                            className='botaoMostrarTodosOsAlertas'
                            onClick={() => {
                                setMostrarTodos(!mostrarTodos);
                            }}
                        >
                            {mostrarTodos ? 'Ocultar todos os alertas' : 'Mostrar todos os alertas'}
                        </button>
                    </div>
                </div>
                <div id='motoristaIndividualPageDireita'>
                    {/* Você precisará criar um MapaVeiculoIndividual similar ao MapaMotoristaIndividual
                    <MapaVeiculoIndividual
                        veiculo={veiculo}
                        viagemSelecionada={viagemSelecionada}
                        alertaSelecionado={alertaSelecionado}
                        mostrarTodos={mostrarTodos}
                        setMostrarTodos={setMostrarTodos}
                    /> */}
                    <MapaVeiculoIndividual
                        veiculo={veiculo}
                        viagemSelecionada={viagemSelecionada}
                        alertaSelecionado={alertaSelecionado}
                    />
                    <div className="divAuxiliarSombra" style={{ width: '70%' }}></div>
                </div>
            </div>
        )
    }
}