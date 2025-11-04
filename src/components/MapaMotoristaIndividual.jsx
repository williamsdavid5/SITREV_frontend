import { useEffect, useState } from 'react';
import {
    MapContainer,
    Marker,
    Popup,
    TileLayer,
    Polyline,
    Circle,
    useMap
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-polylinedecorator';
import { useMapEvent } from 'react-leaflet';
import pontoIcon from '../assets/pontoIcon.png'

import mapProviders from '../utils/mapProviders';
import veiculoIcon from '../assets/veiculoIcon.png';
import alertaIcon from '../assets/alertaIcon.png';
import startIcon from '../assets/startIcon.png';
import './styles/mapa.css';

const vehicleIcon = new L.Icon({
    iconUrl: veiculoIcon,
    iconSize: [40, 40],
    iconAnchor: [15, 15],
    className: 'iconeVeiculo'
});

const pontoPercursoIcon = new L.Icon({
    iconUrl: pontoIcon, // ou apenas um link direto
    iconSize: [35, 35], // tamanho do ícone
    iconAnchor: [15, 15], // ponto do ícone que estará na coordenada
    popupAnchor: [0, -15], // onde o popup abrirá em relação ao ícone
    className: 'pontoIcon' // opcional
});

const starPercursotIcon = new L.Icon({
    iconUrl: startIcon, // ou apenas um link direto
    iconSize: [35, 35], // tamanho do ícone
    iconAnchor: [15, 15], // ponto do ícone que estará na coordenada
    popupAnchor: [0, -15], // onde o popup abrirá em relação ao ícone
    className: 'startIcon' // opcional
});

function LinhaComSetas({ pontos }) {
    const map = useMap();

    useEffect(() => {
        if (!pontos || pontos.length < 2) return;

        // CORREÇÃO: os pontos já são arrays [lat, lng]
        const latlngs = pontos.map(p => [parseFloat(p[0]), parseFloat(p[1])]);

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

function LinhaComSetasVermelha({ pontos }) {
    const map = useMap();

    useEffect(() => {
        if (!pontos || pontos.length < 2) return;

        const latlngs = pontos.map(p => [parseFloat(p[0]), parseFloat(p[1])]);

        // Linha vermelha pontilhada
        const linha = L.polyline(latlngs, {
            color: '#ff0000',
            weight: 3,
            opacity: 0.7,
            dashArray: '6, 10'
        }).addTo(map);

        // Setas de direção vermelhas
        const decorator = L.polylineDecorator(linha, {
            patterns: [
                {
                    offset: 25,
                    repeat: 150,
                    symbol: L.Symbol.arrowHead({
                        pixelSize: 16,
                        polygon: true,
                        pathOptions: {
                            color: '#ff0000',
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

function CentralizarMapa({ coordenadas }) {
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

export default function MapaMotoristaIndividual({ motorista, viagemSelecionada, alertaSelecionado, setMostrarTodos, mostrarTodos }) {
    const [currentProvider, setCurrentProvider] = useState(mapProviders.default);
    const [posicaoAtual, setPosicaoAtual] = useState([-3.76, -49.67]);
    const [pontos, setPontos] = useState([]);

    //para encontrar a ultima posição do motorista
    useEffect(() => {
        if (motorista?.viagens?.length > 0) {
            const ultimaViagem = motorista.viagens[motorista.viagens.length - 1];
            if (ultimaViagem?.registros?.length > 0) {
                const ultimoRegistro = ultimaViagem.registros.at(-1);
                const coords = [
                    parseFloat(ultimoRegistro.latitude),
                    parseFloat(ultimoRegistro.longitude)
                ];
                setPosicaoAtual(coords);
            }
        }
    }, [motorista]);

    //para detectar seleção de viagem
    useEffect(() => {
        if (viagemSelecionada?.registros?.length > 0) {
            const ultimo = viagemSelecionada.registros.at(-1);
            const coords = [
                parseFloat(ultimo.latitude),
                parseFloat(ultimo.longitude)
            ];
            setPosicaoAtual(coords);

            const caminho = viagemSelecionada.registros.map(p =>
                [parseFloat(p.latitude), parseFloat(p.longitude)]
            );
            setPontos(caminho);
        }
    }, [viagemSelecionada]);

    //para mostrar todos os alertas
    //para mostrar todos os alertas
    useEffect(() => {
        if (
            !mostrarTodos &&
            !viagemSelecionada &&
            alertaSelecionado?.registroCoordenadas?.length > 0
        ) {
            setPontos([]);
            const primeira = alertaSelecionado.registroCoordenadas[0];
            const novaPosicao = [parseFloat(primeira.latitude), parseFloat(primeira.longitude)];

            // Só atualiza se a posição for diferente da atual
            if (novaPosicao[0] !== posicaoAtual[0] || novaPosicao[1] !== posicaoAtual[1]) {
                setPosicaoAtual(novaPosicao);
            }
        }
    }, [alertaSelecionado, mostrarTodos, viagemSelecionada, posicaoAtual]);


    return (
        <div className='mapaPercurso'>
            <MapContainer center={posicaoAtual} zoom={16} style={{ height: '100vh', width: '100%' }}>
                <TileLayer
                    key={currentProvider}
                    url={mapProviders[currentProvider].url}
                    maxZoom={mapProviders[currentProvider].maxZoom}
                    attribution={mapProviders[currentProvider].attribution}
                />

                <CentralizarMapa coordenadas={posicaoAtual} />

                {viagemSelecionada && (
                    <Marker position={posicaoAtual} icon={vehicleIcon}>
                        <Popup>
                            <div>
                                <p style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 'bold' }}>
                                    🚗 {motorista.nome}
                                </p>

                                <div style={{ marginBottom: '10px' }}>
                                    <p style={{ margin: '2px 0' }}><b>Veículo:</b> {viagemSelecionada.veiculo_modelo} - {viagemSelecionada.veiculo_identificador}</p>
                                    <p style={{ margin: '2px 0' }}><b>RFID:</b> {motorista.cartao_rfid}</p>
                                    {/* <p style={{ margin: '2px 0' }}><b>Status:</b> Viagem em andamento</p> */}
                                </div>

                                <div style={{ marginBottom: '10px', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                                    <p style={{ margin: '2px 0', fontSize: '14px' }}><b>Última atualização:</b></p>
                                    <p style={{ margin: '2px 0', fontSize: '14px' }}>
                                        {viagemSelecionada.registros?.at(-1)?.timestamp ?
                                            new Date(viagemSelecionada.registros.at(-1).timestamp).toLocaleString('pt-BR', {
                                                timeZone: 'UTC',
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            }) : 'N/A'}
                                    </p>
                                </div>

                                {/* {viagemSelecionada.registros?.at(-1) && (
                                    <div style={{ marginBottom: '10px' }}>
                                        <p style={{ margin: '2px 0' }}><b>Velocidade:</b> {parseFloat(viagemSelecionada.registros.at(-1).velocidade || 0).toFixed(1)} km/h</p>
                                        <p style={{ margin: '2px 0' }}><b>Limite:</b> {parseFloat(viagemSelecionada.registros.at(-1).limite_aplicado || 0).toFixed(1)} km/h</p>
                                        <p style={{ margin: '2px 0' }}>
                                            <b>Chuva:</b> {viagemSelecionada.registros.at(-1).chuva ? '🌧️ Detectada' : '☀️ Não detectada'}
                                        </p>
                                    </div>
                                )} */}

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    <button
                                        className='botaoPopUpMapa'
                                        onClick={() => {
                                            const [lat, lng] = posicaoAtual;
                                            compartilharLocalizacao(lat, lng);
                                        }}
                                    >
                                        Compartilhar localização
                                    </button>
                                    <button
                                        className='botaoPopUpMapa'
                                        onClick={() => {
                                            const [lat, lng] = posicaoAtual;
                                            abrirNoMaps(lat, lng);
                                        }}
                                    >
                                        Abrir no Google Maps
                                    </button>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                )}

                {/* Pontos e setas do percurso */}
                {/* Pontos e setas do percurso */}
                {pontos.length > 0 && (
                    <>
                        {/* Marcadores individuais dos pontos */}
                        {pontos.map((ponto, index) => {
                            const [lat, lng] = ponto;
                            const registro = viagemSelecionada?.registros[index];
                            const isPontoAlerta = motorista?.alertas?.some(alerta =>
                                alerta.registroCoordenadas?.some(coord =>
                                    coord.latitude === registro?.latitude &&
                                    coord.longitude === registro?.longitude
                                )
                            );

                            // Define o ícone baseado no índice e se é alerta
                            let iconToUse;
                            if (isPontoAlerta) {
                                iconToUse = L.icon({
                                    iconUrl: alertaIcon,
                                    iconSize: [30, 30],
                                    iconAnchor: [15, 15],
                                    className: 'iconeAlerta'
                                });
                            } else if (index === 0) {
                                // Primeiro ponto usa ícone de start
                                iconToUse = starPercursotIcon;
                            } else {
                                // Demais pontos usam ícone normal
                                iconToUse = pontoPercursoIcon;
                            }

                            return (
                                <Marker key={index} position={[lat, lng]} icon={iconToUse}>
                                    <Popup>
                                        <div>
                                            {isPontoAlerta && (
                                                <>
                                                    <b style={{ color: 'red' }}>PONTO DE ALERTA</b><br />
                                                </>
                                            )}
                                            {index === 0 && !isPontoAlerta && (
                                                <>
                                                    <b style={{ color: 'green' }}>INÍCIO DO PERCURSO</b><br />
                                                </>
                                            )}
                                            <b>Velocidade:</b> {registro?.velocidade || '0.00'} km/h<br />
                                            <b>Limite:</b> {registro?.limite_aplicado || '0.00'} km/h<br />
                                            <b>Horário:</b> {registro?.timestamp ?
                                                new Date(registro.timestamp).toLocaleString('pt-BR', {
                                                    timeZone: 'UTC'
                                                }) : 'N/A'}
                                            <button
                                                className='botaoPopUpMapa'
                                                onClick={() => {
                                                    // const [lat, lng] = position;
                                                    compartilharLocalizacao(lat, lng);
                                                }}
                                            >
                                                Compartilhar localização
                                            </button>
                                            <button
                                                className='botaoPopUpMapa'
                                                onClick={() => {
                                                    // const [lat, lng] = position;
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
                        <LinhaComSetas pontos={pontos} />
                    </>
                )}


                {(mostrarTodos ? motorista.alertas : [alertaSelecionado])
                    ?.filter(alerta => alerta?.registroCoordenadas?.length > 0)
                    .map((alerta, index) => {
                        const pontosAlerta = alerta.registroCoordenadas.map(coord =>
                            [parseFloat(coord.latitude), parseFloat(coord.longitude)]
                        );

                        return (
                            <div key={index}>
                                {alerta.registroCoordenadas.map((coord, i) => (
                                    <Marker
                                        key={i}
                                        position={[parseFloat(coord.latitude), parseFloat(coord.longitude)]}
                                        icon={L.icon({
                                            iconUrl: alertaIcon,
                                            iconSize: [30, 30],
                                            iconAnchor: [15, 15],
                                            className: 'iconeAlerta'
                                        })}
                                    >
                                        <Popup>
                                            <b>Alerta:</b> {alerta.descricao}<br />
                                            <b>Velocidade:</b> {coord.velocidade} km/h<br />
                                            <b>Limite no local: </b> {coord.limite_aplicado} km/h<br />
                                            <b>Momento da ocorrência:</b> {new Date(coord.timestamp).toLocaleString('pt-BR', {
                                                timeZone: 'UTC'
                                            })}
                                            <button
                                                className='botaoPopUpMapa'
                                                onClick={() => {
                                                    // const [lat, lng] = position;
                                                    const lat = parseFloat(registro.latitude);
                                                    const lng = parseFloat(registro.longitude);
                                                    compartilharLocalizacao(lat, lng);
                                                }}
                                            >
                                                Compartilhar localização
                                            </button>
                                            <button
                                                className='botaoPopUpMapa'
                                                onClick={() => {
                                                    // const [lat, lng] = position;
                                                    const lat = parseFloat(registro.latitude);
                                                    const lng = parseFloat(registro.longitude);
                                                    abrirNoMaps(lat, lng);
                                                }}
                                            >
                                                Google Maps
                                            </button>
                                        </Popup>
                                    </Marker>
                                ))}

                                {alerta.registroCoordenadas.length > 1 && (
                                    <LinhaComSetasVermelha pontos={pontosAlerta} />
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
            </div>
        </div>
    );
}
