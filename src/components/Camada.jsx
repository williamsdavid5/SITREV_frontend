import './styles/camada.css'
import { useState } from 'react'
import expandirIcon from '../assets/expandirIcon.png'

export default function Camada({ nome, cercas, selecionarcerca }) {
    const [expandido, setExpandido] = useState(false);
    return (
        <div className="camada">
            <div className='nomeCamada' onClick={() => {
                setExpandido(!expandido);
            }}>
                <p>{nome}</p>
                <img
                    src={expandirIcon} alt=""
                    className={`expandirIcon ${expandido ? 'iconExpandido' : ''}`}
                />
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