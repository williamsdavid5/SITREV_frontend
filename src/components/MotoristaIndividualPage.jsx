import { useEffect, useState } from 'react'
import './styles/motoristaIndividualPage.css'
import api from '../server/api';

import loadingGif from '../assets/loadingGif.gif';
import fecharIcon from '../assets/fecharIcon.png'

import MapaMotoristaIndividual from './MapaMotoristaIndividual'; //mapa que mostra apenas um percurso por vez, serve para visualização de historicos

//página para exibir informações de um motorista especifico
export default function MotoristaIndividualPage({ motoristaId, setPaginaMotoristaInidividual }) {

    const [motorista, setMotorista] = useState(); //motorista a ser exibido
    const [carregando, setCarregando] = useState(true); //para a tela de loading
    const [carregandoRelatorio, setCarregandoRelatorio] = useState(false);
    const [mostrarModalGerarRelatorio, setMostrarModalGerarRelatorio] = useState(false);

    //caso o usuario selecione uma viagem ou alerta na lista ou mapa
    const [viagemSelecionada, setViagemSelecionada] = useState(null);
    const [alertaSelecionado, setAlertaSelecionado] = useState(null);

    const [mostrarTodos, setMostrarTodos] = useState(false); //para mostrar todos os alertas no mapa ao mesmo tempo

    // //os filtros para a pesquisa
    // const [filtroViagemDia, setFiltroViagemDia] = useState('');
    // const [filtroViagemMes, setFiltroViagemMes] = useState('');
    // const [filtroAlertaDia, setFiltroAlertaDia] = useState('');
    // const [filtroAlertaMes, setFiltroAlertaMes] = useState('');

    const [dataInicioViagem, setDataInicioViagem] = useState('');
    const [dataFimViagem, setDataFimViagem] = useState('');
    const [dataInicioAlerta, setDataInicioAlerta] = useState('');
    const [dataFimAlerta, setDataFimAlerta] = useState('');

    // Estados para pesquisa textual
    const [pesquisaViagem, setPesquisaViagem] = useState('');
    const [pesquisaAlerta, setPesquisaAlerta] = useState('');


    //a função que se comunica com a API
    async function resgatarMotorista() {
        try {
            let resposta = await api.get(`motoristas/${motoristaId}`);
            setMotorista(resposta.data);
            console.log(resposta.data);
            setCarregando(false);
        } catch (err) {
            console.log('erro ao resgatar motorista individual ', err);
            alert('Erro ao resgatar motorista individual');
            setCarregando(false);
        }
    }

    async function gerarRelatorioMotorista() {
        setCarregandoRelatorio(true);
        try {
            const id = motorista?.id;
            if (!id) {
                alert("ID do motorista não encontrado!");
                return;
            }

            // 🗓️ Lê os valores dos inputs de data por extenso
            const dataInicio = document.getElementById('relatorioDataInicio').value;
            const dataFim = document.getElementById('relatorioDataFim').value;

            // 🔗 Monta os parâmetros de data
            let params = new URLSearchParams();

            if (dataInicio) {
                params.append('inicio', dataInicio);
            }
            if (dataFim) {
                params.append('fim', dataFim);
            }

            // Adiciona o tipo do relatório (resumido/completo)
            const tipoRelatorio = document.querySelector('input[name="tipoRelatorio"]:checked')?.value || 'completo';
            params.append('tipo', tipoRelatorio);

            // const url = `https://telemetria-fvv4.onrender.com/motoristas/relatorio/${id}?${params.toString()}`;
            const url = `http://localhost:3000/motoristas/relatorio/${id}?${params.toString()}`;

            // 🌐 Faz o download do relatório
            const response = await fetch(url);
            if (!response.ok) throw new Error("Erro ao gerar relatório.");

            // 📄 Baixa o PDF
            const blob = await response.blob();
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `relatorio_motorista_${id}.pdf`;
            link.click();

            URL.revokeObjectURL(link.href);

        } catch (err) {
            console.error("Erro ao baixar relatório:", err);
            alert("Falha ao gerar relatório.");
        } finally {
            setCarregandoRelatorio(false);
            setMostrarModalGerarRelatorio(false);
        }
    }


    //para formatar a data e hora recebida do BD
    function formatarDataHora(isoString) {
        const data = new Date(isoString);

        const dia = String(data.getUTCDate()).padStart(2, '0');
        const mes = String(data.getUTCMonth() + 1).padStart(2, '0');
        const ano = data.getUTCFullYear();

        const hora = String(data.getUTCHours()).padStart(2, '0');
        const minuto = String(data.getUTCMinutes()).padStart(2, '0');

        return `${dia}/${mes}/${ano} - ${hora}:${minuto}`;
    }

    function dentroDoIntervalo(dataIso, dataInicio, dataFim) {
        if (!dataInicio || !dataFim) return true;

        const data = new Date(dataIso);
        const dataAlerta = data.getTime();

        const [diaInicio, mesInicio, anoInicio] = dataInicio.split('/').map(Number);
        const [diaFim, mesFim, anoFim] = dataFim.split('/').map(Number);

        const dataInicioObj = new Date(anoInicio, mesInicio - 1, diaInicio, 0, 0, 0);
        const dataFimObj = new Date(anoFim, mesFim - 1, diaFim, 23, 59, 59);

        return dataAlerta >= dataInicioObj.getTime() && dataAlerta <= dataFimObj.getTime();
    }

    // Função para verificar se o texto contém o termo de pesquisa
    function contemTermo(texto, termo) {
        return texto.toString().toLowerCase().includes(termo.toLowerCase());
    }


    useEffect(() => {
        resgatarMotorista();
    }, [])

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
                            <h2>{motorista.nome}</h2>
                            <p><b>RFID n° </b>{motorista.cartao_rfid}</p>
                            {
                                !mostrarModalGerarRelatorio && (
                                    carregandoRelatorio ?
                                        (<img src={loadingGif} alt="" style={{ height: '30px' }} />) :
                                        (
                                            <div>
                                                <button className="botaoGerarRelatorio" onClick={() => { setMostrarModalGerarRelatorio(!mostrarModalGerarRelatorio) }}>
                                                    Gerar Relatório
                                                </button>
                                            </div>
                                        )
                                )
                            }
                        </div>
                        <button className='botaoFechar' onClick={() => setPaginaMotoristaInidividual(false)}>
                            <img className='botaofecharImg' src={fecharIcon} alt="" />
                        </button>
                    </div>
                    <div className='motoristaDemaisInformações'>

                        {mostrarModalGerarRelatorio &&
                            (
                                <div className='modalGerarRelatorio'>
                                    <p style={{ width: '100%', textAlign: 'center', fontSize: '14px' }}><b>Gerar Relatório</b></p>
                                    <label htmlFor="">
                                        <input type="radio" name="tipoRelatorio" value="resumido" id="" />Resumido <br />
                                        <input type="radio" name="tipoRelatorio" value="completo" defaultChecked id="" />Completo
                                    </label>
                                    <p>Defina limites ou deixe em branco para incluir todos os registros:</p>
                                    <div className='periodos'>
                                        <p>De:</p>
                                        <input
                                            type="text"
                                            placeholder="dd/mm/aaaa"
                                            id="relatorioDataInicio"
                                            className='inputFiltroMotorista'
                                        />

                                        <p>até:</p>
                                        <input
                                            type="text"
                                            placeholder="dd/mm/aaaa"
                                            id="relatorioDataFim"
                                            className='inputFiltroMotorista'
                                        />
                                    </div>

                                    {carregandoRelatorio ?
                                        <img src={loadingGif} alt="" style={{ height: '30px', objectFit: 'contain', marginTop: '10px' }} /> :
                                        <button
                                            className='botaoGerarRelatorio'
                                            onClick={() => {
                                                gerarRelatorioMotorista();
                                            }}
                                        >
                                            Gerar Relatório
                                        </button>
                                    }
                                    <button onClick={() => setMostrarModalGerarRelatorio(false)} className='botaoGerarRelatorioCancelar'>Cancelar</button>
                                </div>
                            )
                        }

                        <p> <b> Viagens: </b> {motorista.viagens.length}</p>
                        <input
                            type="text"
                            placeholder='Pesquise qualquer coisa'
                            className='inputPesquisaMotoristaIndividual'
                            value={pesquisaViagem}
                            onChange={e => setPesquisaViagem(e.target.value)}
                        />
                        <p>Pesquise por período:</p>
                        <div className='divFiltroMotoristaInidividual'>
                            <input
                                type="text"
                                placeholder='dd/mm/aaaa'
                                className='inputFiltroMotorista'
                                value={dataInicioViagem}
                                onChange={e => {
                                    const valor = e.target.value;
                                    let valorFormatado = valor.replace(/\D/g, '');
                                    if (valorFormatado.length > 2) {
                                        valorFormatado = valorFormatado.substring(0, 2) + '/' + valorFormatado.substring(2);
                                    }
                                    if (valorFormatado.length > 5) {
                                        valorFormatado = valorFormatado.substring(0, 5) + '/' + valorFormatado.substring(5, 9);
                                    }
                                    setDataInicioViagem(valorFormatado);
                                }}
                                maxLength={10}
                            />
                            <p>até</p>
                            <input
                                type="text"
                                placeholder='dd/mm/aaaa'
                                className='inputFiltroMotorista'
                                value={dataFimViagem}
                                onChange={e => {
                                    const valor = e.target.value;
                                    let valorFormatado = valor.replace(/\D/g, '');
                                    if (valorFormatado.length > 2) {
                                        valorFormatado = valorFormatado.substring(0, 2) + '/' + valorFormatado.substring(2);
                                    }
                                    if (valorFormatado.length > 5) {
                                        valorFormatado = valorFormatado.substring(0, 5) + '/' + valorFormatado.substring(5, 9);
                                    }
                                    setDataFimViagem(valorFormatado);
                                }}
                                maxLength={10}
                            />
                        </div>
                        <div className='divViagensMotorista'>
                            {[...motorista.viagens]
                                .filter(viagem => {
                                    const filtroData = dentroDoIntervalo(viagem.inicio, dataInicioViagem, dataFimViagem);

                                    const filtroTexto = !pesquisaViagem ||
                                        contemTermo(viagem.veiculo_modelo, pesquisaViagem) ||
                                        contemTermo(viagem.veiculo_identificador, pesquisaViagem) ||
                                        contemTermo(formatarDataHora(viagem.inicio), pesquisaViagem) ||
                                        contemTermo(formatarDataHora(viagem.fim), pesquisaViagem);

                                    return filtroData && filtroTexto;
                                })
                                .sort((a, b) => new Date(b.inicio) - new Date(a.inicio))
                                .map(viagem => {
                                    // Contar quantos alertas estão associados a esta viagem
                                    const quantidadeAlertas = motorista.alertas.filter(alerta =>
                                        alerta.viagem_id === viagem.id
                                    ).length;

                                    return (
                                        <div
                                            className={`viagemMotoristaItemLista ${viagemSelecionada?.id === viagem.id ? 'viagemSelecionada' : ''}`}
                                            key={viagem.id}
                                            onClick={() => {
                                                setViagemSelecionada(viagem);
                                                const alertaRelacionado = motorista.alertas.find(alerta => alerta.viagem_id === viagem.id);
                                                setAlertaSelecionado(alertaRelacionado || null);
                                            }}
                                        >
                                            <p><b>Início:</b> {formatarDataHora(viagem.inicio)}</p>
                                            <p><b>Fim:</b> {formatarDataHora(viagem.fim)}</p>
                                            <p><b>Veículo: </b>{viagem.veiculo_modelo} - {viagem.veiculo_identificador}</p>
                                            <p><b>Alertas: </b>{quantidadeAlertas}</p>
                                        </div>
                                    );
                                })
                            }
                        </div>

                        {!mostrarModalGerarRelatorio && (
                            <>
                                <p><b> Alertas: </b> {motorista.alertas.length}</p>
                                <input
                                    type="text"
                                    placeholder='Pesquise qualquer coisa'
                                    className='inputPesquisaMotoristaIndividual'
                                    value={pesquisaAlerta}
                                    onChange={e => setPesquisaAlerta(e.target.value)}
                                />
                                <p>Pesquise por período:</p>
                                <div className='divFiltroMotoristaInidividual'>
                                    <input
                                        type="text"
                                        placeholder='dd/mm/aaaa'
                                        className='inputFiltroMotorista'
                                        value={dataInicioAlerta}
                                        onChange={e => {
                                            const valor = e.target.value;
                                            let valorFormatado = valor.replace(/\D/g, '');
                                            if (valorFormatado.length > 2) {
                                                valorFormatado = valorFormatado.substring(0, 2) + '/' + valorFormatado.substring(2);
                                            }
                                            if (valorFormatado.length > 5) {
                                                valorFormatado = valorFormatado.substring(0, 5) + '/' + valorFormatado.substring(5, 9);
                                            }
                                            setDataInicioAlerta(valorFormatado);
                                        }}
                                        maxLength={10}
                                    />
                                    <p>até</p>
                                    <input
                                        type="text"
                                        placeholder='dd/mm/aaaa'
                                        className='inputFiltroMotorista'
                                        value={dataFimAlerta}
                                        onChange={e => {
                                            const valor = e.target.value;
                                            let valorFormatado = valor.replace(/\D/g, '');
                                            if (valorFormatado.length > 2) {
                                                valorFormatado = valorFormatado.substring(0, 2) + '/' + valorFormatado.substring(2);
                                            }
                                            if (valorFormatado.length > 5) {
                                                valorFormatado = valorFormatado.substring(0, 5) + '/' + valorFormatado.substring(5, 9);
                                            }
                                            setDataFimAlerta(valorFormatado);
                                        }}
                                        maxLength={10}
                                    />
                                </div>
                                <div className='divViagensMotorista'>
                                    {[...motorista.alertas]
                                        .filter(alerta => {
                                            const filtroData = dentroDoIntervalo(alerta.timestamp, dataInicioAlerta, dataFimAlerta);

                                            const filtroTexto = !pesquisaAlerta ||
                                                contemTermo(alerta.tipo, pesquisaAlerta) ||
                                                contemTermo(alerta.veiculo_modelo, pesquisaAlerta) ||
                                                contemTermo(alerta.veiculo_identificador, pesquisaAlerta) ||
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
                                                <p><b>Início: </b>{formatarDataHora(alerta.timestamp)}</p>
                                                <p><b>Veículo: </b>{alerta.veiculo_modelo} - {alerta.veiculo_identificador}</p>
                                            </div>
                                        ))}

                                </div>

                                <button
                                    className='botaoMostrarTodosOsAlertas'
                                    onClick={() => {
                                        setMostrarTodos(!mostrarTodos);
                                    }}
                                >
                                    {mostrarTodos ? 'Ocultar todos os alertas' : 'Mostrar todos os alertas'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
                <div id='motoristaIndividualPageDireita'>
                    <MapaMotoristaIndividual
                        motorista={motorista}
                        viagemSelecionada={viagemSelecionada}
                        alertaSelecionado={alertaSelecionado}
                        mostrarTodos={mostrarTodos}
                        setMostrarTodos={setMostrarTodos}
                    />
                    <div className="divAuxiliarSombra" style={{ width: '70%' }}></div>
                </div>
            </div>
        )
    }
}