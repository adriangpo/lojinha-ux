# Lojinha UX

Aplicação de demonstração do mini curso **Do Clique à API: UX de Verdade**: 22 temas de experiência do usuário vistos dos dois lados, frontend e API, cada um na versão ruim e na versão boa.

Uma lojinha com **uma página por tema**. Cada página tem as versões do tema (ruim → boa) num seletor no canto superior direito, e cada versão é um arquivo próprio, curto, para explicar linha por linha.

Ao lado, o **monitor** (`/monitor`, outra aba) mostra o que acontece entre Usuário, Tela, Navegador, API e Banco.

## Como rodar

Requisitos: Node 22+ e Docker Desktop aberto.

```bash
npm run instalar   # só na primeira vez
npm run banco      # sobe o Postgres (porta 5433) e o MinIO (9000, console em 9001)
npm run dev        # sobe API (3333) e front (5173)
```

- Lojinha: http://localhost:5173
- Monitor: http://localhost:5173/monitor

Para zerar o banco: `docker compose down -v` e `npm run banco` de novo. A API envia as fotos para o MinIO sozinha quando sobe.

O MinIO roda com a imagem `pgsty/minio`, um fork mantido do MinIO: a imagem oficial saiu do Docker Hub em 2025.

## Estrutura

```
lojinha-ux/
  docker-compose.yml        Postgres e MinIO
  api/
    banco/                  SQL que cria e popula o banco
    src/servidor.ts         monta as rotas
    src/rotas/              rotas da lojinha (código das demos)
    src/controle.ts         painel do apresentador: latência e taxa de erro
    src/monitor.ts          infraestrutura do monitor (SSE)
    src/banco.ts            consultas ao Postgres
    src/imagens.ts          gera as fotos dos produtos (sharp)
    src/armazenamento.ts    MinIO: bucket e fotos
  web/src/
    temas.ts                lista de temas, na ordem da apresentação
    temas/<tema>/           código das demos: um arquivo por versão
    hooks/                  hooks das demos (ex.: useDebounce)
    componentes/            peças visuais compartilhadas
    lib/                    cliente da API e tipos
    monitor/                a aba do monitor (barras, sequência, inspetor, placar)
```

O que é **código das demos** (para mostrar): `web/src/temas/`, `web/src/hooks/`, `api/src/rotas/`.
O que é **infraestrutura** (não precisa mostrar): `monitor`, `controle`, `componentes`, `imagens`, `armazenamento`.

## Monitor

- **Faixas:** Usuário (cliques, teclas) → **Tela** (o que o usuário está vendo) → Navegador → API → Banco.
- **Barras:** como a aba Network do DevTools, a atividade começa na esquerda e cresce para a direita. Janela de 5s, 10s ou 30s. Quando tudo termina, a imagem congela para dar tempo de explicar.
- **Cores:** azul em andamento, verde 2xx, verde-água 304, laranja 4xx, vermelho 5xx/falha, cinza riscado cancelada. **Tracejado verde-água** = veio do cache (navegador, TanStack Query ou cache feito na mão), sem ir à API. **Tracejado cinza** = espera de propósito (backoff, Retry-After).
- **Progresso e avisos:** a barra do upload se enche conforme os bytes vão; cada mensagem do servidor (SSE/NOTIFY) vira um tique na barra da conexão e uma seta tracejada na Sequência.
- **Inspetor:** clique numa barra para ver status, cabeçalhos que importam (Cache-Control, ETag, Retry-After, Idempotency-Key, Set-Cookie…), corpo do pedido e da resposta, o SQL com parâmetros e quem chamou quem.
- **Placar:** requisições, do cache, chegaram na API, consultas ao banco, 4xx, 5xx e bytes baixados. Zera no "Limpar".
- **Agrupar iguais:** junta requisições iguais da mesma leva ("200× GET /imagens/:id"). **Esconder:** filtra pelo texto (ex.: "imagens").
- **Fixar para comparar:** guarda a linha do tempo atual (com placar) e limpa. Rode a versão ruim, fixe, rode a boa: as duas ficam uma embaixo da outra. Dá para renomear e remover.
- **Sequência:** setas entre as partes, em ordem.
- **Latência:** Nenhuma, 300ms, 1s, 3s, Aleatória (200ms a 2s, para layout shift) ou Travada (30s, para timeouts).
- **Taxa de erro:** 0%, 25%, 50% ou 100% (a API responde 503).
- **Sessão:** "Expirar sessão agora" (tema Sessão expirada).
- **Conexão da lojinha:** Online ou Offline (tema Offline). Diferente dos outros, vale para as abas da lojinha e não para a API: `navigator.onLine` fica `false`, os eventos `offline`/`online` disparam e as chamadas falham como sem rede. Mesmo efeito do DevTools → Network → Offline.

