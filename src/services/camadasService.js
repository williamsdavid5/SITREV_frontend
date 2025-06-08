import api from "../server/api";

// buscar camadas por nome
export async function buscarCamadas() {
    const resposta = await api.get('/cercas/camadas');
    const camadasObj = resposta.data;

    return Object.entries(camadasObj)
        .map(([_, camada]) => camada)
        .sort((a, b) => a.nome.localeCompare(b.nome));
}

// buscar cercas
export async function buscarCercas() {
    const resposta = await api.get('/cercas');
    return resposta.data;
}

// criar camada
export async function criarCamada(nome) {
    if (!nome || nome.trim() === "") throw new Error("Nome inválido");

    const dado = { nome };
    return await api.post(`/camadas`, dado);
}