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

const identificarPontosComAlerta = (viagem) => {
    if (!viagem?.registros) return new Set();

    const pontosComAlerta = new Set();

    motorista?.alertas?.forEach(alerta => {
        alerta.registroCoordenadas?.forEach(coord => {
            viagem.registros.forEach((registro, index) => {
                if (registro.latitude === coord.latitude &&
                    registro.longitude === coord.longitude &&
                    registro.timestamp === coord.timestamp) {
                    pontosComAlerta.add(index);
                }
            });
        });
    });

    return pontosComAlerta;
};

function CentralizarMapa({ coordenadas }) {
    const map = useMap();

    useEffect(() => {
        if (coordenadas) {
            map.setView(coordenadas, 16);
        }
    }, [coordenadas]);

    return null;
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
                        <Popup>Última posição de {motorista.nome}</Popup>
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
