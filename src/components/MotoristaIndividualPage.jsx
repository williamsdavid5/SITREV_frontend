import { useEffect, useState } from 'react'
import './styles/motoristaIndividualPage.css'
import api from '../server/api';

import loadingGif from '../assets/loadingGif.gif';
import fecharIcon from '../assets/fecharIcon.png'

export default function MotoristaIndividualPage({ motoristaId, setPaginaMotoristaInidividual }) {

    const [motorista, setMotorista] = useState();
    const [carregando, setCarregando] = useState(true);

    async function resgatarMotorista() {
        try {
            let resposta = await api.get(`motoristas/${motoristaId}`);
            setMotorista(resposta.data);
            console.log(resposta.data);
            setCarregando(false);
        } catch (err) {
            console.log('erro ao resgatar motorista individual ', err);
            alert('Erro ao resgatar motorista individual');
            setCarregando(false);
        }
    }

    useEffect(() => {
        resgatarMotorista();
    }, [])

    if (carregando) {
        return (
            <div className='divCarregandoMotorista'>
                <img src={loadingGif} alt="" className='loadingGif' />
                <h2>Carregando...</h2>
            </div>
        )
    } else {
        return (
            <div className='paginaMotoristaIndividual'>
                <div id='motoristaIndividualPageEsquerda'>
                    <div className='topoMotoristaIndividual'>
                        <h2>Motorista</h2>
                        <button className='botaoFechar' onClick={() => setPaginaMotoristaInidividual(false)}>
                            <img className='botaofecharImg' src={fecharIcon} alt="" />
                        </button>
                    </div>
                    <div className='motoristaDemaisInformações'>
                        <h1>{motorista.nome}</h1>
                        <p></p>
                    </div>
                </div>
                <div id='motoristaIndividualPageDireita'>
                </div>
            </div>
        )
    }
}