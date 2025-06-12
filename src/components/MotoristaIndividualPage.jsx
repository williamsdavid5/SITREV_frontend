import { useEffect, useState } from 'react'
import './styles/motoristaIndividualPage.css'
import api from '../server/api';

import loadingGif from '../assets/loadingGif.gif';
import fecharIcon from '../assets/fecharIcon.png'

import MapaMotoristaIndividual from './MapaMotoristaIndividual';

export default function MotoristaIndividualPage({ motoristaId, setPaginaMotoristaInidividual }) {

    const [motorista, setMotorista] = useState();
    const [carregando, setCarregando] = useState(true);

    const [viagemSelecionada, setViagemSelecionada] = useState(null);
    const [alertaSelecionado, setAlertaSelecionado] = useState(null);

    const [mostrarTodos, setMostrarTodos] = useState(false);

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
                    <div className='topoMotoristaIndividual'>
                        <h1>{motorista.nome}</h1>
                        <button className='botaoFechar' onClick={() => setPaginaMotoristaInidividual(false)}>
                            <img className='botaofecharImg' src={fecharIcon} alt="" />
                        </button>
                    </div>
                    <div className='motoristaDemaisInformações'>
                        <p> <b> Viagens: </b> {motorista.viagens.length}</p>
                        <div className='divViagensMotorista'>
                            {[...motorista.viagens]
                                .sort((a, b) => new Date(b.inicio) - new Date(a.inicio))
                                .map(viagem => (
                                    <div
                                        className='viagemMotoristaItemLista'
                                        key={viagem.id}
                                        onClick={() => {
                                            setViagemSelecionada(viagem);
                                            setAlertaSelecionado(null);
                                        }}
                                    >
                                        <p>{formatarDataHora(viagem.inicio)}</p>
                                    </div>
                                ))}
                        </div>

                        <p><b> Alertas: </b> {motorista.alertas.length}</p>

                        <div className='divViagensMotorista'>
                            {[...motorista.alertas]
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
                                        <p>{formatarDataHora(alerta.timestamp)}</p>
                                    </div>
                                ))}
                        </div>

                        <button
                            className='botaoMostrarTodosOsAlertas'
                            onClick={() => {
                                setMostrarTodos(!mostrarTodos);
                            }}
                        >
                            {mostrarTodos ? 'Ocultar todos' : 'Mostrar todos'}
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
                </div>
            </div>
        )
    }
}