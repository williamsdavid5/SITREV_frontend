import './styles/camada.css'
import { useState } from 'react'
import expandirIcon from '../assets/expandirIcon.png'

export default function Camada({ nome, cercas }) {
    const [expandido, setExpandido] = useState(false);
    return (
        <div className="camada">
            <div className='nomeCamada'>
                <p>{nome}</p>
                <img
                    src={expandirIcon} alt=""
                    className={`expandirIcon ${expandido ? 'iconExpandido' : ''}`}
                    onClick={() => {
                        setExpandido(!expandido);
                    }}
                />
            </div>

            {expandido && (
                <div className='camadaExpandida'>

                    {cercas.map(cerca => {
                        return (

                            <div className='cercaItem'>
                                <p key={cerca.id} className='cercaLista'>{cerca.nome}</p>
                            </div>

                        )
                    })}
                </div>
            )}
        </div>
    )
}