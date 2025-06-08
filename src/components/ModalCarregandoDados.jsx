import loadingGif from '../assets/loadingGif.gif'
import './styles/modalCarregandoDados.css'
import MenuSuperior
    from './MenuSuperior'
export default function ModalCarregandoDados() {
    return (
        <>
            <div className='fundoModalCarregando'>
                <img src={loadingGif} alt="" className='loadingGif' />
                <h2>Carregando dados...</h2>
            </div>
            <MenuSuperior></MenuSuperior>
        </>

    )
}