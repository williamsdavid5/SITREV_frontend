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

const alertaIconLeaflet = new L.Icon({
    iconUrl: alertaIcon,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    className: 'iconeAlerta'
});

function Centralizar({ coordenadas }) {
    const map = useMap();
    useEffect(() => {
        if (coordenadas) {
            map.setView(coordenadas, 16);
        }
    }, [coordenadas]);
    return null;
}

function LinhaComSetasVermelha({ pontos }) {
    const map = useMap();

    useEffect(() => {
        if (!pontos || pontos.length < 2) return;

        const latlngs = pontos.map(p => [parseFloat(p.latitude), parseFloat(p.longitude)]);

        // Linha pontilhada vermelha
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

export default function MapaAlertas({ viagemId, mostrarTodos }) {
    const [provider, setProvider] = useState(mapProviders.default);
    const [posicaoAtual, setPosicaoAtual] = useState([-3.76, -49.67]);
    const [pontos, setPontos] = useState([]);
    const [registro, setRegistro] = useState(null);
    const [carregando, setcarregando] = useState(false);
    const [todosOsALertas, setTodosOsAlertas] = useState([]);

    useEffect(() => {
        async function resgatarViagem(id) {
            if (!id) return;
            setcarregando(true);
            try {
                const resposta = await api.get(`/alertas/${id}`);
                setRegistro(resposta.data);
                setcarregando(false);
            } catch (err) {
                console.log('Erro ao resgatar alerta:', err);
                alert('Erro ao resgatar alerta');
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

    async function resgatarTodosOsALertas() {
        try {
            setcarregando(true);
            let resposta = await api.get('/alertas');
            setTodosOsAlertas(resposta.data);
            setcarregando(false);
        } catch (err) {
            console.log('Erro ao resgatar todos os alertas! ', err);
            alert('Erro resgatar todos os alertas!');
            setcarregando(false);
        }
    }

    useEffect(() => {
        if (mostrarTodos) {
            resgatarTodosOsALertas();
        } else {
            setTodosOsAlertas([]);
        }
    }, [mostrarTodos]);


    return (
        <div className='mapaPercurso'>
            <MapContainer center={posicaoAtual} zoom={16} style={{ height: '100vh', width: '100%' }} >
                <TileLayer
                    key={provider}
                    url={mapProviders[provider].url}
                    maxZoom={mapProviders[provider].maxZoom}
                    attribution={mapProviders[provider].attribution}
                />
                <Centralizar coordenadas={posicaoAtual} />


                {/* Renderização do alerta */}
                {registro && (
                    <>
                        {/* Marcadores para cada registro do alerta */}
                        {registro.registros?.map((r, i) => (
                            <Marker
                                key={`marker-${i}`}
                                position={[parseFloat(r.latitude), parseFloat(r.longitude)]}
                                icon={alertaIconLeaflet}
                            >
                                <Popup>
                                    <b>Veículo:</b> {registro.veiculo?.identificador}<br />
                                    <b>Motorista:</b> {registro.motorista?.nome}<br />
                                    <b>Tipo:</b> {registro.tipo}<br />
                                    <b>Descrição:</b> {registro.descricao}<br />
                                    <b>Velocidade:</b> {parseFloat(r.velocidade).toFixed(1)} km/h<br />
                                    <b>Chuva:</b> {r.chuva ? 'Sim' : 'Não'}<br />
                                    <b>Horário:</b> {new Date(r.timestamp).toLocaleString('pt-BR')}
                                </Popup>
                            </Marker>
                        ))}

                        {/* Linha com setas vermelhas para o alerta individual */}
                        {registro.registros?.length > 1 && (
                            <LinhaComSetasVermelha pontos={registro.registros} />
                        )}
                    </>
                )}


                {mostrarTodos && todosOsALertas.map((alerta) => (
                    <div key={`alerta-${alerta.id}`}>
                        {/* Marcadores para cada registro do alerta */}
                        {alerta.registros?.map((registro, i) => (
                            <Marker
                                key={`alerta-${alerta.id}-registro-${i}`}
                                position={[
                                    parseFloat(registro.latitude),
                                    parseFloat(registro.longitude)
                                ]}
                                icon={alertaIconLeaflet}
                            >
                                <Popup>
                                    <b>Motorista:</b> {alerta.motorista.nome}<br />
                                    <b>Veículo:</b> {alerta.veiculo.identificador}<br />
                                    <b>Tipo:</b> {alerta.tipo}<br />
                                    <b>Descrição:</b> {alerta.descricao}<br />
                                    <b>Velocidade:</b> {parseFloat(registro.velocidade).toFixed(1)} km/h<br />
                                    <b>Chuva:</b> {registro.chuva ? 'Sim' : 'Não'}<br />
                                    <b>Data:</b> {new Date(registro.timestamp).toLocaleString('pt-BR')}
                                </Popup>
                            </Marker>
                        ))}

                        {/* Linha com setas vermelhas para cada alerta */}
                        {alerta.registros?.length > 1 && (
                            <LinhaComSetasVermelha pontos={alerta.registros} />
                        )}
                    </div>
                ))}

                {carregando && (
                    <div className='carregandoPercursoDiv'>
                        <img src={loadingGif} alt="" />
                        <p>Carregando...</p>
                    </div>
                )}
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
        </div>
    )
}