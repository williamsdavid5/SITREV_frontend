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

    //caso o usuario selecione uma viagem ou alerta na lista ou mapa
    const [viagemSelecionada, setViagemSelecionada] = useState(null);
    const [alertaSelecionado, setAlertaSelecionado] = useState(null);

    const [mostrarTodos, setMostrarTodos] = useState(false); //para mostrar todos os alertas no mapa ao mesmo tempo

    //os filtros para a pesquisa
    const [filtroViagemDia, setFiltroViagemDia] = useState('');
    const [filtroViagemMes, setFiltroViagemMes] = useState('');
    const [filtroAlertaDia, setFiltroAlertaDia] = useState('');
    const [filtroAlertaMes, setFiltroAlertaMes] = useState('');

    // Estados para pesquisa textual
    const [pesquisaViagem, setPesquisaViagem] = useState('');
    const [pesquisaAlerta, setPesquisaAlerta] = useState('');


    //a função que se comunica com a API
    async function resgatarMotorista() {
        try {
            let resposta = await api.get(`motoristas/${motoristaId}`);
            setMotorista(resposta.data);
            setCarregando(false);
        } catch (err) {
            console.log('erro ao resgatar motorista individual ', err);
            alert('Erro ao resgatar motorista individual');
            setCarregando(false);
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
                        <h2>{motorista.nome}</h2>
                        <button className='botaoFechar' onClick={() => setPaginaMotoristaInidividual(false)}>
                            <img className='botaofecharImg' src={fecharIcon} alt="" />
                        </button>
                    </div>
                    <div className='motoristaDemaisInformações'>
                        <p> <b> Viagens: </b> {motorista.viagens.length}</p>
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
                            {[...motorista.viagens]
                                .filter(viagem => {
                                    const data = new Date(viagem.inicio);
                                    const dia = String(data.getUTCDate());
                                    const mes = String(data.getUTCMonth() + 1);

                                    const filtroData = (!filtroViagemDia || Number(dia) === Number(filtroViagemDia)) &&
                                        (!filtroViagemMes || Number(mes) === Number(filtroViagemMes));

                                    // Filtro por pesquisa textual
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
                                            className='viagemMotoristaItemLista'
                                            key={viagem.id}
                                            onClick={() => {
                                                setViagemSelecionada(viagem);
                                                console.log(motorista);
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
                                })}
                        </div>

                        <p><b> Alertas: </b> {motorista.alertas.length}</p>
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
                            {[...motorista.alertas]
                                .filter(alerta => {
                                    const data = new Date(alerta.timestamp);
                                    const dia = String(data.getUTCDate());
                                    const mes = String(data.getUTCMonth() + 1);

                                    const filtroData = (!filtroAlertaDia || Number(dia) === Number(filtroAlertaDia)) &&
                                        (!filtroAlertaMes || Number(mes) === Number(filtroAlertaMes));

                                    // Filtro por pesquisa textual
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
                                        className='viagemMotoristaItemLista'
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