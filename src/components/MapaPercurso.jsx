import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import './styles/mapa.css';

import { useEffect, useState } from 'react';

import { MapContainer, Marker, Popup, TileLayer, useMap, Polyline, Polygon, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw';

import api from '../server/api'; //logica de conexão com a API
import mapProviders from '../utils/mapProviders'; //providers para alterar a visualização do mapa

//icones personalizados
import veiculoIcon from '../assets/veiculoIcon.png';
import veiculoIconSelecionado from '../assets/veiculoIconSelecionado.png'
import loadingGif from '../assets/loadingGif.gif'

//icon personalizado do veiculo
const vehicleIcon = new L.Icon({
    iconUrl: veiculoIcon,
    iconSize: [40, 40],
    iconAnchor: [15, 15],
    className: 'iconeVeiculo'
});

const vehicleIconSelecionado = new L.Icon({
    iconUrl: veiculoIconSelecionado,
    iconSize: [40, 40],
    iconAnchor: [15, 15],
    className: 'iconeVeiculo'
});

//o mapa percurso oferece uma visualização por veiculo, util para atualizar em tempo real
//é usado na tela inicial para servir apenas como monitoramento
//é usado na tela de motoristas para que o usuário possa localiza-los com facilidade
export default function MapaPercurso({
    motoristaSelecionado,
    setMotoristaSelecionado,
    mostrarPaginaMotoristaIndividual,
    centralizarProximoMotorista
}) {
    const [currentProvider, setCurrentProvider] = useState(mapProviders.default); //o provider que está sendo usado
    //para armazenar os dados coletados da API
    const [cercas, setCercas] = useState([]);
    const [viagens, setViagens] = useState([]);
    //para mostrar o percurso do veiculo selecionado no mapa
    const [viagemSelecionada, setVIagemSelecionada] = useState(null);
    //para a tela de loading ser mostrada enquanto os dados são carregados
    const [carregando, setCarregando] = useState(false);

    // const centralizarProximoMotorista = useRef(true); //para a logica de centralização, impede que o mapa centralize o percurso ao selecionar no mapa em vez da lista

    // para resgatar cercas obviamente
    async function resgatarCercas() {
        try {
            setCarregando(true);
            const cercas = await api.get('/cercas');
            setCercas(cercas.data);
            setCarregando(false);
        } catch (err) {
            console.log(err);
            alert('Erro ao resgatar ou desenhar cercas');
            setCarregando(false);
        }
    }

    // para resgatar veiculos e seus viagens
    //as viagens estão vindo em anexo em cada veiculo no json recebido
    async function resgatarVeiculosRegistro() {
        try {
            const resposta = await api.get('/veiculos/registros');
            setViagens(resposta.data);
        } catch (err) {
            console.log('Erro ao resgatar viagens: ', err);
            alert('Erro ao resgatar viagens');
        }
    }

    // para centralizar os motoristas selecionados no mapa
    //a flag centralizarProximoMotorista define se deve ou não centralizar o marcador do veiculo no mapa
    //ao clicar no marcador no mapa, ele mesmo torna a flag falsa para impedir a centralização
    //mas ao clicar no item na lista lateral, essa função é chamada onde as coordenadas do motorista são coletadas ao mesmo tempo que
    //a flag muda para true, assim o marcador do veiculo é sim centralizado
    function CentralizarMapa({ coordenadas }) {
        const map = useMap();

        useEffect(() => {
            if (coordenadas && centralizarProximoMotorista.current) {
                map.setView(coordenadas, 17);
            }
            centralizarProximoMotorista.current = true;
        }, [coordenadas]);

        return null;
    }

    //se houver um motorista selecionado, ele sera armazenado aqui
    const motoristaSelecionadoObj = motoristaSelecionado
        ? viagens.find(v => v.viagem.motorista.id === motoristaSelecionado)
        : null;

    //mesma logica de cima, porém para posições
    //isso é usado para a logica de centralizar no mapa
    const posicaoMotoristaSelecionado =
        motoristaSelecionadoObj && motoristaSelecionadoObj.viagem.registros.length > 0
            ? [
                parseFloat(motoristaSelecionadoObj.viagem.registros.at(-1).latitude),
                parseFloat(motoristaSelecionadoObj.viagem.registros.at(-1).longitude)
            ]
            : null;

    //para resgatar os dados imediatamente ao entrar na pagina
    useEffect(() => {
        resgatarCercas();
        resgatarVeiculosRegistro();
    }, [])

    return (
        <div className='mapaPercurso'>
            {/* container do mapa */}
            <MapContainer center={[-3.76, -49.67]} zoom={15} style={{ height: '100vh', width: '100%' }}>
                {/* responsavel por controlar a visualização/provider */}
                <TileLayer
                    key={currentProvider}
                    url={mapProviders[currentProvider].url}
                    maxZoom={mapProviders[currentProvider].maxZoom}
                    attribution={mapProviders[currentProvider].attribution}
                />

                {/* logica de centralizar no mapa */}
                {posicaoMotoristaSelecionado && centralizarProximoMotorista.current && (
                    <CentralizarMapa coordenadas={posicaoMotoristaSelecionado} />
                )}

                {/* desenha as cercas */}
                {cercas.map((cerca) => {
                    const coordenadas = cerca.coordenadas.map(coord => [parseFloat(coord[0]), parseFloat(coord[1])]);

                    return (
                        <Polygon
                            key={cerca.id}
                            positions={coordenadas}
                            pathOptions={{ color: cerca.cor }}
                        >
                            <Popup>
                                Cerca: <strong>{cerca.nome}</strong><br />
                                <b>Camada:</b> {cerca.camada.nome} <br />
                                <b>Tipo:</b> {cerca.tipo}<br />
                            </Popup>
                        </Polygon>
                    );
                })}

                {/* para desenhar os marcadores dos veiculos no mapa */}
                {viagens && Array.isArray(viagens) ? viagens.map((veiculo) => {
                    const viagem = veiculo.viagem;
                    if (!viagem || !viagem.registros || viagem.registros.length === 0) return null;

                    const ultimoPonto = viagem.registros[viagem.registros.length - 1];

                    const dataObj = new Date(ultimoPonto.timestamp);
                    const dataFormatada = dataObj.toLocaleDateString("pt-BR", {
                        timeZone: "America/Sao_Paulo",
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                    });
                    const horaFormatada = dataObj.toLocaleTimeString("pt-BR", {
                        timeZone: "America/Sao_Paulo",
                        hour: "2-digit",
                        minute: "2-digit",
                    });
                    const ultimoHorario = `${horaFormatada}, ${dataFormatada}`;
                    const position = [parseFloat(ultimoPonto.latitude), parseFloat(ultimoPonto.longitude)];

                    if (!position[0] || !position[1]) return null;

                    return (
                        <Marker
                            key={veiculo.id}
                            position={position}
                            icon={motoristaSelecionado === viagem.motorista.id ? vehicleIconSelecionado : vehicleIcon}
                            eventHandlers={{
                                click: () => {
                                    centralizarProximoMotorista.current = false;
                                    setVIagemSelecionada(viagem.id === viagemSelecionada ? null : viagem.id);
                                    setMotoristaSelecionado(viagem.motorista.id);
                                }
                            }}

                        >
                            <Popup>
                                <div>
                                    <b>Veículo: {veiculo.identificador}</b><br />
                                    <b>Motorista:</b> {viagem.motorista.nome}<br />
                                    Última leitura às <b>{ultimoHorario}</b><br />
                                    <button
                                        className='botaoPopUpMapa'
                                        onClick={() => mostrarPaginaMotoristaIndividual(viagem.motorista.id)}
                                    >
                                        Ver mais
                                    </button>

                                </div>
                            </Popup>
                        </Marker>
                    );
                }) : null}

                {/* se um veiculo for selecionado, será desenhado também o percurso */}
                {viagemSelecionada && (() => {
                    const veiculoComViagem = viagens.find(v => v.viagem.id === viagemSelecionada);
                    if (!veiculoComViagem) return null;

                    const pontos = veiculoComViagem.viagem.registros.map(p =>
                        [parseFloat(p.latitude), parseFloat(p.longitude)]
                    );

                    return (
                        <Polyline positions={pontos} color="blue" />
                    );
                })()}

            </MapContainer>

            {/* select do provider */}
            <select
                name="providerSelect"
                id="providerSelect"
                value={currentProvider}
                onChange={(e) => setCurrentProvider(e.target.value)}
                className="map-provider-select"
            >
                {Object.entries(mapProviders)
                    .filter(([id]) => id !== 'default')
                    .map(([id, provider]) => (
                        <option key={id} value={id}>
                            {provider.name}
                        </option>
                    ))}
            </select>

            {carregando && (
                <div className='divCarregando'>
                    <img src={loadingGif} alt="" />
                    <p> <b>Carregando dados, aguarde...</b> </p>
                </div>
            )}
        </div>
    )
}