import { useEffect, useState } from "react"
import MenuSuperior from "../components/MenuSuperior"
import '../styles/registros.css'
import api from "../server/api";

import ModalCarregandoDados from "../components/ModalCarregandoDados";

export default function Registros() {

    const [registros, setRegistros] = useState([]);
    const [carregando, setcarregando] = useState(true);

    async function resgatarRegistros() {
        try {
            let resposta = await api.get('/viagens/limpo');
            setRegistros(resposta.data);
            console.log(resposta.data);
            setcarregando(false);
        } catch (err) {
            console.log('Erro ao resgatar registros, ', err);
            alert('Erro ao resgatar registros');
        }
    }

    function formatarDataHora(isoString) {
        const data = new Date(isoString);

        const dia = String(data.getUTCDate()).padStart(2, '0');
        const mes = String(data.getUTCMonth() + 1).padStart(2, '0');
        const ano = data.getUTCFullYear();

        const hora = String(data.getUTCHours()).padStart(2, '0');
        const minuto = String(data.getUTCMinutes()).padStart(2, '0');

        return `${dia}/${mes}/${ano} - ${hora}:${minuto}`;
    }

    useEffect(() => {
        resgatarRegistros();
    }, [])

    if (carregando) {
        return (
            <ModalCarregandoDados></ModalCarregandoDados>
        )
    } else {

        return (
            <>
                <div className="registrosPage">
                    <div className="esquerdaRegistros">
                        <div className="topoRegistros">
                            <h2>Registros</h2>
                            <p>Busque entre todos os registros armazenados pelo sistema</p>
                            <input type="text" name="" id="" placeholder="Pesquise qualquer coisa" className="inputPesquisaQualquerCoisa" />
                            <p>Pesquisar por data:</p>
                            <div className="pesquisaPorData">
                                <div className="pesquisaPorDataInputs">
                                    <input type="number" placeholder="DD" className="inputdata" />
                                    <input type="number" placeholder="MM" className="inputdata" />
                                </div>
                                <p>a</p>
                                <div className="pesquisaPorDataInputs">
                                    <input type="number" placeholder="DD" className="inputdata" />
                                    <input type="number" placeholder="MM" className="inputdata" />
                                </div>
                            </div>
                        </div>
                        <div className="divRegistros">
                            {registros.map(registro => {
                                return (
                                    <div className="registroItemLista">
                                        <p>{formatarDataHora(registro.data_viagem)}</p>
                                        <p><b>Motorista: </b> {registro.nome_motorista}</p>
                                        <p><b>Veículo usado: </b>{registro.identificador_veiculo}</p>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                    <div className="direitaRegistros">
                        <p>direita</p>
                    </div>
                </div>
                <MenuSuperior></MenuSuperior>
            </>
        )
    }
}