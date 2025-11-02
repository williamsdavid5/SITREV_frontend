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
import 'leaflet-polylinedecorator';
import mapProviders from '../utils/mapProviders';
import veiculoIcon from '../assets/veiculoIcon.png';
import alertaIcon from '../assets/alertaIcon.png';
import startIcon from '../assets/startIcon.png';
import pontoIcon from '../assets/pontoIcon.png';
import './styles/mapa.css';

const vehicleIcon = new L.Icon({
    iconUrl: veiculoIcon,
    iconSize: [40, 40],
    iconAnchor: [15, 15],
    className: 'iconeVeiculo'
});

const pontoPercursoIcon = new L.Icon({
    iconUrl: pontoIcon,
    iconSize: [35, 35],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
    className: 'pontoIcon'
});

const starPercursotIcon = new L.Icon({
    iconUrl: startIcon,
    iconSize: [35, 35],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
    className: 'startIcon'
});

const alertaIconLeaflet = new L.Icon({
    iconUrl: alertaIcon,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    className: 'iconeAlerta'
});

function LinhaComSetas({ pontos }) {
    const map = useMap();

    useEffect(() => {
        if (!pontos || pontos.length < 2) return;

        const latlngs = pontos.map(p => [parseFloat(p[0]), parseFloat(p[1])]);

        const linha = L.polyline(latlngs, {
            color: '#007bff',
            weight: 3,
            opacity: 0.7,
            dashArray: '6, 10'
        }).addTo(map);

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

        const linha = L.polyline(latlngs, {
            color: '#ff0000',
            weight: 3,
            opacity: 0.7,
            dashArray: '6, 10'
        }).addTo(map);

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

// Função para verificar se um ponto tem alerta por excesso de velocidade
function pontoTemAlerta(registro) {
    if (!registro) return false;
    const velocidade = parseFloat(registro.velocidade) || 0;
    const limite = parseFloat(registro.limite_aplicado) || 0;
    return velocidade > limite;
}

// Função para formatar data e hora
// Função para formatar data e hora
function formatarDataHora(isoString) {
    if (!isoString) return 'Data não disponível';

    try {
        const data = new Date(isoString);
        if (isNaN(data.getTime())) return 'Data inválida';

        const dia = String(data.getUTCDate()).padStart(2, '0');
        const mes = String(data.getUTCMonth() + 1).padStart(2, '0');
        const ano = data.getUTCFullYear();
        const hora = String(data.getUTCHours()).padStart(2, '0');
        const minuto = String(data.getUTCMinutes()).padStart(2, '0');
        return `${dia}/${mes}/${ano} - ${hora}:${minuto}`;
    } catch (error) {
        return 'Erro ao formatar data';
    }
}

export default function MapaVeiculoIndividual({ veiculo, viagemSelecionada, alertaSelecionado }) {
    const [currentProvider, setCurrentProvider] = useState(mapProviders.default);
    const [posicaoAtual, setPosicaoAtual] = useState([-3.76, -49.67]);
    const [pontos, setPontos] = useState([]);

    // Encontrar a última posição do veículo
    useEffect(() => {
        if (veiculo?.viagens?.length > 0) {
            const ultimaViagem = veiculo.viagens[veiculo.viagens.length - 1];
            if (ultimaViagem?.registros?.length > 0) {
                const ultimoRegistro = ultimaViagem.registros.at(-1);
                const coords = [
                    parseFloat(ultimoRegistro.latitude),
                    parseFloat(ultimoRegistro.longitude)
                ];
                setPosicaoAtual(coords);
            }
        }
    }, [veiculo]);

    // Detectar seleção de viagem
    // useEffect(() => {
    //     if (viagemSelecionada?.registros?.length > 0) {
    //         const ultimo = viagemSelecionada.registros.at(-1);
    //         const coords = [
    //             parseFloat(ultimo.latitude),
    //             parseFloat(ultimo.longitude)
    //         ];
    //         setPosicaoAtual(coords);

    //         const caminho = viagemSelecionada.registros.map(p =>
    //             [parseFloat(p.latitude), parseFloat(p.longitude)]
    //         );
    //         setPontos(caminho);
    //     }
    // }, [viagemSelecionada]);

    useEffect(() => {
        if (viagemSelecionada?.registros?.length > 0) {
            const caminho = viagemSelecionada.registros.map(p =>
                [parseFloat(p.latitude), parseFloat(p.longitude)]
            );
            setPontos(caminho);

            // Centraliza o mapa no último ponto da viagem
            if (caminho.length > 0) {
                setPosicaoAtual(caminho[caminho.length - 1]);
            }
        }
    }, [viagemSelecionada]);

    // Detectar seleção de alerta
    useEffect(() => {
        if (alertaSelecionado?.registros?.length > 0) {
            const primeira = alertaSelecionado.registros[0];
            const novaPosicao = [parseFloat(primeira.latitude), parseFloat(primeira.longitude)];

            if (novaPosicao[0] !== posicaoAtual[0] || novaPosicao[1] !== posicaoAtual[1]) {
                setPosicaoAtual(novaPosicao);
            }
        }
    }, [alertaSelecionado, posicaoAtual]);

    return (
        <div className='mapaPercurso'>
            <MapContainer center={posicaoAtual} zoom={16} style={{ height: '100vh', width: '100%' }}>
                <TileLayer
                    key={currentProvider}
                    url={mapProviders[currentProvider].url}
                    maxZoom={mapProviders[currentProvider].maxZoom}
                    attribution={mapProviders[currentProvider].attribution}
                />

                <CentralizarMapa coordenadas={pontos.length > 0 ? pontos[pontos.length - 1] : posicaoAtual} />

                {/* Ícone do veículo na última posição */}
                {viagemSelecionada && pontos.length > 0 && (
                    <Marker position={pontos[pontos.length - 1]} icon={vehicleIcon}>
                        <Popup>
                            <b>🚗 VEÍCULO</b><br />
                            <b>Posição final</b><br />
                            <b>Veículo:</b> {veiculo.identificador} - {veiculo.modelo}<br />
                            <b>Motorista:</b> {viagemSelecionada.motorista?.nome}<br />
                            <b>RFID:</b> {viagemSelecionada.motorista?.cartao_rfid}
                        </Popup>
                    </Marker>
                )}

                {/* Pontos e setas do percurso da viagem selecionada */}
                {pontos.length > 0 && viagemSelecionada && (
                    <>
                        {/* Marcadores individuais dos pontos */}
                        {pontos.map((ponto, index) => {
                            const [lat, lng] = ponto;
                            const registro = viagemSelecionada.registros?.[index];

                            // Verificação de segurança
                            if (!registro) return null;

                            const temAlerta = pontoTemAlerta(registro);

                            // Define o ícone baseado no índice e se tem alerta
                            let iconToUse;
                            if (temAlerta) {
                                iconToUse = alertaIconLeaflet;
                            } else if (index === 0) {
                                iconToUse = starPercursotIcon;
                            } else {
                                iconToUse = pontoPercursoIcon;
                            }

                            return (
                                <Marker key={index} position={[lat, lng]} icon={iconToUse}>
                                    <Popup>
                                        <div>
                                            {temAlerta && (
                                                <>
                                                    <b style={{ color: 'red' }}>EXCESSO DE VELOCIDADE</b><br />
                                                    <b>Velocidade:</b> {parseFloat(registro.velocidade || 0).toFixed(1)} km/h<br />
                                                    <b>Limite:</b> {parseFloat(registro.limite_aplicado || 0).toFixed(1)} km/h<br />
                                                    <b>Diferença:</b> +{(parseFloat(registro.velocidade || 0) - parseFloat(registro.limite_aplicado || 0)).toFixed(1)} km/h<br />
                                                </>
                                            )}
                                            {index === 0 && !temAlerta && (
                                                <>
                                                    <b style={{ color: 'green' }}>📍 INÍCIO DO PERCURSO</b><br />
                                                </>
                                            )}
                                            {!temAlerta && index !== 0 && (
                                                <>
                                                    <b>Velocidade:</b> {parseFloat(registro.velocidade || 0).toFixed(1)} km/h<br />
                                                    <b>Limite:</b> {parseFloat(registro.limite_aplicado || 0).toFixed(1)} km/h<br />
                                                </>
                                            )}
                                            <b>Horário:</b> {formatarDataHora(registro.timestamp)}<br />
                                            {registro.chuva ? '🌧️ Chuva detectada' : '☀️ Tempo seco'}
                                        </div>
                                    </Popup>
                                </Marker>
                            );
                        })}

                        {/* Linha com setas indicando direção */}
                        <LinhaComSetas pontos={pontos} />
                    </>
                )}

                {/* Alertas selecionados */}
                {alertaSelecionado && alertaSelecionado.registros?.length > 0 && (
                    <div>
                        {/* Marcadores dos pontos do alerta */}
                        {alertaSelecionado.registros.map((registro, index) => (
                            <Marker
                                key={index}
                                position={[parseFloat(registro.latitude), parseFloat(registro.longitude)]}
                                icon={alertaIconLeaflet}
                            >
                                <Popup>
                                    <b>ALERTA: {alertaSelecionado.tipo}</b><br />
                                    <b>Descrição:</b> {alertaSelecionado.descricao}<br />
                                    <b>Velocidade:</b> {parseFloat(registro.velocidade).toFixed(1)} km/h<br />
                                    <b>Limite:</b> {parseFloat(registro.limite_aplicado).toFixed(1)} km/h<br />
                                    <b>Diferença:</b> +{(parseFloat(registro.velocidade) - parseFloat(registro.limite_aplicado)).toFixed(1)} km/h<br />
                                    <b>Horário:</b> {formatarDataHora(registro.timestamp)}<br />
                                    <b>Motorista:</b> {alertaSelecionado.motorista?.nome}<br />
                                    {registro.chuva ? '🌧️ Chuva detectada' : '☀️ Tempo seco'}
                                </Popup>
                            </Marker>
                        ))}

                        {/* Linha vermelha conectando os pontos do alerta */}
                        {alertaSelecionado.registros.length > 1 && (
                            <LinhaComSetasVermelha
                                pontos={alertaSelecionado.registros.map(r =>
                                    [parseFloat(r.latitude), parseFloat(r.longitude)]
                                )}
                            />
                        )}
                    </div>
                )}

            </MapContainer>

            <div className='janelaProviders'>
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