# PageAI 🤖

Sua IA pessoal para navegar na web de forma inteligente. O PageAI transforma qualquer página estática em um chat interativo, permitindo que você faça perguntas, resuma conteúdos ou busque informações externas usando o poder do Claude (Anthropic) ou GPT-4 (OpenAI).

## ✨ Funcionalidades

- **Análise em Tempo Real**: Entende o contexto da página que você está visitando.
- **Multi-Provedor**: Suporte nativo para **Anthropic (Claude 3 Haiku)** e **OpenAI (GPT-4o)**.
- **Conhecimento Híbrido**: Responde com base na página ou busca conhecimento externo quando necessário (com aviso de fonte).
- **Interface Moderna**: Chat minimalista com tema neutro (grafite e cinza) que não interfere na navegação.
- **UX Inteligente**: 
  - Campo de texto que cresce automaticamente conforme você digita.
  - Função "Minimizar" para não atrapalhar a visão.
  - Atalho rápido no teclado (Alt + A) para ligar/desligar.
- **Privacidade**: Suas chaves de API são armazenadas localmente no seu navegador.

## 🚀 Como instalar

1.  Faça o download ou clone este repositório.
2.  Abra o seu navegador Chrome (ou navegadores baseados em Chromium como Brave/Edge).
3.  Acesse `chrome://extensions`.
4.  Ative o **"Modo do desenvolvedor"** no canto superior direito.
5.  Clique em **"Carregar sem compactação"** e selecione a pasta deste projeto.

## ⚙️ Configuração

1.  Clique no ícone da extensão (PageAI) na sua barra de ferramentas.
2.  Escolha seu provedor preferido (**Anthropic** ou **OpenAI**).
3.  Insira sua **API Key**.
4.  Clique em **"Configurar PageAI"**.
5.  Ative a chave **"Ativar nesta aba"** para começar a conversar!

## ⌨️ Atalhos

- **Abrir/Fechar Chat**: `Alt + A` (configurável no Chrome).
- **Enviar Mensagem**: `Enter`.
- **Quebrar Linha**: `Shift + Enter`.
- **Minimizar**: Botão `−` no cabeçalho do chat.

## 🛠️ Tecnologias Utilizadas

- **Manifest V3**: Padrão mais moderno e seguro para extensões Chrome.
- **JavaScript (ES6+)**: Lógica de manipulação de DOM e chamadas de API.
- **Chrome Storage API**: Persistência de configurações por aba e chaves de API.
- **Chrome Scripting API**: Injeção dinâmica do chat nas páginas.

---
*Nota: Esta extensão requer uma API Key válida dos provedores mencionados. O uso está sujeito aos custos das respectivas plataformas.*
