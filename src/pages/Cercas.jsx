import api from "../server/api";
import '../styles/cercas.css';

import { useEffect, useState } from "react";


import MenuSuperior from "../components/MenuSuperior";
import Camada from "../components/Camada"; //item na lista lateral
import Mapa from "../components/Mapa"; //mapa de cercas, é simplesmente "mapa" pois foi o primeiro componente mapa que eu criei
import ModalCerca from "../components/ModalCerca"; //modal para edição de cercas

//diferente do que o nome sugere, isto não é um modal, é uma pequena janela a ser encaixada na lista
import ModalEditarCamada from "../components/ModalEditarCamada";

//os nomes já sugerem o que é!
import ModalAplicandoMudancas from "../components/ModalAplicandoMudancas";
import ModalCarregandoDados from "../components/ModalCarregandoDados";

//pagina responsável pelo gerenciamento de cercas e camadas de cerca
export default function Cercas() {

    const [carregando, setCarregando] = useState(true); //para mostrar o loading
    //para armazenar os dados do banco de dados
    const [camadas, setCamadas] = useState([]);
    const [cercas, setcercas] = useState([]);

    const [cercaSelecionada, setCercaSelecionada] = useState(null); //para cercas selecionadas pelo usuário

    const [modalVisivel, setModalVisivel] = useState(false); //modal de edição de cerca
    const [popUpNovaCamada, setPopUpNovaCamada] = useState(false); //popUp de criação de uma camada
    const [modalEditarCamadaAberto, setModalEditarCamadaAberto] = useState(false); //modal de edição de camada
    //camada selecionada
    const [camadaSelecionada, setCamadaSelecionada] = useState(null);
    const [modalMudancas, setModalMudancas] = useState(false); //modal de aplicando mudanças

    //função que resgata os dados do banco de dados
    //camadas e cercas
    async function resgatarCamadas() {
        try {

            let resposta = await api.get('/cercas/camadas');
            const camadasObj = resposta.data;

            const camadasArray = Object.entries(camadasObj)
                .map(([_, camada]) => camada)
                .sort((a, b) => a.nome.localeCompare(b.nome));


            setCamadas(camadasArray);

            resposta = await api.get('/cercas');
            setcercas(resposta.data);

            setCarregando(false);
        } catch (err) {
            console.log('erro ao resgatar cercas: ', err)
        }
    }

    //para que seja possível atualizar as ceras por dentro de outros componentes
    useEffect(() => {
        const atualizar = () => resgatarCamadas();
        window.addEventListener('atualizarCercas', atualizar);
        return () => window.removeEventListener('atualizarCercas', atualizar);
    }, []);

    //resgata camadas ao entrar nessa tela
    useEffect(() => {
        resgatarCamadas();
    }, [])

    //escuta o evento "abrir modal cerca"
    //quando isso acontece, a cerca selecionada é setada
    //e o modal de edição de cercas é aberto
    useEffect(() => {
        const handler = (e) => {
            setCercaSelecionada(e.detail);
            setModalVisivel(true);
        };

        window.addEventListener('abrirModalCerca', handler);

        return () => window.removeEventListener('abrirModalCerca', handler);
    }, []);

    //para criar uma nova camada
    async function criarNovaCamada() {
        try {
            const nome = document.getElementById('nomeNovaCamada').value;

            if (nome == '') {
                alert('Dê algum nome!!');
                return;
            }

            const dado = {
                nome
            }

            setModalMudancas(true); //abre o modal de mudanças

            await api.post(`/camadas`, dado);
            alert('Camada criada!');
            resgatarCamadas();
            setPopUpNovaCamada(false);

            setModalMudancas(false);

        } catch (err) {
            console.log('Erro ao criar nova camada: ', err);
            alert('Erro ao criar a nova camada!');
            setModalMudancas(false);
        }
    }

    // isso será exibido ao carregar
    if (carregando) {
        return (
            <ModalCarregandoDados></ModalCarregandoDados>
        )
    }

    //uma função simples para abrir o modal de editar camadas
    //mais uma vez, não é um modal, é uma janela encaixada na lista lateral!
    function abrirModalEditarCamada(camada) {
        setCamadaSelecionada(camada);
        setModalEditarCamadaAberto(true);
    }


    return (
        <>
            <main id="mainHome">
                <div className="janelaLateralPequena">
                    <div className="divTituloCamadas">
                        <h2>Cercas</h2>
                        <button className="botaoNovaCamada" onClick={() => {
                            setPopUpNovaCamada(true);
                            setModalEditarCamadaAberto(false);
                        }}>Nova Camada</button>
                    </div>
                    {popUpNovaCamada && (
                        <div className="novaCamada">
                            <p>Nova Camada</p>
                            <input type="text" name="nomaNovaCamada" id="nomeNovaCamada" placeholder="Nome" />
                            <button className="botaoSalvarNovaCamada" onClick={() => {
                                criarNovaCamada();
                            }}>Salvar</button>
                            <button onClick={() => {
                                setPopUpNovaCamada(false)
                            }}>Cancelar</button>
                        </div>
                    )}

                    {modalEditarCamadaAberto && (
                        <ModalEditarCamada
                            camada={camadaSelecionada}
                            onClose={() => setModalEditarCamadaAberto(false)}
                            onAtualizar={resgatarCamadas}
                        />
                    )}

                    {(Array.isArray(camadas) ? camadas : []).map((camada) => (
                        <Camada
                            key={camada?.id || Math.random()}
                            nome={camada?.nome || ''}
                            cercas={camada?.cercas || []}
                            camada={camada}
                            selecionarcerca={setCercaSelecionada}
                            onEditar={abrirModalEditarCamada}
                        />
                    ))}

                </div>
                <div className="content">
                    <Mapa cercas={cercas} cercaSelecionada={cercaSelecionada} setCercaSelecionada={setCercaSelecionada} ></Mapa>
                    <div className="divAuxiliarSombra" style={{ width: '80%' }}></div>

                    {modalVisivel && (
                        <ModalCerca
                            setModalVisivel={setModalVisivel}
                            cercaSelecionada={cercaSelecionada}
                            camadas={camadas}
                            novaCercaCoordenadas={null}
                            setCercaSelecionada={setCercaSelecionada}
                        ></ModalCerca>
                    )}
                </div>

                {modalMudancas && (
                    <ModalAplicandoMudancas></ModalAplicandoMudancas>
                )}

            </main>
            <MenuSuperior></MenuSuperior>
        </>
    )
}