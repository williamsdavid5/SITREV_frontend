import { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap, Polyline, Polygon, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import { useRef } from 'react';
import api from '../server/api';
import './styles/mapa.css';
import veiculoIcon from '../assets/veiculoIcon.png';
import veiculoIconSelecionado from '../assets/veiculoIconSelecionado.png'
import mapProviders from '../utils/mapProviders';
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

export default function MapaPercurso({
    motoristaSelecionado,
    setMotoristaSelecionado,
    mostrarPaginaMotoristaIndividual,
    centralizarProximoMotorista
}) {
    const [currentProvider, setCurrentProvider] = useState('openstreetmap');
    const [cercas, setCercas] = useState([]);
    const [viagens, setViagens] = useState([]);
    const [viagemSelecionada, setVIagemSelecionada] = useState(null);
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
    function CentralizarMapa({ coordenadas }) {
        const map = useMap();

        useEffect(() => {
            if (coordenadas && centralizarProximoMotorista.current) {
                map.setView(coordenadas, 17);
            }
            centralizarProximoMotorista.current = true; // sempre reseta para o próximo clique na lista
        }, [coordenadas]);

        return null;
    }


    const motoristaSelecionadoObj = motoristaSelecionado
        ? viagens.find(v => v.viagem.motorista.id === motoristaSelecionado)
        : null;

    const posicaoMotoristaSelecionado =
        motoristaSelecionadoObj && motoristaSelecionadoObj.viagem.registros.length > 0
            ? [
                parseFloat(motoristaSelecionadoObj.viagem.registros.at(-1).latitude),
                parseFloat(motoristaSelecionadoObj.viagem.registros.at(-1).longitude)
            ]
            : null;


    useEffect(() => {
        resgatarCercas();
        resgatarVeiculosRegistro();
    }, [])

    return (
        <div className='mapaPercurso'>
            <MapContainer center={[-3.76, -49.67]} zoom={15} style={{ height: '100vh', width: '100%' }}>
                <TileLayer
                    key={currentProvider}
                    url={mapProviders[currentProvider].url}
                    maxZoom={mapProviders[currentProvider].maxZoom}
                    attribution={mapProviders[currentProvider].attribution}
                />

                {posicaoMotoristaSelecionado && centralizarProximoMotorista.current && (
                    <CentralizarMapa coordenadas={posicaoMotoristaSelecionado} />
                )}


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

            <select
                name="providerSelect"
                id="providerSelect"
                value={currentProvider}
                onChange={(e) => setCurrentProvider(e.target.value)}
                className="map-provider-select"
            >
                {Object.entries(mapProviders).map(([id, provider]) => (
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