Nas demos, o monitor é avisado em uma linha: `monitor.marca` (usuário), `monitor.tela` (tela mudou), `monitor.cache`, `monitor.esperar`, `monitor.progresso` e `monitor.aviso` (`web/src/lib/monitor.ts`).

As fotos do MinIO passam pelo proxy do Vite (`/fotos`), para virem da mesma origem e o monitor saber se vieram da rede ou do cache.

## Status dos temas

Na ordem da apresentação, todos os 22 temas estão prontos. Na tabela, o que testar e como deixar o painel do monitor:

| Tema | Versões | Como demonstrar |
|---|---|---|
| Formulários e validação | Só no servidor / Botão sempre habilitado / Erro ao sair do campo | Clicar em Cadastrar com campos faltando. Na última: abrir a página (nenhum erro), entrar e sair de um campo vazio (só ele mostra erro), clicar no botão cinza (todos os erros, foco no primeiro). A turma vota antes da última |
| Erros úteis | Erro genérico / Erro com code por campo | Cadastrar vazio (`422`, três erros com code) e depois "Teclado mecânico" (nome já em uso, `409 PRODUCT_NAME_TAKEN`); abrir a resposta no inspetor do monitor |
| URL como estado | Filtros no useState / Filtros na URL | Filtrar, dar F5, copiar o link |
| Estados da tela | Tela branca / Quatro estados | Erro 100%; depois buscar "xyz" |
| Skeleton Loading | Spinner / Skeleton | Latência 1s |
| Layout shift | Imagem sem tamanho / Espaço reservado | Latência aleatória; tentar clicar em Comprar |
| Debounce e Throttle | Sem debounce / Com debounce / Throttle no scroll | Digitar; rolar a página |
| Race conditions | Sem cancelamento / Com AbortController | Latência Nenhuma; clicar em Eletrônicos (2s) e logo em Casa (0,3s) |
| Optimistic UI | Espera a API / Muda na hora | Latência 1s; depois erro 100% |
| Feedback de sucesso | Nada acontece / Alerta que bloqueia / Toast | Adicionar ao carrinho |
| Upload | Sem progresso / Short polling / Long polling / SSE | Arquivo de ~10 MB; fixar cada versão no monitor e comparar as requests |
| Timeouts | Sem limite / Com timeout | Latência Travada |
| Retries e backoff | Sem retry / Retry sem parar / Exponential backoff | Erro 50% ou 100% |
| Clique duplo e idempotência | Sem proteção / Botão travado / Chave de idempotência / Pix duplicado | Clicar várias vezes em Transferir. Na chave: os cliques extras voltam `409` na hora; mudar o valor no meio do envio dá `422`; "Repetir o último envio" devolve o mesmo Pix até a chave expirar (30s) e depois cria outro. No Pix duplicado: o mesmo valor para a mesma pessoa em menos de 15s é bloqueado (`409` com `Retry-After`) até a janela passar |
| Rate Limiting | Sem limite / 429 sem explicação / Com Retry-After | Aplicar o cupom várias vezes (limite: 5 em 10s) |
| Sessão expirada | Perde o formulário / Modal de login | Preencher, "Expirar sessão agora" no monitor, Salvar |
| Offline e conexão instável | Perde a ação / Fila offline | Conexão da lojinha Offline no monitor; favoritar; voltar para Online |
| Caching | Sem cache / Cache na mão / TanStack Query / Cache HTTP | Trocar de categoria e voltar; no Cache HTTP, a API nem aparece no monitor por 10s |
| Imagens com signed URL | URL nova a cada vez / URL reaproveitada | Dar F5 com a aba Network aberta |
| Lazy Loading | Tudo de uma vez / loading="lazy" | Contador de imagens e MB no topo |
| N+1 requests | Um endpoint por recurso / Um endpoint por tela | 15 requests vs 1 no monitor |
| Pagination vs Infinite Scroll | Sem paginação / Páginas numeradas / Infinito com offset / Infinito com cursor | Sem paginação: ver o tamanho da resposta no monitor. Depois, "Simular: alguém publicou agora" e rolar: o offset repete um item |

## Stack

| Parte | Escolha |
|---|---|
| Frontend | React + Vite + TypeScript + Mantine (+ notifications) + TanStack Query + React Router |
| API | Node + Express 5 + TypeScript |
| Banco | Postgres 16 (Docker) |
| Imagens | MinIO local (S3), fotos geradas pela API com sharp |
