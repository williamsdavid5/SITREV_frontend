import loadingGif from '../assets/loadingGif.gif'

export default function ModalCarregandoDados() {
    return (
        <div style={{ width: '100%', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            <img src={loadingGif} alt="" style={{ width: '50px', marginBottom: '20px' }} />
            <h2>Carregando dados...</h2>
        </div>
    )
}