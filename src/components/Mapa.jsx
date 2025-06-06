import { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import { useRef } from 'react';
import api from '../server/api';
import './styles/mapa.css';
import veiculoIcon from '../assets/veiculoIcon.png';

import ModalCerca from './ModalCerca';

//icon personalizado do veiculo
const vehicleIcon = new L.Icon({
    iconUrl: veiculoIcon,
    iconSize: [40, 40],
    iconAnchor: [15, 15],
    className: 'iconeVeiculo'
});

// essa função é responsável por configurar os controles padrões do leaflet, dar funções a eles
function ControladorDesenho({
    cercas,
    cercaSelecionada,
    layerRefs,
    setModalVisivel,
    setNovaCercaCoordenadas,
    setCercaSelecionada
}) {
    const map = useMap();
    const [pontosMarcados, setPontosMarcados] = useState([]);


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
                marker: true,
                circlemarker: false,
            },
            edit: {
                featureGroup: drawnItems
            }
        });

        map.addControl(drawControl);
        map._drawControlAdded = true;

        map._drawnItems = drawnItems;

        map.on(L.Draw.Event.CREATED, function (event) {
            const layer = event.layer;

            if (event.layerType === 'polygon') {
                const latlngs = layer.getLatLngs()[0];
                const coordenadas = latlngs.map(coord => [coord.lat, coord.lng]);
                setNovaCercaCoordenadas(coordenadas);
                setModalVisivel(true);
            }

            if (event.layerType === 'marker') {
                const { lat, lng } = layer.getLatLng();
                setPontosMarcados(prev => [...prev, [lat, lng]]);
                drawnItems.addLayer(layer);
                console.log(pontosMarcados);
            }
        });


        map.on(L.Draw.Event.EDITED, async function (event) {
            const layers = event.layers;

            layers.eachLayer(async function (layer) {
                const idEncontrado = Object.entries(layerRefs.current).find(([id, ref]) => ref === layer);
                if (!idEncontrado) return;
                const [cerca_id] = idEncontrado;
                const desejaSalvar = window.confirm('Deseja salvar as alterações desta cerca?');
                if (!desejaSalvar) return;
                const latlngs = layer.getLatLngs()[0];
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
            } catch (err) {
                console.error('Erro ao excluir cerca(s):', err);
                alert('Erro ao excluir.');
            }
        });
    }, [map]);

    useEffect(() => {
        function handleClick(event) {
            const botao = event.target.closest('.botaoEditarCerca');
            if (!botao) return;

            const id = botao.getAttribute('data-id');
            const cerca = cercas.find(c => String(c.id) === id);
            if (cerca) {
                setCercaSelecionada(cerca);
                window.dispatchEvent(new CustomEvent('abrirModalCerca', { detail: cerca }));
            }
        }

        document.addEventListener('click', handleClick);
        return () => {
            document.removeEventListener('click', handleClick);
        };
    }, [cercas]);

    useEffect(() => {
        console.log('Pontos marcados atualizados:', pontosMarcados);
    }, [pontosMarcados]);


    // Atualiza o mapa sempre que 'cercas' mudar
    useEffect(() => {
        const drawnItems = map._drawnItems;
        if (!drawnItems) return;

        drawnItems.clearLayers();
        layerRefs.current = {};

        cercas.forEach(cerca => {
            const poligono = L.polygon(cerca.coordenadas, {
                color: cerca.cor || 'blue',
                weight: 2,
                fillOpacity: 0.4
            });

            layerRefs.current[cerca.id] = poligono;

            poligono.bindPopup(`
        <b>${cerca.nome}</b><br>
        Máx: ${cerca.velocidade_max} km/h<br>
        Chuva: ${cerca.velocidade_chuva} km/h<br>
        <button class='botaoPopUpMapa' data-id='${cerca.id}'>Editar</button>
      `);

            drawnItems.addLayer(poligono);
        });
    }, [cercas, map]);

    useEffect(() => {
        if (cercaSelecionada && layerRefs.current[cercaSelecionada.id]) {
            const layer = layerRefs.current[cercaSelecionada.id];
            map.fitBounds(layer.getBounds(), { maxZoom: 17 });
            layer.openPopup();
        }
    }, [cercaSelecionada, map]);

    return null;
};

// export default ControladorDesenho;

export default function Mapa({ cercas, cercaSelecionada, setCercaSelecionada }) {

    const layerRefs = useRef({});
    const [modalVisivel, setModalVisivel] = useState(false);
    const [novaCercaCoordenadas, setNovaCercaCoordenadas] = useState(null);
    const [camadas, setCamadas] = useState(false);
    const [viagens, setViagens] = useState(null);
    const [viagemSelecionada, setVIagemSelecionada] = useState(null);

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

        async function resgatarViagens() {
            try {

                let resposta = await api.get('/viagens/registros');
                setViagens(resposta.data);
                console.log(resposta.data)

            } catch (err) {
                console.log('erro ao resgatar viagens: ', err);
                alert('Erro ao resgatar viagens');
            }
        }

        resgatarCamadas();
        resgatarViagens();
    }, [])

    return (
        <div className='mapa'>
            <MapContainer center={[-3.76, -49.67]} zoom={15} style={{ height: '100vh', width: '100%' }}>
                <TileLayer
                    key={currentProvider}
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

                {viagens && Array.isArray(viagens) ? viagens.map((viagem) => {
                    if (!viagem.registros || viagem.registros.length === 0) return null;

                    const ultimoPonto = viagem.registros[viagem.registros.length - 1];

                    const dataObj = new Date(ultimoPonto.timestamp);
                    const opcoesData = {
                        timeZone: "America/Sao_Paulo",
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                    };
                    const opcoesHora = {
                        timeZone: "America/Sao_Paulo",
                        hour: "2-digit",
                        minute: "2-digit",
                    };

                    const dataFormatada = dataObj.toLocaleDateString("pt-BR", opcoesData);
                    const horaFormatada = dataObj.toLocaleTimeString("pt-BR", opcoesHora);

                    const ultimoHorario = `${horaFormatada}, ${dataFormatada}`;
                    const position = [parseFloat(ultimoPonto.latitude), parseFloat(ultimoPonto.longitude)];

                    if (!position[0] || !position[1]) return null; // segurança extra

                    return (
                        <Marker
                            key={viagem.id}
                            position={position}
                            icon={vehicleIcon}
                            eventHandlers={{
                                click: () => {
                                    setVIagemSelecionada(viagem.id === viagemSelecionada ? null : viagem.id);
                                }
                            }}
                        >
                            <Popup>
                                <div>
                                    <b>Veículo: {viagem.veiculo_identificador}</b><br />
                                    <b>Motorista:</b> {viagem.nome_motorista}<br />
                                    Ultima leitura às <b>{ultimoHorario}</b><br />
                                    {/* Velocidade: {ultimoPonto.velocidade} km/h <br /> */}
                                    <button className='botaoPopUpMapa' >Ver mais</button>
                                </div>
                            </Popup>
                        </Marker>
                    )
                }) : <></>}


                {viagemSelecionada && (() => {
                    const viagem = viagens.find(v => v.id === viagemSelecionada);
                    if (!viagem) return null;

                    const pontos = viagem.registros.map(p => [parseFloat(p.latitude), parseFloat(p.longitude)]);

                    return (
                        <Polyline positions={pontos} color="blue" />
                    );
                })()}
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