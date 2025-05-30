import { useNavigate } from "react-router-dom"
import api from "../server/api";
import { useEffect, useState } from "react";
import '../styles/home.css';

import MenuSuperior from "../components/MenuSuperior";
import Camada from "../components/Camada";
import Mapa from "../components/Mapa";
import ModalCerca from "../components/ModalCerca";

import loadingGif from '../assets/loadingGif.gif'

export default function Home() {

    const [carregando, setCarregando] = useState(true);
    const [camadas, setCamadas] = useState([]);
    const [cercas, setcercas] = useState([]);

    const [cercaSelecionada, setCercaSelecionada] = useState(null);
    const [modalVisivel, setModalVisivel] = useState(true);

    useEffect(() => {
        async function resgatarCamadas() {
            try {

                let resposta = await api.get('/cercas/camadas');
                const camadasObj = resposta.data;

                const camadasArray = Object.entries(camadasObj)
                    .map(([_, camada]) => camada)
                    .sort((a, b) => a.nome.localeCompare(b.nome));


                setCamadas(camadasArray);


                console.log(resposta.data);

                resposta = await api.get('/cercas');
                setcercas(resposta.data);

                setCarregando(false);
            } catch (err) {
                console.log('erro ao resgatar cercas: ', err)
            }
        }

        resgatarCamadas();
    }, [])

    useEffect(() => {
        const handler = (e) => {
            setCercaSelecionada(e.detail);
            setModalVisivel(true);
        };

        window.addEventListener('abrirModalCerca', handler);

        return () => window.removeEventListener('abrirModalCerca', handler);
    }, []);


    if (carregando) {
        return (
            <div style={{ width: '100%', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                <img src={loadingGif} alt="" style={{ width: '50px', marginBottom: '20px' }} />
                <h2>Carregando dados...</h2>
            </div>
        )
    }

    return (
        <>
            <MenuSuperior></MenuSuperior>
            <main id="mainHome">
                <div className="janelaLateralPequena">
                    <h2>Camadas</h2>

                    {Array.isArray(camadas) &&
                        camadas.map((camada) => (
                            <Camada
                                key={camada.id}
                                nome={camada.nome}
                                cercas={camada.cercas}
                                selecionarcerca={setCercaSelecionada}
                            />
                        ))
                    }


                </div>
                <div className="content">
                    <Mapa cercas={cercas} cercaSelecionada={cercaSelecionada} ></Mapa>

                    {modalVisivel && (
                        <ModalCerca
                            setModalVisivel={setModalVisivel}
                            cercaSelecionada={cercaSelecionada}
                            camadas={camadas}
                        ></ModalCerca>
                    )}

                </div>

            </main>
        </>
    )
}