import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import { useRef } from 'react';
import api from '../server/api';
import './styles/mapa.css'

import ModalCerca from './ModalCerca';

function ControladorDesenho({ cercas, cercaSelecionada, layerRefs, setModalVisivel, setNovaCercaCoordenadas }) {
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

            poligono.bindPopup(`
                <b>${cerca.nome}</b><br>
                Máx: ${cerca.velocidade_max} km/h<br>
                Chuva: ${cerca.velocidade_chuva} km/h<br>
                <button class='botaoEditarCerca' data-id='${cerca.id}'>Editar</button>
                `);


            drawnItems.addLayer(poligono);

        })

        // evento de criação de um poligono
        map.on(L.Draw.Event.CREATED, function (event) {
            const layer = event.layer;
            const latlngs = layer.getLatLngs()[0]; // array de {lat, lng}
            const coordenadas = latlngs.map(coord => [coord.lat, coord.lng]);

            setNovaCercaCoordenadas(coordenadas);
            setModalVisivel(true);
        });


        // evento de edição de um poligono
        map.on(L.Draw.Event.EDITED, async function (event) {
            const layers = event.layers;

            layers.eachLayer(async function (layer) {
                const idEncontrado = Object.entries(layerRefs.current).find(([id, ref]) => ref === layer);

                if (!idEncontrado) {
                    console.warn('Cerca editada não encontrada nos refs.');
                    return;
                }

                const [cerca_id] = idEncontrado;

                const desejaSalvar = window.confirm('Deseja salvar as alterações desta cerca?');

                if (!desejaSalvar) return;

                const latlngs = layer.getLatLngs()[0]; // array de {lat, lng}

                const coordenadas = latlngs.map(coord => [coord.lat, coord.lng]);

                try {
                    await api.put(`/pontosCerca/atualizar/${cerca_id}`, { coordenadas });
                    alert('Cerca atualizada com sucesso!');
                } catch (err) {
                    console.error('Erro ao atualizar pontos da cerca:', err);
                    alert('Erro ao atualizar a cerca.');
                }
            });
        });

        // evento de deleção
        map.on(L.Draw.Event.DELETED, async function (event) {
            const layers = event.layers;

            const idsParaDeletar = [];

            layers.eachLayer(function (layer) {
                const idEncontrado = Object.entries(layerRefs.current).find(([id, ref]) => ref === layer);

                if (idEncontrado) {
                    const [cerca_id] = idEncontrado;
                    idsParaDeletar.push(cerca_id);
                }
            });

            if (idsParaDeletar.length === 0) return;

            const confirmar = window.confirm(`Deseja excluir ${idsParaDeletar.length} cerca(s)?`);

            if (!confirmar) return;

            try {
                for (const id of idsParaDeletar) {
                    await api.delete(`/cercas/${id}`);
                }

                alert('Cerca(s) excluída(s) com sucesso!');
                window.location.reload();
            } catch (err) {
                console.error('Erro ao excluir cerca(s):', err);
                alert('Erro ao excluir.');
            }
        });

        // popup das cercas
        map.on('popupopen', function (e) {
            const popupNode = e.popup._contentNode;
            const botaoEditar = popupNode.querySelector('.botaoEditarCerca');

            if (botaoEditar) {
                botaoEditar.addEventListener('click', () => {
                    const id = botaoEditar.getAttribute('data-id');
                    const cerca = cercas.find(c => String(c.id) === id);
                    if (cerca) {
                        window.dispatchEvent(new CustomEvent('abrirModalCerca', { detail: cerca }));
                    }
                });

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
    const [modalVisivel, setModalVisivel] = useState(false);
    const [novaCercaCoordenadas, setNovaCercaCoordenadas] = useState(null);
    const [camadas, setCamadas] = useState(false);

    useEffect(() => {
        async function resgatarCamadas() {
            try {

                let resposta = await api.get('/cercas/camadas');
                const camadasObj = resposta.data;

                const camadasArray = Object.entries(camadasObj)
                    .map(([_, camada]) => camada)
                    .sort((a, b) => a.nome.localeCompare(b.nome));

                setCamadas(camadasArray);

            } catch (err) {
                console.log('erro ao resgatar camadas no componente mapa: ', err)
            }
        }

        resgatarCamadas();
    }, [])

    return (
        <div className='mapa'>
            <MapContainer center={[-3.76, -49.67]} zoom={15} style={{ height: '100vh', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <ControladorDesenho cercas={cercas} cercaSelecionada={cercaSelecionada} setModalVisivel={setModalVisivel} layerRefs={layerRefs} setNovaCercaCoordenadas={setNovaCercaCoordenadas} />
            </MapContainer>

            {modalVisivel && (
                <ModalCerca
                    setModalVisivel={setModalVisivel}
                    cercaSelecionada={cercaSelecionada}
                    novaCercaCoordenadas={novaCercaCoordenadas}
                    camadas={camadas}
                />
            )}

        </div>
    );
}