import './styles/motoristasItemLista.css'
import { useEffect } from 'react';

export default function VeiculoItemLista({ veiculo, selecionado, aoSelecionar, mostrarPaginaVeiculoIndividual }) {
    const horario = veiculo.ultima_leitura;

    function formatarDataHora(leitura) {
        const data = new Date(leitura);
        const hora = String(data.getUTCHours()).padStart(2, '0');
        const minuto = String(data.getUTCMinutes()).padStart(2, '0');
        const dia = String(data.getUTCDate()).padStart(2, '0');
        const mes = String(data.getUTCMonth() + 1).padStart(2, '0');
        const ano = data.getUTCFullYear();
        return `${hora}:${minuto} - ${dia}/${mes}/${ano}`;
    }

    // useEffect(() => {
    //     console.log(veiculo.ultima_leitura);
    // }, [])

    return (
        <div className={`motoristaItemLista ${selecionado ? 'motoristaSelecionadoLista' : ''}`} onClick={aoSelecionar}>
            <p style={{ width: '100%' }}><b>{veiculo.identificador}</b></p>
            <div className="motoristaItemListaInformacoes">
                <p><b>Modelo:</b> {veiculo.modelo}</p>
                <p><b>Ultima leitura:</b> {horario ? formatarDataHora(horario) : 'Sem leitura registrada'}</p>
                <p><b>Ultimo motorista: </b> {veiculo.motorista.nome}</p>
            </div>
            <button
                className='botaoVerMaisMotorista'
                onClick={() => mostrarPaginaVeiculoIndividual(veiculo.id)}
            >Ver mais</button>
        </div>
    );
}