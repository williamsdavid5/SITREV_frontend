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
                let resposta = await api.get('/cercas/camadas/agrupadas');
                setCamadas(resposta.data);
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

                    {camadas && typeof camadas === 'object' &&
                        Object.entries(camadas).map(([nome, cercas]) => (
                            <Camada key={nome} nome={nome} cercas={cercas} selecionarcerca={setCercaSelecionada} />
                        ))
                    }


                </div>
                <div className="content">
                    <Mapa cercas={cercas} cercaSelecionada={cercaSelecionada} ></Mapa>

                    {modalVisivel && (
                        <ModalCerca setModalVisivel={setModalVisivel} ></ModalCerca>
                    )}

                </div>

            </main>
        </>
    )
}