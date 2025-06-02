import './styles/camada.css'
import { useState } from 'react'
import expandirIcon from '../assets/expandirIcon.png'
import editarIcon from '../assets/editarIcon.png'

export default function Camada({ nome, cercas, selecionarcerca, camada, onEditar }) {
    const [expandido, setExpandido] = useState(false);
    return (
        <div className={`camada ${expandido ? 'expandida' : ''}`}>
            <div className='nomeCamada' onClick={() => {
                setExpandido(!expandido);
            }}>
                <img
                    src={expandirIcon} alt=""
                    className={`expandirIcon ${expandido ? 'iconExpandido' : ''}`}
                />
                <p>{nome}</p>
                <button className="botaoEditarCamada" onClick={(e) => {
                    e.stopPropagation();
                    onEditar(camada);
                }}>

                    <img src={editarIcon} alt="" className='botaoEditarIcon' />

                </button>
            </div>

            {expandido && (
                <div className='camadaExpandida'>

                    {cercas.map(cerca => {
                        return (
                            <div className='cercaItem' key={cerca.id}>
                                <p className='cercaLista' onClick={() => selecionarcerca(cerca)}>{cerca.nome}</p>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}