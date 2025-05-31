import { useEffect, useState } from 'react';
import './styles/modalCerca.css';
import fecharIcon from '../assets/fecharIcon.png';
import api from '../server/api';

export default function ModalCerca({ setModalVisivel, cercaSelecionada, camadas, novaCercaCoordenadas }) {
    const [nome, setNome] = useState('');
    const [tipo, setTipo] = useState('limitador_velocidade');
    const [velocidadeMax, setVelocidadeMax] = useState('');
    const [velocidadeChuva, setVelocidadeChuva] = useState('');
    const [cor, setCor] = useState('#0000ff');
    const [camadaId, setCamadaId] = useState(null);

    useEffect(() => {
        if (cercaSelecionada) {
            setNome(cercaSelecionada.nome || '');

            const tipoValido = ['limitador_velocidade', 'area_restrita'].includes(cercaSelecionada.tipo)
                ? cercaSelecionada.tipo
                : 'limitador_velocidade';
            setTipo(tipoValido);

            setVelocidadeMax(cercaSelecionada.velocidade_max || '');
            setVelocidadeChuva(cercaSelecionada.velocidade_chuva || '');
            setCor(cercaSelecionada.cor || '#0000ff');
            setCamadaId(cercaSelecionada?.camada?.id ?? null);
        }
    }, [cercaSelecionada]);


    async function salvarEdicao() {
        try {
            console.log(cercaSelecionada);
            console.log(novaCercaCoordenadas);
            if (!cercaSelecionada && (!novaCercaCoordenadas || novaCercaCoordenadas.length < 3)) {
                alert('Desenhe uma cerca com pelo menos 3 pontos antes de salvar.');
                return;
            }

            const dados = {
                nome,
                tipo,
                velocidade_max: Number(velocidadeMax),
                velocidade_chuva: Number(velocidadeChuva),
                cor,
                camada_id: camadaId,
                coordenadas: cercaSelecionada ? undefined : novaCercaCoordenadas
            };

            if (cercaSelecionada) {
                console.log('editando cerca');
                await api.put(`/cercas/${cercaSelecionada.id}`, dados);
                alert('Cerca atualizada!');
            } else {
                console.log('criando cerca');
                console.log(dados);
                await api.post('/cercas', dados);
                alert('Cerca criada!');
            }

            setModalVisivel(false);
            window.location.reload();
        } catch (err) {
            console.log('Erro ao atualizar: ', err.response?.data || err);
            alert('Erro ao salvar edição');
        }
    }


    return (
        <div className='modalBackground'>
            <div className='modalCercaJanela'>
                <div className='tituloModal'>
                    <h2 className='h2_modal'>Editar Cerca</h2>
                    <img src={fecharIcon} alt="Fechar" className='fecharIconModal' onClick={() => setModalVisivel(false)} />
                </div>

                <p className='p_modal'>Tipo</p>
                <select className='selectModal' value={tipo} onChange={e => { setTipo(e.target.value); console.log(tipo) }}>
                    <option value="limitador_velocidade">Limitador de velocidade</option>
                    <option value="area_restrita">Área restrita</option>
                </select>

                <p className='p_modal'>Nome</p>
                <input type="text" className='inputModal' value={nome} onChange={e => setNome(e.target.value)} />

                <div className='divisaoVertical'>
                    <div className='divisaoVerticalAuxiliar' style={{ marginRight: '15px' }}>
                        <p className='p_modal'>Limite</p>
                        <input type="number" className='inputModal' value={velocidadeMax} onChange={e => setVelocidadeMax(e.target.value)} />
                    </div>
                    <div className='divisaoVerticalAuxiliar' style={{ marginLeft: '15px' }}>
                        <p className='p_modal'>Limite na chuva</p>
                        <input type="number" className='inputModal' value={velocidadeChuva} onChange={e => setVelocidadeChuva(e.target.value)} />
                    </div>
                </div>

                <div className='divisaoVertical'>
                    <div className='divisaoVerticalAuxiliar' style={{ marginRight: '15px' }}>
                        <p className='p_modal'>Cor</p>
                        <input type="color" value={cor} onChange={e => setCor(e.target.value)} />
                    </div>
                    <div className='divisaoVerticalAuxiliar' style={{ marginLeft: '15px' }}>
                        <p className='p_modal'>Camada</p>

                        <select
                            className='selectModal'
                            value={camadaId !== null && camadaId !== undefined ? camadaId : ''}
                            onChange={e => {
                                const idSelecionado = e.target.value ? Number(e.target.value) : null;
                                setCamadaId(idSelecionado);
                            }}
                        >
                            <option value="">Nenhuma</option>
                            {camadas.map((camada) => (
                                <option key={camada.id} value={camada.id}>
                                    {camada.nome}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <button className='botaoModal' onClick={salvarEdicao}>Salvar</button>
            </div>
        </div>
    );
}
