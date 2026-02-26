# Portal de Cidadania (MVP)

Protótipo front-end para gestão de processos de cidadania com foco inicial em cidadania italiana, preparado para expansão para outros tipos.

## Funcionalidades implementadas

- Login social simulado com Google (fluxo gerenciado na interface).
- Cadastro de conta com email, CPF e senha.
- Seleção de cidadania ao iniciar solicitação (Italiana, Portuguesa, Espanhola).
- Fluxo por etapas (1 a 5 gerações), com árvore de pessoas.
- Upload real de arquivos (PDF/imagem) por pessoa e por tipo documental: nascimento, casamento e óbito.
- Área de notificações de mudanças.
- Perfil de funcionário com dashboard e edição de dados do usuário/processo.

## Como executar

Como é um projeto estático:

```bash
python3 -m http.server 4173
```

Depois acesse `http://localhost:4173`.
