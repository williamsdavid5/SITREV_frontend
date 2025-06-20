# SITREV
### Sistema de Telemetria e Registro Veicular

Este projeto propõe o desenvolvimento de um sistema de telemetria veicular completo, composto por um dispositivo embarcado baseado em microcontrolador (Arduino) responsável por coletar dados do veículo, como velocidade, localização GPS e condições ambientais, e transmitir essas informações a uma API própria, desenvolvida para centralizar e organizar os dados em um banco relacional. A visualização, edição e análise desses dados são realizadas por meio desta plataforma online interativa.

### O que esta plataforma faz?
- Monitora em tempo real a localização dos veículos e motoristas
- Gerencia as cercas geográficas referentes aos limites de velocidade
- Reúne alertas emitidos pelos dispositivos em cada veículo
- Exibe todas as viagens dos motoristas armazenadas no banco de dados

# Sobre as telas
### 1. Tela início
A ideia é que seja uma tela simples que servirá apenas para monitoramento em tempo real, foi adicionado também um botão no popup dos veículo no mapa para que o usuário possa ver mais informações sobre o motorista em questão.

### 2. Cecas
Responsável por gerenciar todas as cercas, é possível adicionar, remover e editar as cercas já existentes assim como seus limites de velocidade, cor, e tipo (por enquanto dois há dois tipos disponíveis, limitação de velocidade e área restrita). As cercas também ficam organizadas por camadas na lista lateral para facilitar a visualização e organização pelo usuário.

### 3. Motoristas
Reúne todos os registros por motoristas, assim é possível analisar individualmente as viagens e alertas para cada um, assim como localizá-los no mapa em tempo real.

### 4. Registros
A tela que irá reunir todos os registros do banco de dados (em um período de 2 meses, pois o banco de dados será configurado para excluir registros acima desse limite), nela o usuário poderá pesquisar por informações relacionadas ao registro, como a placa do veículo, nome do motorista e modelo, além de poder pesquisar por uma data específica e por período de tempo, entre uma data e outra, estes registros também são reproduzidos no mapa. Vale ressaltar esta tela também indica desenha os possíveis alertas relacionados a cada registro.

### 5. Alertas
Semelhante a tela de registros, mas dessa vez irá reunir apenas alertas e suas informações, assim o usuário poderá gerenciar melhor estes dados. Esta tela também pode mostrar todos os alertas no mapa, isso é útil para uma análise desses dados, pois mostra onde há mais alertas registrados.

## Este projeto foi desenvolvido em React + Vite