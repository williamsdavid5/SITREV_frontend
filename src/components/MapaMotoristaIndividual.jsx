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
import mapProviders from '../utils/mapProviders';
import veiculoIcon from '../assets/veiculoIcon.png';
import alertaIcon from '../assets/alertaIcon.png'
import './styles/mapa.css';

const vehicleIcon = new L.Icon({
    iconUrl: veiculoIcon,
    iconSize: [40, 40],
    iconAnchor: [15, 15],
    className: 'iconeVeiculo'
});

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
    const [currentProvider, setCurrentProvider] = useState('stadia');
    const [posicaoAtual, setPosicaoAtual] = useState([-3.76, -49.67]);
    const [pontos, setPontos] = useState([]);

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

    useEffect(() => {
        if (!mostrarTodos && alertaSelecionado?.registroCoordenadas?.length > 0) {
            const primeira = alertaSelecionado.registroCoordenadas[0];
            setPosicaoAtual([parseFloat(primeira.latitude), parseFloat(primeira.longitude)]);
        }
    }, [alertaSelecionado, mostrarTodos]);

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

                {posicaoAtual && (
                    <Marker position={posicaoAtual} icon={vehicleIcon}>
                        <Popup>Última posição de {motorista.nome}</Popup>
                    </Marker>
                )}

                {pontos.length > 0 && (
                    <Polyline positions={pontos} color="blue" />
                )}
                {/* Exibe todos os alertas, ou só o selecionado */}
                {(mostrarTodos ? motorista.alertas : [alertaSelecionado])
                    ?.filter(alerta => alerta?.registroCoordenadas?.length > 0)
                    .map((alerta, index) => (
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
                                        <b>Horário:</b> {new Date(coord.timestamp).toLocaleString('pt-BR')}
                                    </Popup>
                                </Marker>
                            ))}

                            {alerta.registroCoordenadas.length > 1 && (
                                <Polyline
                                    positions={alerta.registroCoordenadas.map(coord => [
                                        parseFloat(coord.latitude),
                                        parseFloat(coord.longitude)
                                    ])}
                                    color="red"
                                    weight={3}
                                    dashArray="6"
                                />
                            )}
                        </div>
                    ))}



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
        </div>
    );
}
