import { useEffect, useState } from 'react';
import {
    MapContainer,
    Marker,
    Popup,
    TileLayer,
    Polyline,
    useMap
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import mapProviders from '../utils/mapProviders';
import veiculoIcon from '../assets/veiculoIcon.png';
import alertaIcon from '../assets/alertaIcon.png';
import './styles/mapa.css';
import api from '../server/api';

import loadingGif from '../assets/loadingGif.gif'

import 'leaflet-polylinedecorator';
import startIcon from '../assets/startIcon.png';
import pontoIcon from '../assets/pontoIcon.png';

const vehicleIcon = new L.Icon({
    iconUrl: veiculoIcon,
    iconSize: [40, 40],
    iconAnchor: [15, 15],
    className: 'iconeVeiculo'
});

const alertaIconLeaflet = new L.Icon({
    iconUrl: alertaIcon,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    className: 'iconeAlerta'
});

const starPercursotIcon = new L.Icon({
    iconUrl: startIcon,
    iconSize: [35, 35],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
    className: 'startIcon'
});

const pontoPercursoIcon = new L.Icon({
    iconUrl: pontoIcon,
    iconSize: [35, 35],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
    className: 'pontoIcon'
});

function LinhaComSetas({ pontos }) {
    const map = useMap();

    useEffect(() => {
        if (!pontos || pontos.length < 2) return;

        const latlngs = pontos.map(p => [parseFloat(p.latitude), parseFloat(p.longitude)]);

        // Linha pontilhada
        const linha = L.polyline(latlngs, {
            color: '#007bff',
            weight: 3,
            opacity: 0.7,
            dashArray: '6, 10'
        }).addTo(map);

        // Setas de direção
        const decorator = L.polylineDecorator(linha, {
            patterns: [
                {
                    offset: 25,
                    repeat: 150,
                    symbol: L.Symbol.arrowHead({
                        pixelSize: 16,
                        polygon: true,
                        pathOptions: {
                            color: '#007bff',
                            fillOpacity: 1,
                            weight: 1,
                            opacity: 0.9
                        }
                    })
                }
            ]
        }).addTo(map);

        return () => {
            map.removeLayer(linha);
            map.removeLayer(decorator);
        };
    }, [map, pontos]);

    return null;
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

function Centralizar({ coordenadas }) {
    const map = useMap();
    useEffect(() => {
        if (coordenadas) {
            map.setView(coordenadas, 16);
        }
    }, [coordenadas]);
    return null;
}

function abrirNoMaps(lat, lng) {
    if (!lat || !lng) {
        console.warn("Coordenadas inválidas para compartilhamento.");
        return;
    }

    const url = `https://www.google.com/maps?q=${lat},${lng}`;

    // se estiver em um dispositivo mobile, tenta abrir o app do Maps
    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
    const link = isMobile ? `geo:${lat},${lng}?q=${lat},${lng}` : url;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(url)}`;

    window.open(link, "_blank");
}

async function compartilharLocalizacao(lat, lng) {
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    const mensagem = `Veja minha localização: ${url}`;

    if (navigator.share) {
        try {
            await navigator.share({
                title: "Minha localização",
                text: mensagem,
                url,
            });
        } catch (err) {
            console.error("Erro ao compartilhar:", err);
        }
    } else {
        // fallback: abre WhatsApp
        const linkWhatsapp = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
        window.open(linkWhatsapp, "_blank");
    }
}

export default function MapaPercursoSelecionado({ viagemId, carregandoRegistros, setCarregandoRegistros }) {
    const [provider, setProvider] = useState(mapProviders.default);
    const [posicaoAtual, setPosicaoAtual] = useState([-3.76, -49.67]);
    const [registro, setRegistro] = useState(null);

    useEffect(() => {
        async function resgatarViagem(id) {
            if (!id) return;

            try {
                const resposta = await api.get(`/viagens/${id}`);
                setRegistro(resposta.data);

                setCarregandoRegistros(false);
            } catch (err) {
                console.log('Erro ao resgatar viagem:', err);
                alert('Erro ao resgatar viagem');
                setcarregando(false);
            }
        }

        if (viagemId) {
            resgatarViagem(viagemId);
        }

    }, [viagemId]);

    useEffect(() => {
        if (registro?.registros?.length > 0) {
            const ultimo = registro.registros.at(-1);
            const coords = [parseFloat(ultimo.latitude), parseFloat(ultimo.longitude)];
            setPosicaoAtual(coords);

        }
    }, [registro]);

    return (
        <div className="mapaPercurso">
            <MapContainer center={posicaoAtual} zoom={16} style={{ height: '100vh', width: '100%' }}>
                <TileLayer
                    key={provider}
                    url={mapProviders[provider].url}
                    maxZoom={mapProviders[provider].maxZoom}
                    attribution={mapProviders[provider].attribution}
                />
                <Centralizar coordenadas={posicaoAtual} />

                {registro?.registros?.length > 0 && (() => {
                    const pontosFiltrados = registro.registros.filter(p => p.latitude && p.longitude);

                    return (
                        <>
                            {/* Marcadores para cada ponto do percurso */}
                            {pontosFiltrados.map((ponto, index) => {
                                const position = [parseFloat(ponto.latitude), parseFloat(ponto.longitude)];
                                const horario = formatarDataHora(ponto.timestamp);

                                // Verifica se há alerta neste ponto
                                const temAlerta = registro.alertas?.some(alerta =>
                                    alerta.registros?.some(r => r.id === ponto.id)
                                );

                                // Define o ícone baseado no tipo de ponto
                                const iconToUse = temAlerta
                                    ? alertaIconLeaflet
                                    : (index === 0 ? starPercursotIcon : pontoPercursoIcon);

                                return (
                                    <Marker key={ponto.id || index} position={position} icon={iconToUse}>
                                        <Popup>
                                            <div>
                                                {temAlerta && (
                                                    <>
                                                        <b style={{ color: 'red' }}>ALERTA DETECTADO</b><br />
                                                    </>
                                                )}
                                                {index === 0 && !temAlerta && (
                                                    <>
                                                        <b style={{ color: 'green' }}>📍 INÍCIO DO PERCURSO</b><br />
                                                    </>
                                                )}
                                                <b>Velocidade:</b> {parseFloat(ponto.velocidade || 0).toFixed(1)} km/h<br />
                                                <b>Limite:</b> {parseFloat(ponto.limite_aplicado || 0).toFixed(1)} km/h<br />
                                                <b>Horário:</b> {horario}<br />
                                                {ponto.chuva ? '🌧️ Chuva detectada' : '☀️ Tempo seco'}
                                                <button
                                                    className='botaoPopUpMapa'
                                                    onClick={() => {
                                                        const [lat, lng] = position;
                                                        compartilharLocalizacao(lat, lng);
                                                    }}
                                                >
                                                    Compartilhar localização
                                                </button>
                                                <button
                                                    className='botaoPopUpMapa'
                                                    onClick={() => {
                                                        const [lat, lng] = position;
                                                        abrirNoMaps(lat, lng);
                                                    }}
                                                >
                                                    Google Maps
                                                </button>
                                            </div>
                                        </Popup>
                                    </Marker>
                                );
                            })}

                            {/* Linha com setas indicando direção */}
                            <LinhaComSetas pontos={pontosFiltrados} />

                            {/* Ícone do veículo no último ponto (APENAS ESTE MARCADOR) */}
                            {/* Ícone do veículo no último ponto (APENAS ESTE MARCADOR) */}
                            {pontosFiltrados.length > 0 && (
                                <Marker
                                    position={[
                                        parseFloat(pontosFiltrados[pontosFiltrados.length - 1].latitude),
                                        parseFloat(pontosFiltrados[pontosFiltrados.length - 1].longitude)
                                    ]}
                                    icon={vehicleIcon}
                                >
                                    <Popup>
                                        <div>
                                            <b>🚗 VEÍCULO</b><br />
                                            <b>Posição atual do veículo</b><br />
                                            <b>Motorista:</b> {registro?.nome_motorista || 'Não informado'}<br />
                                            <b>Veículo:</b> {registro?.modelo_veiculo || 'Não informado'} - {registro?.identificador_veiculo || 'Não informado'}<br />
                                            <b>Última atualização:</b> {formatarDataHora(pontosFiltrados[pontosFiltrados.length - 1].timestamp)}
                                            <button
                                                className='botaoPopUpMapa'
                                                onClick={() => {
                                                    const lat = parseFloat(pontosFiltrados[pontosFiltrados.length - 1].latitude);
                                                    const lng = parseFloat(pontosFiltrados[pontosFiltrados.length - 1].longitude);
                                                    // const [lat, lng] = position;
                                                    compartilharLocalizacao(lat, lng);
                                                }}
                                            >
                                                Compartilhar localização
                                            </button>
                                            <button
                                                className='botaoPopUpMapa'
                                                onClick={() => {
                                                    const lat = parseFloat(pontosFiltrados[pontosFiltrados.length - 1].latitude);
                                                    const lng = parseFloat(pontosFiltrados[pontosFiltrados.length - 1].longitude);
                                                    abrirNoMaps(lat, lng);
                                                }}
                                            >
                                                Google Maps
                                            </button>
                                        </div>
                                    </Popup>
                                </Marker>
                            )}
                        </>
                    );
                })()}

                {registro?.alertas?.length > 0 && registro.alertas.map((alerta, index) => {
                    const pontosAlerta = alerta.registros?.map(r => [parseFloat(r.latitude), parseFloat(r.longitude)]);

                    return (
                        <div key={index}>
                            {/* Linha vermelha para alertas */}
                            {pontosAlerta?.length > 1 && (
                                <Polyline
                                    positions={pontosAlerta}
                                    color="red"
                                    weight={4}
                                    opacity={0.8}
                                />
                            )}
                        </div>
                    );
                })}

            </MapContainer>



            <div className='janelaProviders'>
                {/* select do provider */}
                <p className='pJanelaProviders'>Estilo de mapa:</p>
                <select
                    name="providerSelect"
                    id="providerSelect"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
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
            </div>

            {carregandoRegistros && (
                <div className='divCarregando'>
                    <img src={loadingGif} alt="" />
                    <p> <b>Carregando dados, aguarde...</b> </p>
                </div>
            )}
        </div>
    );
}
