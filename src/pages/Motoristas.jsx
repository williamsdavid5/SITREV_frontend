import MenuSuperior from "../components/MenuSuperior"
import '../styles/motoristas.css'
import api from '../server/api.js'

export default function Motoristas() {

    async function resgatarMotoristas() {
        try {
            let motoristas
        } catch (err) {
            console.log('erro ao resgatar motoristas, ', err);
            alert('Erro ao resgatar motoristas!');
        }
    }

    return (
        <>
            <div className="contentMotoristas">
                <div className="esquerdaMotoristas">
                    <h1>Motoristas</h1>
                    <p>Procure entre todos os motoristas cadastrados no sistema</p>
                    <input type="text" name="" id="inputPesquisarMotorista" placeholder="Pesquisar" />
                </div>

                <div className="direitaMotoristas">
                    <p>direita</p>
                </div>
            </div>

            <MenuSuperior></MenuSuperior>

        </>
    )
}