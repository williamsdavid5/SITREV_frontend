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

function Centralizar({ coordenadas }) {
    const map = useMap();
    useEffect(() => {
        if (coordenadas) {
            map.setView(coordenadas, 16);
        }
    }, [coordenadas]);
    return null;
}

export default function MapaPercursoSelecionado({ viagemId, alertas }) {
    const [provider, setProvider] = useState('stadia');
    const [posicaoAtual, setPosicaoAtual] = useState([-3.76, -49.67]);
    const [pontos, setPontos] = useState([]);
    const [registro, setRegistro] = useState(null);

    const [carregando, setcarregando] = useState(false);

    useEffect(() => {
        async function resgatarViagem(id) {
            if (!id) return;
            setcarregando(true)
            try {
                const resposta = await api.get(`/viagens/${id}`);
                setRegistro(resposta.data);
                setcarregando(false);
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

            const caminho = registro.registros.map(p => [
                parseFloat(p.latitude),
                parseFloat(p.longitude)
            ]);
            setPontos(caminho);
        } else {
            setPontos([]);
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

                {pontos.length > 0 && (
                    <>
                        <Polyline positions={pontos} color="blue" />
                        <Marker position={pontos.at(-1)} icon={vehicleIcon}>
                            <Popup>
                                Última posição{registro?.motorista?.nome ? ` de ${registro.motorista.nome}` : ''}
                            </Popup>
                        </Marker>
                    </>
                )}

                {registro?.alertas?.length > 0 && registro.alertas.map((alerta, index) => {
                    const pontosAlerta = alerta.registros?.map(r => [parseFloat(r.latitude), parseFloat(r.longitude)]);

                    return (
                        <div key={index}>
                            {/* Marcar cada ponto */}
                            {alerta.registros?.map((r, i) => (
                                <Marker
                                    key={i}
                                    position={[parseFloat(r.latitude), parseFloat(r.longitude)]}
                                    icon={alertaIconLeaflet}
                                >
                                    <Popup>
                                        <b>Tipo:</b> {alerta.tipo}<br />
                                        <b>Descrição:</b> {alerta.descricao}<br />
                                        <b>Velocidade:</b> {parseFloat(r.velocidade).toFixed(1)} km/h<br />
                                        <b>Chuva:</b> {r.chuva ? 'Sim' : 'Não'}<br />
                                        <b>Horário:</b> {new Date(r.timestamp).toLocaleString('pt-BR')}
                                    </Popup>
                                </Marker>
                            ))}

                            {/* Linha entre os pontos do mesmo alerta */}
                            {pontosAlerta?.length > 1 && (
                                <Polyline
                                    positions={pontosAlerta}
                                    color="red"
                                    weight={3}
                                    dashArray="6"
                                />
                            )}
                        </div>
                    );
                })}



                {carregando && (
                    <div className='carregandoPercursoDiv'>
                        <img src={loadingGif} alt="" />
                        <p>Carregando...</p>
                    </div>
                )}

            </MapContainer>

            <select
                name="providerSelect"
                id="providerSelect"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="map-provider-select"
            >
                {Object.entries(mapProviders).map(([id, p]) => (
                    <option key={id} value={id}>
                        {p.name}
                    </option>
                ))}
            </select>
        </div>
    );
}
