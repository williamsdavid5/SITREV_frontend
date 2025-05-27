import { useNavigate } from "react-router-dom"
import api from "../server/api";
import { useEffect, useState } from "react";
import '../styles/home.css';

import MenuSuperior from "../components/MenuSuperior";
import Camada from "../components/Camada";

import loadingGif from '../assets/loadingGif.gif'

export default function Home() {

    const [carregando, setCarregando] = useState(true);
    const [camadas, setCamadas] = useState([]);

    useEffect(() => {
        async function resgatarCamadas() {
            try {
                const resposta = await api.get('/cercas/camadas/agrupadas');
                setCamadas(resposta.data);
                console.log(camadas);
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
                <h1>Carregando dados...</h1>
            </div>
        )
    }

    return (
        <>
            <MenuSuperior></MenuSuperior>
            <main id="mainHome">
                <div className="janelaLateralPequena">
                    <h2>Camadas</h2>
                    {Object.entries(camadas).map(([nome, cercas]) => {
                        return (
                            <Camada key={nome} nome={nome} cercas={cercas}></Camada>
                        )
                    })}

                </div>
                <div className="content">


                </div>

            </main>
        </>
    )
}