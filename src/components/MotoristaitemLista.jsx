import './styles/motoristasItemLista.css'

export default function MotoristaitemLista({ motorista }) {
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
        <div className="motoristaItemLista">
            <p><b>{motorista.nome}</b></p>
            <div className="motoristaItemListaInformacoes">
                <p>Status atual: {motorista.status}</p>
                <p>Ultima leitura: {horario ? formatarDataHora(horario) : 'Sem leitura registrada'}</p>
            </div>
        </div>
    );
}