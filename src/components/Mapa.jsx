import { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-polylinedecorator';
import { useMapEvent } from 'react-leaflet';
import { useRef } from 'react';
import api from '../server/api';
import './styles/mapa.css';
import veiculoIcon from '../assets/veiculoIcon.png';
import pontoIcon from '../assets/pontoIcon.png'
import startIcon from '../assets/startIcon.png';

import mapProviders from '../utils/mapProviders';

import ModalCerca from './ModalCerca';

//icon personalizado do veiculo
const vehicleIcon = new L.Icon({
    iconUrl: veiculoIcon,
    iconSize: [40, 40],
    iconAnchor: [15, 15],
    className: 'iconeVeiculo'
});

const pontoPercursoIcon = new L.Icon({
    iconUrl: pontoIcon, // ou apenas um link direto
    iconSize: [35, 35], // tamanho do ícone
    iconAnchor: [15, 15], // ponto do ícone que estará na coordenada
    popupAnchor: [0, -15], // onde o popup abrirá em relação ao ícone
    className: 'pontoIcon' // opcional
});

const starPercursotIcon = new L.Icon({
    iconUrl: startIcon, // ou apenas um link direto
    iconSize: [35, 35], // tamanho do ícone
    iconAnchor: [15, 15], // ponto do ícone que estará na coordenada
    popupAnchor: [0, -15], // onde o popup abrirá em relação ao ícone
    className: 'startIcon' // opcional
});

function LinhaComSetas({ pontos }) {
    const map = useMap();

    useEffect(() => {
        if (!pontos || pontos.length < 2) return;

        const latlngs = pontos.map(p => [parseFloat(p.latitude), parseFloat(p.longitude)]);

        // Linha pontilhada
        const linha = L.polyline(latlngs, {
            color: '#007bff',
            weight: 3,
            opacity: 0.7,
            dashArray: '6, 10' // padrão de linha pontilhada
        }).addTo(map);

        // Setas de direção (maiores e mais visíveis)
        const decorator = L.polylineDecorator(linha, {
            patterns: [
                {
                    offset: 25, // início da primeira seta
                    repeat: 150, // espaçamento entre setas
                    symbol: L.Symbol.arrowHead({
                        pixelSize: 16, // tamanho da seta (maior)
                        polygon: true,
                        pathOptions: {
                            color: '#007bff',
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

//para que as viagens não fiquem sempre visíveis
function MapaClickReset({ setViagemSelecionada }) {
    useMapEvent('click', () => {
        // Quando o usuário clicar em qualquer parte do mapa (não em markers)
        setViagemSelecionada(null);
    });

    return null;
}

// essa função é responsável por configurar os controles padrões do leaflet, dar funções a eles
function ControladorDesenho({
    cercas,
    cercaSelecionada,
    layerRefs,
    setModalVisivel,
    setNovaCercaCoordenadas,
    setCercaSelecionada,
    setVIagemSelecionada
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
                marker: false, //mudar caso queira marcar pontos e resgatar cooredenadas
                circlemarker: false,
            },
            edit: {
                featureGroup: drawnItems
            }
        });

        map.addControl(drawControl);
        map._drawControlAdded = true;

        map._drawnItems = drawnItems;

        L.Draw.Marker.prototype.options.icon = pontoPercursoIcon;

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

            poligono.on('click', () => {
                setVIagemSelecionada(null);
            });

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

function abrirNoMaps(lat, lng) {
    if (!lat || !lng) {
        console.warn("Coordenadas inválidas para compartilhamento.");
        return;
    }

    const url = `https://www.google.com/maps?q=${lat},${lng}`;

    // se estiver em um dispositivo mobile, tenta abrir o app do Maps
    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
    const link = isMobile ? `geo:${lat},${lng}?q=${lat},${lng}` : url;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(url)}`;

    window.open(link, "_blank");
}

async function compartilharLocalizacao(lat, lng) {
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    const mensagem = `Veja minha localização: ${url}`;

    if (navigator.share) {
        try {
            await navigator.share({
                title: "Minha localização",
                text: mensagem,
                url,
            });
        } catch (err) {
            console.error("Erro ao compartilhar:", err);
        }
    } else {
        // fallback: abre WhatsApp
        const linkWhatsapp = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
        window.open(linkWhatsapp, "_blank");
    }
}


export default function Mapa({ cercas, cercaSelecionada, setCercaSelecionada }) {

    const layerRefs = useRef({});
    const [modalVisivel, setModalVisivel] = useState(false);
    const [novaCercaCoordenadas, setNovaCercaCoordenadas] = useState(null);
    const [camadas, setCamadas] = useState(false);
    const [viagens, setViagens] = useState(null);
    const [viagemSelecionada, setVIagemSelecionada] = useState(null);

    const [currentProvider, setCurrentProvider] = useState(mapProviders.default);

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
            } catch (err) {
                console.log('erro ao resgatar registros dos veículos:', err);
                alert('Erro ao resgatar viagens');
            }
        }


        resgatarCamadas();
        resgatarViagens();
    }, [])

    function formatarDataHora(isoString) {
        const data = new Date(isoString);

        const dia = String(data.getUTCDate()).padStart(2, '0');
        const mes = String(data.getUTCMonth() + 1).padStart(2, '0');
        const ano = data.getUTCFullYear();

        const hora = String(data.getUTCHours()).padStart(2, '0');
        const minuto = String(data.getUTCMinutes()).padStart(2, '0');

        return `${dia}/${mes}/${ano} - ${hora}:${minuto}`;
    }


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
                    setVIagemSelecionada={setVIagemSelecionada}
                />

                <MapaClickReset
                    setViagemSelecionada={setVIagemSelecionada}
                />

                {viagens && Array.isArray(viagens) ? viagens.map((veiculo) => {
                    const viagem = veiculo.viagem;
                    if (!viagem || !viagem.registros || viagem.registros.length === 0) return null;

                    const ultimoPonto = viagem.registros[viagem.registros.length - 1];

                    const ultimoHorario = formatarDataHora(ultimoPonto.timestamp);
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
                                    Última leitura: <b>{ultimoHorario}</b><br />
                                    {/* <button className='botaoPopUpMapa'>Ver mais</button>  */}
                                    <button
                                        className='botaoPopUpMapa'
                                        onClick={() => {
                                            const [lat, lng] = position;
                                            compartilharLocalizacao(lat, lng);
                                        }}
                                    >
                                        Compartilhar localização
                                    </button>
                                    <button
                                        className='botaoPopUpMapa'
                                        onClick={() => {
                                            const [lat, lng] = position;
                                            abrirNoMaps(lat, lng);
                                        }}
                                    >
                                        Google Maps
                                    </button>
                                </div>
                            </Popup>
                        </Marker>
                    );
                }) : null}

                {viagemSelecionada && (() => {
                    const veiculoComViagem = viagens.find(v => v.viagem.id === viagemSelecionada);
                    if (!veiculoComViagem) return null;

                    const pontos = veiculoComViagem.viagem.registros.filter(p => p.latitude && p.longitude);

                    return (
                        <>
                            {pontos.map((ponto, index) => {
                                const position = [parseFloat(ponto.latitude), parseFloat(ponto.longitude)];
                                const horario = formatarDataHora(ponto.timestamp);

                                // Define o ícone: start para o primeiro ponto, normal para os demais
                                const iconToUse = index === 0 ? starPercursotIcon : pontoPercursoIcon;

                                return (
                                    <Marker key={ponto.id} position={position} icon={iconToUse}>
                                        <Popup>
                                            <div>
                                                {index === 0 && (
                                                    <>
                                                        <b style={{ color: 'green' }}>INÍCIO DO PERCURSO</b><br />
                                                    </>
                                                )}
                                                <b>Horário:</b> {horario}<br />
                                                <b>Velocidade:</b> {ponto.velocidade} km/h<br />
                                                <b>Limite aplicado:</b> {ponto.limite_aplicado ?? 0} km/h<br />
                                                {ponto.chuva ? '🌧️ Chuva detectada' : '☀️ Tempo seco'}
                                                <button
                                                    className='botaoPopUpMapa'
                                                    onClick={() => {
                                                        const [lat, lng] = position;
                                                        compartilharLocalizacao(lat, lng);
                                                    }}
                                                >
                                                    Compartilhar localização
                                                </button>
                                                <button
                                                    className='botaoPopUpMapa'
                                                    onClick={() => {
                                                        const [lat, lng] = position;
                                                        abrirNoMaps(lat, lng);
                                                    }}
                                                >
                                                    Google Maps
                                                </button>
                                            </div>
                                        </Popup>
                                    </Marker>
                                );
                            })}

                            {/* Linha com setas indicando direção */}
                            <LinhaComSetas pontos={pontos} />
                        </>
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

            <div className='janelaProviders'>
                {/* select do provider */}
                <p className='pJanelaProviders'>Estilo de mapa:</p>
                <select
                    name="providerSelect"
                    id="providerSelect"
                    value={currentProvider}
                    onChange={(e) => setCurrentProvider(e.target.value)}
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
    );
}