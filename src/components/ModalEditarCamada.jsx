// src/components/ModalEditarCamada.jsx
import { useState } from 'react';
import './styles/modalEditarCamada.css'
import api from '../server/api';

import ModalAplicandoMudancas from './ModalAplicandoMudancas';

export default function ModalEditarCamada({ camada, onClose, onAtualizar }) {
    const [novoNome, setNovoNome] = useState(camada.nome);
    const [mensagemErro, setMensagemErro] = useState('');
    const [aplicandoMudancas, setAplicandoMudancas] = useState(false);

    async function salvarAlteracoes() {
        try {
            setAplicandoMudancas(true);
            await api.put(`/camadas/${camada.id}`, { nome: novoNome });
            onAtualizar();
            setAplicandoMudancas(false);
            onClose();
        } catch (err) {
            console.error('Erro ao atualizar camada:', err);
            alert('Erro ao atualizar camada.');
            setAplicandoMudancas(false);
        }
    }

    async function excluirCamada() {
        const confirmar = window.confirm("Tem certeza que deseja excluir esta camada?");
        if (!confirmar) return;
        setAplicandoMudancas(true);
        try {
            await api.delete(`/camadas/${camada.id}`);
            alert("Camada excluída com sucesso!");
            onAtualizar();
            setAplicandoMudancas(false);
            onClose();
        } catch (err) {
            console.error("Erro ao excluir camada:", err);

            // Caso específico: camada possui cercas
            if (err.response?.data?.possuiCercas) {
                setMensagemErro("Esta camada possui cercas associadas e não pode ser excluída.");
            } else {
                alert("Erro ao excluir camada.");
            }
            setAplicandoMudancas(false);
        }
    }

    return (
        <>
            <div className="editarCamada">
                <p>Editar Camada</p>
                <label htmlFor="nomeCamada">Nome:</label>
                <input
                    id="nomeCamada"
                    type="text"
                    value={novoNome}
                    onChange={(e) => setNovoNome(e.target.value)}
                />

                {mensagemErro && <p className="erroCercasAssociadasCamada">{mensagemErro}</p>}

                <button onClick={excluirCamada} id='botaoExcluirCamada'>Excluir esta camada</button>

                <div className="botoesEditarCamada">
                    <button onClick={salvarAlteracoes} id='botaoSalvarEditarCamada'>Salvar</button>
                    <button onClick={onClose} id='botaoCancelarEditarCamada'>Cancelar</button>
                </div>
            </div>

            {aplicandoMudancas && (
                <ModalAplicandoMudancas></ModalAplicandoMudancas>
            )}
        </>
    );
}