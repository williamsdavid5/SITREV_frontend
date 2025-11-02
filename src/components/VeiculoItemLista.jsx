import './styles/motoristasItemLista.css'

export default function VeiculoItemLista({ veiculo, selecionado, aoSelecionar, mostrarPaginaVeiculoIndividual }) {
    const horario = veiculo.ultimaLeitura?.horario;

    function formatarDataHora(leitura) {
        const data = new Date(leitura);
        const hora = String(data.getUTCHours()).padStart(2, '0');
        const minuto = String(data.getUTCMinutes()).padStart(2, '0');
        const dia = String(data.getUTCDate()).padStart(2, '0');
        const mes = String(data.getUTCMonth() + 1).padStart(2, '0');
        const ano = data.getUTCFullYear();
        return `${hora}:${minuto} - ${dia}/${mes}/${ano}`;
    }

    return (
        <div className={`motoristaItemLista ${selecionado ? 'motoristaSelecionadoLista' : ''}`} onClick={aoSelecionar}>
            <p style={{ width: '100%' }}><b>{veiculo.identificador}</b></p>
            <div className="motoristaItemListaInformacoes">
                <p><b>Modelo:</b> {veiculo.modelo}</p>
                <p><b>Ultima leitura:</b> {horario ? formatarDataHora(horario) : 'Sem leitura registrada'}</p>
            </div>
            <button
                className='botaoVerMaisMotorista'
                onClick={() => mostrarPaginaVeiculoIndividual(veiculo.id)}
            >Ver mais</button>
        </div>
    );
}