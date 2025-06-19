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

export default function MapaAlertas({ viagemId, mostrarTodos }) {
    const [provider, setProvider] = useState('stadia');
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

            const caminho = registro.registros.map(p => [
                parseFloat(p.latitude),
                parseFloat(p.longitude)
            ]);
            setPontos(caminho);
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

                        {registro.registros?.length > 1 && (
                            <Polyline
                                positions={registro.registros.map(r => [
                                    parseFloat(r.latitude),
                                    parseFloat(r.longitude)
                                ])}
                                color="red"
                                weight={3}
                                dashArray="6"
                            />
                        )}
                    </>
                )}

                {mostrarTodos && todosOsALertas.map((alerta) =>
                    alerta.registros.map((registro, i) => (
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
                    ))
                )}

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
    )
}