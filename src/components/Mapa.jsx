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

function ControladorDesenho({ cercas, cercaSelecionada, layerRefs, setModalVisivel, setNovaCercaCoordenadas, setCercaSelecionada }) {
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
                        setCercaSelecionada(cerca);
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

export default function Mapa({ cercas, cercaSelecionada, setCercaSelecionada }) {

    const layerRefs = useRef({});
    const [modalVisivel, setModalVisivel] = useState(false);
    const [novaCercaCoordenadas, setNovaCercaCoordenadas] = useState(null);
    const [camadas, setCamadas] = useState(false);

    const [currentProvider, setCurrentProvider] = useState('stadia');
    const mapProviders = {
        stadia: {
            name: "Satélite",
            url: "https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.jpg",
            attribution: '© CNES, Distribution Airbus DS, © Airbus DS, © PlanetObserver (Contains Copernicus Data) | © <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> © <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 20
        },
        openstreetmap: {
            name: "Padrão",
            url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        },
        cyclosm: {
            name: "CyclOSM",
            url: "https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png",
            attribution: '<a href="https://github.com/cyclosm/cyclosm-cartocss-style/releases" title="CyclOSM - Open Bicycle render">CyclOSM</a> | Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 20
        },
        memomaps: {
            name: "Memomaps",
            url: "https://tileserver.memomaps.de/tilegen/{z}/{x}/{y}.png",
            attribution: 'Map <a href="https://memomaps.de/">memomaps.de</a> <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 18
        },
        opentopomap: {
            name: "OpenTopoMap",
            url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
            attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
            maxZoom: 17
        },
        mtbmap: {
            name: "black and white",
            url: "https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}{r}.png",
            attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://www.stamen.com/" target="_blank">Stamen Design</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 20
        }
    };

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
                {/* <TileLayer
                    url="https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.jpg"
                    minZoom={0}
                    maxZoom={20}
                    attribution='© CNES, Distribution Airbus DS, © Airbus DS, © PlanetObserver (Contains Copernicus Data) | © <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> © <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                /> */}

                {/* <TileLayer
                    url="https://tile.osm.ch/switzerland/{z}/{x}/{y}.png"
                    maxZoom={18}
                    bounds={[[45, 5], [48, 11]]}
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                /> */}

                {/* <TileLayer
                    url="https://tileserver.memomaps.de/tilegen/{z}/{x}/{y}.png"
                    maxZoom={18}
                    attribution='Map <a href="https://memomaps.de/">memomaps.de</a> <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                /> */}

                {/* <TileLayer
                    url="https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}{r}.png"
                    minZoom={0}
                    maxZoom={20}
                    attribution='&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://www.stamen.com/" target="_blank">Stamen Design</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                /> */}

                <TileLayer
                    key={currentProvider} // Isso força recriação ao mudar
                    url={mapProviders[currentProvider].url}
                    maxZoom={mapProviders[currentProvider].maxZoom}
                    attribution={mapProviders[currentProvider].attribution}
                />


                <ControladorDesenho
                    cercas={cercas}
                    setCercaSelecionada={setCercaSelecionada}
                    cercaSelecionada={cercaSelecionada}
                    setModalVisivel={setModalVisivel}
                    layerRefs={layerRefs}
                    setNovaCercaCoordenadas={setNovaCercaCoordenadas}
                />
            </MapContainer>

            {modalVisivel && (
                <ModalCerca
                    setModalVisivel={setModalVisivel}
                    cercaSelecionada={cercaSelecionada}
                    novaCercaCoordenadas={novaCercaCoordenadas}
                    camadas={camadas}
                    setCercaSelecionada={setCercaSelecionada}
                />
            )}

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