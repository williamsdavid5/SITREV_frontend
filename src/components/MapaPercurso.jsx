import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import './styles/mapa.css';
import 'leaflet-polylinedecorator';

import { useEffect, useState } from 'react';
import { useMapEvent } from 'react-leaflet';

import { MapContainer, Marker, Popup, TileLayer, useMap, Polyline, Polygon, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw';

import api from '../server/api'; //logica de conexão com a API
import mapProviders from '../utils/mapProviders'; //providers para alterar a visualização do mapa

//icones personalizados
import veiculoIcon from '../assets/veiculoIcon.png';
import veiculoIconSelecionado from '../assets/veiculoIconSelecionado.png'
import loadingGif from '../assets/loadingGif.gif'
import pontoIcon from '../assets/pontoIcon.png'
import startIcon from '../assets/startIcon.png';
import alertaIcon from '../assets/alertaIcon.png';

const starPercursotIcon = new L.Icon({
    iconUrl: startIcon, // ou apenas um link direto
    iconSize: [35, 35], // tamanho do ícone
    iconAnchor: [15, 15], // ponto do ícone que estará na coordenada
    popupAnchor: [0, -15], // onde o popup abrirá em relação ao ícone
    className: 'startIcon' // opcional
});

//icon personalizado do veiculo
const vehicleIcon = new L.Icon({
    iconUrl: veiculoIcon,
    iconSize: [40, 40],
    iconAnchor: [15, 15],
    className: 'iconeVeiculo'
});

const vehicleIconSelecionado = new L.Icon({
    iconUrl: veiculoIconSelecionado,
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

function LinhaComSetasVermelha({ pontos }) {
    const map = useMap();

    useEffect(() => {
        if (!pontos || pontos.length < 2) return;

        const latlngs = pontos.map(p => [parseFloat(p[0]), parseFloat(p[1])]);

        const linha = L.polyline(latlngs, {
            color: '#ff0000',
            weight: 3,
            opacity: 0.7,
            dashArray: '6, 10'
        }).addTo(map);

        // Setas de direção vermelhas
        const decorator = L.polylineDecorator(linha, {
            patterns: [
                {
                    offset: 25,
                    repeat: 150,
                    symbol: L.Symbol.arrowHead({
                        pixelSize: 16,
                        polygon: true,
                        pathOptions: {
                            color: '#ff0000',
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
function MapaClickReset({ setViagemSelecionada, setMotoristaSelecionado }) {
    useMapEvent('click', () => {
        // Quando o usuário clicar em qualquer parte do mapa (não em markers)
        setViagemSelecionada(null);
        setMotoristaSelecionado(null);
    });

    return null;
}

//o mapa percurso oferece uma visualização por veiculo, util para atualizar em tempo real
//é usado na tela inicial para servir apenas como monitoramento
//é usado na tela de motoristas para que o usuário possa localiza-los com facilidade
export default function MapaPercurso({
    motoristaSelecionado,
    setMotoristaSelecionado,
    mostrarPaginaMotoristaIndividual,
    centralizarProximoMotorista
}) {
    const [currentProvider, setCurrentProvider] = useState(mapProviders.default); //o provider que está sendo usado
    //para armazenar os dados coletados da API
    const [cercas, setCercas] = useState([]);
    const [viagens, setViagens] = useState([]);
    //para mostrar o percurso do veiculo selecionado no mapa
    const [viagemSelecionada, setVIagemSelecionada] = useState(null);
    //para a tela de loading ser mostrada enquanto os dados são carregados
    const [carregando, setCarregando] = useState(false);
    const [alertas, setAlertas] = useState([]);

    const [mostrarCercas, setMostrarCercas] = useState(true);

    // para resgatar cercas obviamente
    async function resgatarCercas() {
        try {
            setCarregando(true);
            const cercas = await api.get('/cercas');
            setCercas(cercas.data);
            setCarregando(false);
        } catch (err) {
            console.log(err);
            alert('Erro ao resgatar ou desenhar cercas');
            setCarregando(false);
        }
    }

    async function resgatarAlertas() {
        try {
            const resposta = await api.get('/alertas');
            setAlertas(resposta.data);
        } catch (err) {
            console.log('Erro ao resgatar alertas: ', err);
            alert('Erro ao resgatar alertas');
        }
    }

    // para resgatar veiculos e seus viagens
    //as viagens estão vindo em anexo em cada veiculo no json recebido
    async function resgatarVeiculosRegistro() {
        try {
            const resposta = await api.get('/veiculos/registros');
            setViagens(resposta.data);
        } catch (err) {
            console.log('Erro ao resgatar viagens: ', err);
            alert('Erro ao resgatar viagens');
        }
    }

    // para centralizar os motoristas selecionados no mapa
    //a flag centralizarProximoMotorista define se deve ou não centralizar o marcador do veiculo no mapa
    //ao clicar no marcador no mapa, ele mesmo torna a flag falsa para impedir a centralização
    //mas ao clicar no item na lista lateral, essa função é chamada onde as coordenadas do motorista são coletadas ao mesmo tempo que
    //a flag muda para true, assim o marcador do veiculo é sim centralizado
    function CentralizarMapa({ coordenadas }) {
        const map = useMap();

        useEffect(() => {
            if (coordenadas && centralizarProximoMotorista.current) {
                map.setView(coordenadas, 17);
            }
            centralizarProximoMotorista.current = true;
        }, [coordenadas]);

        return null;
    }

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



    //se houver um motorista selecionado, ele sera armazenado aqui
    const motoristaSelecionadoObj = motoristaSelecionado
        ? viagens.find(v => v.viagem.motorista.id === motoristaSelecionado)
        : null;

    //mesma logica de cima, porém para posições
    //isso é usado para a logica de centralizar no mapa
    const posicaoMotoristaSelecionado =
        motoristaSelecionadoObj && motoristaSelecionadoObj.viagem.registros.length > 0
            ? [
                parseFloat(motoristaSelecionadoObj.viagem.registros.at(-1).latitude),
                parseFloat(motoristaSelecionadoObj.viagem.registros.at(-1).longitude)
            ]
            : null;

    //para resgatar os dados imediatamente ao entrar na pagina
    useEffect(() => {
        resgatarCercas();
        resgatarVeiculosRegistro();
        resgatarAlertas(); // Adicione esta linha
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
        <div className='mapaPercurso'>
            {/* container do mapa */}
            <MapContainer center={[-3.76, -49.67]} zoom={15} style={{ height: '100vh', width: '100%' }}>
                {/* responsavel por controlar a visualização/provider */}
                <TileLayer
                    key={currentProvider}
                    url={mapProviders[currentProvider].url}
                    maxZoom={mapProviders[currentProvider].maxZoom}
                    attribution={mapProviders[currentProvider].attribution}
                />

                {/* logica de centralizar no mapa */}
                {posicaoMotoristaSelecionado && centralizarProximoMotorista.current && (
                    <CentralizarMapa coordenadas={posicaoMotoristaSelecionado} />
                )}

                {/* desenha as cercas */}
                {mostrarCercas && cercas.map((cerca) => {
                    const coordenadas = cerca.coordenadas.map(coord => [parseFloat(coord[0]), parseFloat(coord[1])]);

                    return (
                        <Polygon
                            key={cerca.id}
                            positions={coordenadas}
                            pathOptions={{ color: cerca.cor }}
                            eventHandlers={{
                                click: () => {
                                    setVIagemSelecionada(null);
                                    setMotoristaSelecionado(null);
                                    // console.log(cerca);
                                }
                            }}
                        >
                            <Popup>
                                Cerca: <strong>{cerca.nome}</strong><br />
                                <b>Camada:</b> {cerca.camada.nome} <br />
                                <b>Tipo:</b> {cerca.tipo}<br />
                                <b>Limite normal:</b> {cerca.velocidade_max}<br />
                                <b>Limie chuva:</b> {cerca.velocidade_chuva}<br />
                            </Popup>
                        </Polygon>
                    );
                })}

                <MapaClickReset
                    setViagemSelecionada={setVIagemSelecionada}
                    setMotoristaSelecionado={setMotoristaSelecionado}
                />

                {/* para desenhar os marcadores dos veiculos no mapa */}
                {viagens && Array.isArray(viagens) ? viagens.map((veiculo) => {
                    const viagem = veiculo.viagem;
                    if (!viagem || !viagem.registros || viagem.registros.length === 0) return null;

                    const ultimoPonto = viagem.registros[viagem.registros.length - 1];

                    const dataObj = new Date(ultimoPonto.timestamp);

                    // const ultimoHorario = `${horaFormatada}, ${dataFormatada}`;
                    const ultimoHorario = formatarDataHora(ultimoPonto.timestamp);
                    const position = [parseFloat(ultimoPonto.latitude), parseFloat(ultimoPonto.longitude)];

                    if (!position[0] || !position[1]) return null;

                    return (
                        <Marker
                            key={veiculo.id}
                            position={position}
                            icon={motoristaSelecionado === viagem.motorista.id ? vehicleIconSelecionado : vehicleIcon}
                            eventHandlers={{
                                click: () => {
                                    centralizarProximoMotorista.current = false;
                                    setVIagemSelecionada(viagem.id === viagemSelecionada ? null : viagem.id);
                                    setMotoristaSelecionado(viagem.motorista.id);
                                }
                            }}

                        >
                            <Popup>
                                <div>
                                    <b>Veículo: {veiculo.identificador}</b><br />
                                    <b>Motorista:</b> {viagem.motorista.nome}<br />
                                    Última leitura: <b>{ultimoHorario}</b><br />
                                    {/* <button
                                        className='botaoPopUpMapa'
                                        onClick={() => mostrarPaginaMotoristaIndividual(viagem.motorista.id)}
                                    >
                                        Informações do motorista
                                    </button> */}
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

                                // Lógica simples: verifica se a velocidade ultrapassou o limite
                                const velocidade = parseFloat(ponto.velocidade) || 0;
                                const limite = parseFloat(ponto.limite_aplicado) || 0;
                                const pontoTemAlerta = velocidade > limite;

                                // Define o ícone baseado na verificação de velocidade
                                const iconToUse = pontoTemAlerta
                                    ? L.icon({
                                        iconUrl: alertaIcon,
                                        iconSize: [30, 30],
                                        iconAnchor: [15, 15],
                                        className: 'iconeAlerta'
                                    })
                                    : (index === 0 ? starPercursotIcon : pontoPercursoIcon);

                                return (
                                    <Marker key={ponto.id} position={position} icon={iconToUse}>
                                        <Popup>
                                            <div>
                                                {pontoTemAlerta && (
                                                    <>
                                                        <b style={{ color: 'red' }}>EXCESSO DE VELOCIDADE</b><br />
                                                        <b>Velocidade:</b> {velocidade} km/h<br />
                                                        <b>Limite:</b> {limite} km/h<br />
                                                        <b>Diferença:</b> +{(velocidade - limite).toFixed(1)} km/h<br />
                                                    </>
                                                )}
                                                {index === 0 && !pontoTemAlerta && (
                                                    <>
                                                        <b style={{ color: 'green' }}>📍 INÍCIO DO PERCURSO</b><br />
                                                    </>
                                                )}
                                                {!pontoTemAlerta && index !== 0 && (
                                                    <>
                                                        <b>Velocidade:</b> {velocidade} km/h<br />
                                                        <b>Limite:</b> {limite} km/h<br />
                                                    </>
                                                )}
                                                <b>Horário:</b> {horario}<br />
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
                <div className='divCheckJanelaProviders'>
                    <input
                        type="checkbox"
                        id='checkVerCercas'
                        checked={mostrarCercas}
                        onChange={(e) => setMostrarCercas(e.target.checked)}
                    />
                    <p className='pJanelaProviders'>Exibir cercas</p>
                </div>
            </div>


            {carregando && (
                <div className='divCarregando'>
                    <img src={loadingGif} alt="" />
                    <p> <b>Carregando dados, aguarde...</b> </p>
                </div>
            )}
        </div>
    )
}