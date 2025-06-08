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
import mapProviders from '../utils/mapProviders';

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

    //para detectar o click na edição de uma cerca
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

    //para armazenar os pontos (apenas para criar dados falsos...)
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
                // fillOpacity: 0.4
            });

            layerRefs.current[cerca.id] = poligono;

            poligono.bindPopup(`
        <b>${cerca.nome}</b><br>
        Máx: ${cerca.velocidade_max} km/h<br>
        Chuva: ${cerca.velocidade_chuva} km/h<br>
        <button class='botaoEditarCerca botaoPopUpMapa' data-id='${cerca.id}'>Editar</button>

      `);

            drawnItems.addLayer(poligono);
        });
    }, [cercas, map]);

    //para centralizar a cerca selecionada no menu lateral
    useEffect(() => {
        if (cercaSelecionada && layerRefs.current[cercaSelecionada.id]) {
            const layer = layerRefs.current[cercaSelecionada.id];
            map.fitBounds(layer.getBounds(), { maxZoom: 17 });
            layer.openPopup();
        }
    }, [cercaSelecionada, map]);

    return null;
};


export default function Mapa({ cercas, cercaSelecionada, setCercaSelecionada }) {

    const layerRefs = useRef({});
    const [modalVisivel, setModalVisivel] = useState(false);
    const [novaCercaCoordenadas, setNovaCercaCoordenadas] = useState(null);
    const [camadas, setCamadas] = useState(false);
    const [viagens, setViagens] = useState(null);
    const [viagemSelecionada, setVIagemSelecionada] = useState(null);

    const [currentProvider, setCurrentProvider] = useState('stadia');

    //resgata os dados
    useEffect(() => {
        // camadas e cercas
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

        // viagens
        async function resgatarViagens() {
            try {
                let resposta = await api.get('/veiculos/registros');
                setViagens(resposta.data);
                console.log(resposta.data);
            } catch (err) {
                console.log('erro ao resgatar registros dos veículos:', err);
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

                {viagens && Array.isArray(viagens) ? viagens.map((veiculo) => {
                    const viagem = veiculo.viagem;
                    if (!viagem || !viagem.registros || viagem.registros.length === 0) return null;

                    const ultimoPonto = viagem.registros[viagem.registros.length - 1];

                    const dataObj = new Date(ultimoPonto.timestamp);
                    const dataFormatada = dataObj.toLocaleDateString("pt-BR", {
                        timeZone: "America/Sao_Paulo",
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                    });
                    const horaFormatada = dataObj.toLocaleTimeString("pt-BR", {
                        timeZone: "America/Sao_Paulo",
                        hour: "2-digit",
                        minute: "2-digit",
                    });
                    const ultimoHorario = `${horaFormatada}, ${dataFormatada}`;
                    const position = [parseFloat(ultimoPonto.latitude), parseFloat(ultimoPonto.longitude)];

                    if (!position[0] || !position[1]) return null;

                    return (
                        <Marker
                            key={veiculo.id}
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
                                    <b>Veículo: {veiculo.identificador}</b><br />
                                    <b>Motorista:</b> {viagem.motorista.nome}<br />
                                    Última leitura às <b>{ultimoHorario}</b><br />
                                    <button className='botaoPopUpMapa'>Ver mais</button>
                                </div>
                            </Popup>
                        </Marker>
                    );
                }) : null}

                {viagemSelecionada && (() => {
                    const veiculoComViagem = viagens.find(v => v.viagem.id === viagemSelecionada);
                    if (!veiculoComViagem) return null;

                    const pontos = veiculoComViagem.viagem.registros.map(p =>
                        [parseFloat(p.latitude), parseFloat(p.longitude)]
                    );

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