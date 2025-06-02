import loadingGif from '../assets/loadingGif.gif'
import './styles/modalAplicandoMudancas.css'

export default function ModalAplicandoMudancas() {
    return (
        <div className="modalBackground modalAplicandoMudancas">
            <img src={loadingGif} alt="" className='loadingGif' />
            <h2>Aplicando Mudanças...</h2>
        </div>
    )
}