import { useNavigate } from "react-router-dom"
import api from "../server/api";
import { useEffect, useState } from "react";

export default function Home() {

    const [motoristas, setMotoristas] = useState();

    useEffect(() => {
        async function resgatarMotoristas() {
            try {
                const resposta = await api.get('/motoristas');
                setMotoristas(resposta);
                console.log(motoristas);
            } catch (err) {
                setMotoristas(`Erro ao resgatar motoristas: ${err}`);
            }
        }

        resgatarMotoristas();
    }, [])

    const navigate = useNavigate();

    function irParaMotoristas() {
        navigate('/motoristas');
    }

    return (
        <>
            <h1>Tela inicial</h1>
            <button onClick={irParaMotoristas}>
                Motoristas
            </button>
        </>
    )
}