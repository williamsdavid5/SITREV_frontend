import './styles/motoristasItemLista.css'

export default function MotoristaitemLista({ motorista, selecionado, aoSelecionar, mostrarPaginaMotoristaIndividual }) {
    const horario = motorista.ultimaLeitura?.horario;

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
            <p style={{ width: '100%' }}><b>{motorista.nome}</b></p>
            <div className="motoristaItemListaInformacoes">
                <p>Status atual: {motorista.status}</p>
                <p>Ultima leitura: {horario ? formatarDataHora(horario) : 'Sem leitura registrada'}</p>
            </div>
            <button
                className='botaoVerMaisMotorista'
                onClick={() => mostrarPaginaMotoristaIndividual(motorista.id)}
            >Ver mais</button>
        </div>
    );
}