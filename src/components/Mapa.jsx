import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import { useRef } from 'react';

import './styles/mapa.css'

import ModalCerca from './ModalCerca';

function ControladorDesenho({ cercas, cercaSelecionada, layerRefs }) {
    const map = useMap();

    useEffect(() => {
        if (map._drawControlAdded) return;

        const drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);

        const drawControl = new L.Control.Draw({
            draw: {
                polygon: true,
                polyline: false,
                rectangle: false,
                circle: false,
                marker: false,
            },
            edit: {
                featureGroup: drawnItems,
            },
        });

        map.addControl(drawControl);
        map._drawControlAdded = true;

        cercas.forEach(cerca => {
            const poligono = L.polygon(cerca.coordenadas, {
                color: cerca.cor || 'blue',
                weight: 2,
                fillOpacity: 0.4,
            });

            layerRefs.current[cerca.id] = poligono;


            poligono.bindPopup(`<b>${cerca.nome}</b><br>Máx: ${cerca.velocidade_max} km/h<br>Chuva: ${cerca.velocidade_chuva} km/h`);
            poligono.addTo(map);
        })

        // evento de criação de um polígono
        map.on(L.Draw.Event.CREATED, (event) => {
            const layer = event.layer;
            drawnItems.addLayer(layer);
            const coordinates = layer.getLatLngs();
            console.log('Coordenadas:', coordinates);

            const desejaSalvar = window.confirm('Deseja salvar esta cerca?');

            if (desejaSalvar) {

            } else {
                map.removeLayer(layer);
            }
        });
    }, [map]);

    useEffect(() => {
        if (cercaSelecionada && layerRefs.current[cercaSelecionada.id]) {
            const layer = layerRefs.current[cercaSelecionada.id];
            map.fitBounds(layer.getBounds(), { maxZoom: 17 });
            layer.openPopup();
        }
    }, [cercaSelecionada, map]);


    return null;
}

export default function Mapa({ cercas, cercaSelecionada }) {

    const layerRefs = useRef({});
    const [modalVisivel, setModalVisivel] = useState(true);

    return (
        <div className='mapa'>
            <MapContainer center={[-3.76, -49.67]} zoom={15} style={{ height: '100vh', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <ControladorDesenho cercas={cercas} cercaSelecionada={cercaSelecionada} layerRefs={layerRefs} />
            </MapContainer>

            {modalVisivel && (
                <ModalCerca setModalVisivel={setModalVisivel} ></ModalCerca>
            )}

        </div>
    );
}