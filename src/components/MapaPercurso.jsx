import { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap, Polyline, Polygon } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import { useRef } from 'react';
import api from '../server/api';
import './styles/mapa.css';
import veiculoIcon from '../assets/veiculoIcon.png';
import mapProviders from '../utils/mapProviders';

export default function MapaPercurso() {
    const [currentProvider, setCurrentProvider] = useState('stadia');
    const [cercas, setCercas] = useState([]);

    async function resgatarCercas() {
        try {
            const cercas = await api.get('/cercas');
            console.log(cercas.data);
            setCercas(cercas.data);
        } catch (err) {
            console.log(err);
            alert('Erro ao resgatar ou desenhar cercas');
        }
    }

    useEffect(() => {
        resgatarCercas();
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
    )
}