import './styles/modalCerca.css'
import fecharIcon from '../assets/fecharIcon.png'

export default function ModalCerca({ setModalVisivel }) {
    return (
        <div className='modalBackground'>
            <div className='modalCercaJanela'>
                <div className='tituloModal'>
                    <h2 className='h2_modal'>Cerca</h2>
                    <img src={fecharIcon} alt="" className='fecharIconModal' onClick={() => setModalVisivel(false)} />
                </div>

                <p className='p_modal'>Tipo</p>
                <select name="" id="" className='selectModal'>
                    <option value="">Limitador de velocidade</option>
                    <option value="">Limitador de área</option>
                </select>
                <p className='p_modal'>Nome</p>
                <input type="text" name="" id="" className='inputModal' placeholder='Nome da cerca' />
                <div className='divisaoVertical'>
                    <div className='divisaoVerticalAuxiliar' style={{ marginRight: '15px' }}>
                        <p className='p_modal'>Limite</p>
                        <input type="text" name="" id="" className='inputModal' placeholder='Km/h' />
                    </div>
                    <div className='divisaoVerticalAuxiliar' style={{ marginLeft: '15px' }}>
                        <p className='p_modal'>Limite na chuva</p>
                        <input type="text" name="" id="" className='inputModal' placeholder='Km/h' />
                    </div>
                </div>
                <div className='divisaoVertical'>
                    <div className='divisaoVerticalAuxiliar' style={{ marginRight: '15px' }}>
                        <p className='p_modal'>Cor</p>
                        <input type="color" name="" id="" />
                    </div>
                    <div className='divisaoVerticalAuxiliar' style={{ marginLeft: '15px' }}>
                        <p className='p_modal'>Camada</p>
                        <select name="" id="" className='selectModal'>
                            <option value="">Camada 1</option>
                            <option value="">Camada 2</option>
                        </select>
                    </div>
                </div>
                <button className='botaoModal'>Salvar</button>
            </div>

        </div>
    )
}