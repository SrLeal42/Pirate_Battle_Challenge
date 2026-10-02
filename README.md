# CONTEXTO DO PROJETO: Pirate Battle (React + PixiJS)

Legenda: [DECIDIDO] = confirmado pelo usuário | [RECOMENDADO] = proposto e bem recebido, ainda sem confirmação explícita | [PENDENTE] = em aberto

## 1. Visão geral
- Desafio técnico: https://github.com/junglegaming/game-developer-challenge (README = enunciado completo; `assets/` com navios, tiles, efeitos, HUD, spritesheets, sons WAV) ou no arquivo "CHALLENGE.md".
- Objetivo: shooter naval 2D, visão superior, single-player, 100% no navegador.
- Prazo: 2 dias (estimativa já informada à empresa). Estratégia: ter uma versão jogável de ponta a ponta cedo, cortar escopo, deploy parcial no fim do dia 1.
- Interface, identificadores de código e documentação da solução em INGLÊS (a conversa de planejamento é em português).
- Fase atual: planejamento avançado, nenhum código escrito ainda.

## 2. Stack obrigatória
React (menus/UI), TypeScript strict, PixiJS (arena, navios, projéteis, efeitos, barras de vida), TanStack Query + Axios (ranking/histórico), MSW (mocks), Playwright (E2E + regressão visual). Todas devem participar de verdade.
- Bundler: **Vite** [DECIDIDO]. Estado da UI: **Zustand** [DECIDIDO].
- Assumir Pixi v8 (init assíncrono); confirmar a versão instalada e a assinatura de `destroy`.

## 3. Requisitos-chave do enunciado
- Jogador: andar para frente, girar, tiro frontal (1 projétil), tiro lateral (3 projéteis paralelos, esquerda e direita), vida limitada, restrito à arena, não atravessa ilhas. Mover e atirar ao mesmo tempo. Teclado + toque.
- Inimigos: Chaser (persegue, dano ao colidir, explode no impacto, NÃO pontua se explodir no jogador) e Shooter (aproxima e atira no alcance). Ambos recebem dano e respeitam ilhas. Os dois tipos precisam aparecer numa partida padrão. Spawn periódico em pontos livres e afastados do jogador.
- Partida: duração configurável 60–180 s; 1 ponto por inimigo destruído pelo jogador; termina por tempo ou morte; reiniciar restaura tudo.
- Pausa manual e automática (perda de foco/aba oculta); retomada exige ação do jogador e não acumula movimento/disparos do período pausado.
- Efeitos: disparo, explosão, deterioração visual do navio conforme a vida. Barras de vida sobre cada navio. HUD: pontos e tempo.
- Telas: Menu (Play, Options, abas Ranking e Match History, instruções de controle), Options (game session time + enemy spawn time, validação e persistência após refresh), Partida, Resultado (pontos, tempo jogado, motivo do fim, status do registro, Play Again, Main Menu).
- Sair da partida ou recarregar a página a encerra; partida abandonada NÃO é registrada. Persistir localmente opções e resultado da última partida concluída.
- Config de gameplay centralizada e tipada; cada partida usa um snapshot da config vigente ao iniciar.
- Arquitetura: separar regras, render, input e UI; simulação independente de FPS; sem re-render do React por frame; texturas carregadas e reutilizadas com tratamento de falha e indicador de progresso antes do combate; canvas ajustado à tela/DPR; liberar listeners/ticker/timers/recursos ao sair ou reiniciar; funcionar com React Strict Mode.
- Acessibilidade: navegação por teclado, foco visível, labels, contraste, interface semântica com pontos/tempo/estado (sem anúncios a cada frame), teclas do jogo só capturadas durante o gameplay.
- Playwright: 12 grupos de cenários (opções, assets, movimento/colisão, tiros/cooldown/pontuação, IA/spawn, fim de partida, pausa, resultado, abandono/toque, ranking/histórico, registro/pendentes, reenvio/respostas atrasadas), Chromium desktop + mobile, regressão visual (menu, arena estável, resultado), seeds e controle do relógio da simulação, relatório HTML + traces.
- Performance: alvo 60 FPS; registrar FPS, p95 de frame time, nº de entidades (partida de 3 min); memória após 5 ciclos iniciar/jogar/sair; evidências de profiling.
- Entrega: repo com lockfile, assets, mocks, fixtures, testes; DEPLOY público obrigatório (Vercel/Netlify/Cloudflare Pages) rodando os mocks; README.md (setup, controles, config, cenários de rede, comandos: dev, build, preview, lint, typecheck, playwright) e ARCHITECTURE.md (integração React/Pixi, ciclo da simulação, colisões, recursos, persistência, ranking/histórico, limitações, balanceamento); relatórios de testes e profiling.
- Pesos: gameplay/colisões/inimigos 35; Pixi/arquitetura/ciclo de vida 20; UI/responsividade/acessibilidade 15; TanStack/Axios/consistência 10; Playwright 10; MSW/falhas 5; performance/docs 5. Console sem erros não tratados.

## 4. Arquitetura em camadas [DECIDIDO]
- `core/`: TypeScript PURO e determinístico (sem Pixi, React, DOM, Date.now, Math.random). Máquina de estados: dado estado + dt + input + config + RNG com seed, calcula o próximo estado e emite eventos. Inclui IA e spawn.
- `render/`: PixiJS; lê o estado do core a cada frame e atualiza sprites (Map<id, Sprite>); NÃO decide regras. Barras de vida desenhadas no Pixi (sem rotacionar com o navio).
- `ui/`: React (menus, HUD, resultado, ranking). Fala com o jogo só pela fachada `GameRuntime` (start, pause, resume, destroy, subscribe).
- `features/matches/`: api, hooks, fila de pendentes, tipos. `mocks/`: banco, handlers, cenários do MSW.
- Estrutura sugerida do core: config.ts, types.ts, rng.ts (mulberry32), simulation.ts (step/getState/drainEvents), systems/ (movement, weapons, ai, spawn, collision, damage, match), geometry/ (OBB, círculo, polígono, SAT), arena.ts.
- API do core: `new Simulation(config, arenaDef, seed)`, `step(dt, input)`, `getState()`, `drainEvents()`.
- Input é ESTADO (não eventos): `{thrust, turnLeft, turnRight, fireFront, fireLeft, fireRight}`. Teclado e toque preenchem o MESMO contrato; o core não sabe a origem.
- Convenção de ângulo única (0 = +X). Os sprites de navio nos assets estão na vertical (proa para cima), então o render soma o offset de 90° ao `rotation`.

## 5. Loop de simulação [DECIDIDO]
- Passo fixo de **60 Hz** com acumulador e clamp do delta (~100 ms). SEM interpolação no início.
- Tempo da partida = tempo simulado (soma dos steps); cooldowns decrementam por dt.
- **Pausa fica no runtime, não no core**: pausar = parar de chamar step. Ao retomar: zerar acumulador, último timestamp e estado de input; exigir ação do jogador.
- Drivers: `RealtimeDriver` (ticker do Pixi) e `ManualDriver` para testes (ex.: `window.__game.advance(ms)`), com as regras reais rodando.
- Eventos (shotFired, projectileHit, shipDestroyed, playerDamaged, scoreChanged, matchEnded): `drainEvents()` uma vez por frame; usados por render (efeitos), ponte da UI e áudio.
- Ordem dos sistemas por step: (1) sai se a partida terminou; (2) avança tempo/cooldowns; (3) input do jogador; (4) spawn; (5) IA; (6) armas (pedidos de disparo viram projéteis, respeitando cooldown); (7) integração de movimento; (8) colisões (navios×ilhas/limites com MTV; projéteis×ilhas/arena; projéteis×navios com dano uma única vez; Chaser×jogador); (9) mortes e pontuação (+1 só na transição vivo→morto por projétil do jogador); (10) limpeza; (11) fim de partida.
- **`player_died` tem precedência sobre `time_up` no mesmo tick** [DECIDIDO].
- Projéteis rápidos: com passo de 1/60 s e velocidades moderadas não há tunneling; se a velocidade subir muito, testar o segmento (pos anterior → atual).

## 6. Gameplay: decisões
- **Cooldown POR ARMA** [DECIDIDO], sem flag `cooldownMode`. Valores de referência: frontal ~1 s; laterais ~2 s, cada lado com seu timer.
- Tiro lateral: 3 projéteis paralelos saindo do lado do casco, deslocados ao longo do comprimento, direção perpendicular ao casco.
- **Sem pathfinding** [DECIDIDO]; documentar como melhoria futura (flow field/BFS em grade grossa recalculado ~4 Hz, só sem linha de visão). Mitigações baratas: deslize pela costa via MTV, SEM colisão inimigo×inimigo, detector de travamento (desvio lateral se quase sem progresso).
- IA: Chaser gira com velocidade angular limitada e avança; Shooter avança até a distância de ataque e atira quando alinhado e com cooldown pronto.
- **Arena inteira visível na tela o tempo todo** [DECIDIDO]; sem câmera com scroll.
- **Spawn na faixa da borda DENTRO da arena, com animação de entrada e período de graça de ~500 ms sem atirar/causar dano** [DECIDIDO]. Ponto sorteado com RNG com seed e rejeição: livre de ilhas (com margem) e a no mínimo `minSpawnDistance` do jogador; limite de tentativas, senão tenta no próximo tick. Ilhas longe da faixa da borda.
- **Tipo do inimigo sorteado só por PESOS** (sem garantia determinística de 1º Chaser/2º Shooter) [DECIDIDO]. Os pesos ficam na config; nos testes do Playwright, forçar os pesos (100% Chaser, depois 100% Shooter) em vez de depender de seed/sorte.
- **`maxAliveEnemies` na config (~20–30; sem vaga, o spawn espera)** e **leve força de separação entre inimigos** [RECOMENDADO]: com spawn de 1 s por 180 s e sem colisão/pathfinding, os inimigos se acumulariam (performance e sprites empilhados).
- **Campo de nome do jogador no MENU INICIAL** [DECIDIDO]: trim, tamanho máximo (~16), vazio vira "Player" (não bloqueia o Play), `label` real e mensagem de erro acessível, persistência em localStorage. Identidade = `playerId` (gerado e guardado em localStorage), NÃO o nome. O registro guarda `playerName` como era no momento da partida (histórico filtra por `playerId`; ranking mostra o nome da época). Digitar WASD no campo precisa funcionar (valida "teclas só no gameplay"; vale um teste). Mobile em paisagem: o teclado virtual cobre a tela, o menu precisa rolar.
- **Limites de Options** [DECIDIDO]: intervalo de spawn 1–10 s (padrão 3 s); tempo de sessão 60–180 s (padrão 120 s). Usar valores INTEIROS em segundos (documentar os limites).

## 7. Arena, ilhas e colisões
- Navios: **caixa rotacionada (OBB)**, só o casco (as velas são mais largas); hitbox ~80–90% do sprite, ajustada com overlay de debug. Projéteis: **círculos**. Resolução com **SAT + MTV** (navio desliza na costa). Círculo×OBB: levar o centro do círculo ao espaço local da caixa e testar o ponto mais próximo. Broadphase por grade de tiles.
- **Ilhas montadas como GRADE de tiles individuais** [DECIDIDO] (PNGs 64×64 em `assets/png/default/tiles`), em vez de uma ilha em um sprite só. Ilhas RETANGULARES [DECIDIDO]; tamanho mínimo recomendado 3×3 (os cantos têm arredondamento grande).
- **UM polígono convexo por ilha** [DECIDIDO], derivado do contorno dos tiles de canto (arcos) + retas ao longo das bordas: ~20 vértices por ilha. Evita arestas internas/"colisões fantasma" entre tiles vizinhos. Pedras podem ser círculos; palmeiras, plantas, grama de transição e água rasa não colidem.
- Sugestão de arena: **20×11 tiles = 1280×704** (proporção ~1,82, perto de 16:9) [RECOMENDADO]. Tamanho lógico fixo escalado com letterbox, `resolution = devicePixelRatio` (limitar a 2), `ResizeObserver`.
- Tiles já identificados (medidos no canal alpha; cada tile tem `shape` para colisão e `variant` para arte, e as variantes com grama têm silhueta IDÊNTICA às de areia):
  - Canto NW: tile_1 (grama: tile_6). Borda N: tile_2 (grama: tile_7, tile_8). Canto NE: tile_3 (grama: tile_9). Centro: tile_4, tile_5, tile_20, tile_21. Canto SW: tile_33. Borda S: tile_34.
  - **Faltam: borda W, borda E, canto SE** e centros de grama [PENDENTE]. Palpite (NÃO verificado): SE pode ser tile_35. Plano B: bordas retas = retângulos; SE = polígono do SW espelhado horizontalmente (aproximação; NW e NE NÃO são espelhos exatos).
- Medições: as bordas são rentes ao tile (areia termina a 0–2 px do limite), então o recuo da hitbox deve ser **~2 px (~3%)**, não 6–8%. Os cantos são convexos (0% de concavidade), mas NW e NE são assimétricos (o NE tem raio maior e margem transparente de 2–3 px à direita): usar a silhueta medida de cada um, sem espelhar.
- Polígonos normalizados (0..1 no tile, y para baixo, sentido horário; derivados do fecho convexo do alpha, simplificação com tolerância de 2 px, cobertura ~99%):
  - Arco NW: `[[0.016,1],[0.047,0.5],[0.219,0.266],[0.641,0.094],[1,0.016]]`
  - Arco NE: `[[0,0.016],[0.344,0.016],[0.625,0.109],[0.797,0.344],[0.984,1]]`
  - SW (tile_33): `[[0.016,0],[1,0],[1,0.984],[0.641,0.984],[0.375,0.891],[0.266,0.781],[0.094,0.359]]`
  - Borda N: retângulo com topo em y≈0.016; borda S: retângulo com a face de baixo em y≈0.984; centro: quadrado cheio.
- Observação: a maior parte das medidas veio de PNGs enviados como amostra; conferir os arquivos reais e afinar tudo com o overlay de debug (desenhar hitboxes).

## 8. Assets e atlas
- **Sem atlas próprio para tiles/navios** [RECOMENDADO]: PNGs individuais bastam para as dezenas de sprites da arena. Empacotar só se o profiling pedir (documentar como melhoria). Riscos de empacotar: franjas nas bordas ao girar (precisa padding/extrusão) e o `TilingSprite` da água costuma funcionar melhor com textura própria.
- `ui_sheet.json` (atlas só de UI, formato TexturePacker, 1024×1024, 36 frames, sem trim/rotação; `Assets.load` do Pixi lê direto):
  - `panel_menu` tem `borders` 32/40/32/40 (9-slice) e `content_rect`; botões têm `label_rect`; estados de botão: normal, hover, pressed, disabled (primary) e normal/pressed (secondary); botão redondo com 3 estados.
  - Barras de vida: `health_frame` 256×48 com `fill_rect` (30,15,196×20) para o jogador (fills green/amber/red); `enemy_health_frame` 160×40 com `fill_rect` (24,12,112×15) (fills green/red). `clip_axis: x`, `clip_origin: left`: o preenchimento deve ser RECORTADO (máscara/crop), não esticado.
  - Ícones: fire_front, fire_left, fire_right, forward, turn_left, turn_right, pause, play, restart, home, settings, time, score, heart, close, plus, minus. Há também `counter_panel` e `title_pirate_battle`.
  - `ui.image` aponta para PNGs individuais em `../png/default/ui/...`: os menus em React podem usá-los direto (ex.: `border-image` para o 9-slice) sem passar pelo Pixi; o Pixi usa o atlas só para o que é desenhado no canvas (barras sobre os navios). `ui_sheet_retina.json` presumivelmente é a versão 2×; escolha por DPR pendente [PENDENTE].
- `ships_miscellaneous_sheet.png`: navios em várias cores (bandeiras/velas com símbolos), peças de casco e de vela (úteis para a deterioração visual por estágio de vida), variantes cinzas, explosões, chamas, canhão e itens pequenos. PNGs individuais provavelmente existem em `assets/png` (não verificado).

## 9. Ciclo de vida Pixi + React [RECOMENDADO]
- Problema: em Strict Mode o React monta, desmonta e monta de novo; no Pixi v8 `app.init()` é assíncrono e o cleanup pode rodar com o init em andamento.
- `GameRuntime` (classe) é o único dono de Application, Simulation, input, ticker, listeners (`keydown`, `visibilitychange`, `blur`), `ResizeObserver` e cena. `destroy()` é IDEMPOTENTE e seguro antes do init terminar: marca `destroyed`, espera o init e destrói; logo após o `await init`, se já estiver `destroyed`, destrói o app e retorna sem tocar no DOM. Todo recurso registra seu cleanup numa lista (`disposables`); `destroy()` percorre a lista.
- O único componente React que conhece o Pixi é `<GameCanvas />` (`useEffect` cria o runtime, o cleanup chama `destroy()`). O HUD é outro componente que só lê o Zustand.
- Um `Application` por montagem da tela de partida (entrar cria, Main Menu destrói). Play Again reaproveita o app: nova `Simulation` e nova cena; a tela de resultado é um overlay React sobre o canvas parado. Evita criar um contexto WebGL por partida.
- Texturas vivem no cache global (`Assets`) e NÃO são destruídas ao sair da partida. Por partida destruímos sprites, containers, gráficos de debug, filtros e callbacks do ticker. Projéteis e efeitos usam pool de sprites.
- Pausa/foco: `visibilitychange`/`blur` → `runtime.pause()`; overlay "Paused" exige clique; `resume()` zera acumulador, timestamp e input.
- Resize: `ResizeObserver` no container, escala = `min(w/LW, h/LH)`, letterbox. Os controles de toque são DOM, então não há mapeamento de coordenadas do canvas para o input.
- Estados do runtime: idle → loading → ready → playing ⇄ paused → ended (e error). A UI só reage a esses estados.
- Checklist do teste de 5 ciclos: callbacks do ticker, listeners (incl. `ResizeObserver`), timers de efeitos, assinaturas do Zustand, sprites fora do pool. Expor um contador de listeners ativos para os testes.

## 10. Carregamento de assets [RECOMENDADO]
- Manifesto com bundles do `Assets` do Pixi (bundle `game`: navios, projéteis, efeitos, tiles). A UI React usa as imagens do `ui_sheet`.
- Carregar ao apertar Play via `ensureGameAssets()` com promessa memoizada (deduplica; zerada em caso de falha). Partidas seguintes são instantâneas. Pré-busca silenciosa no menu é opcional.
- Tela de carregamento em React com barra de progresso (`role="progressbar"`).
- Falha: mensagem acessível + botão Retry. O Playwright simula bloqueando as requisições dos PNGs com `page.route`, então os assets precisam vir pela rede (não embutidos no bundle). Atenção: o cache do `Assets` pode guardar a falha; fazer um spike do retry e, se preciso, usar cache-busting na nova tentativa.
- Validação pós-carga: todos os aliases obrigatórios devem existir antes de iniciar o combate.
- Áudio (WAV) opcional e de baixa prioridade: carga separada e preguiçosa (o navegador exige gesto do usuário).

## 11. Sincronização React ↔ jogo [DECIDIDO: Zustand]
- O core emite eventos discretos + snapshot de HUD em baixa frequência (~4–10 Hz ou só quando muda); sem re-render por frame.
- Zustand para o estado da UI. Regra firme: `core/` NÃO importa Zustand; um adapter na ponte escuta os eventos e escreve no store.
- Roteamento de telas: `useState` simples (sem React Router).

## 12. Responsividade e toque
- **Mobile em paisagem, com aviso para virar o celular** [DECIDIDO].
- Controles de toque: botões DOM sobrepostos ao canvas, Pointer Events, multitouch (D-pad/joystick + botões de tiro), nas laterais, fora da área crítica da arena; os ícones do `ui_sheet` servem para os botões. Preenchem o mesmo InputState do teclado. Teclado: keydown/keyup preenchem o estado; só captura no contexto de gameplay.

## 13. Backend: NÃO existe [DECIDIDO]
- Sem backend nem banco real. O MSW intercepta o Axios no navegador; os handlers rodam na página e persistem o "banco" em `localStorage`. O localStorage tem 3 papéis: (1) banco da API simulada (confirmadas + fixtures de outros jogadores); (2) fila de pendentes (cliente); (3) opções, nome do jogador e resultado da última partida (fora da API).
- Não gravar direto no localStorage porque o desafio avalia consumo assíncrono (loading/vazio/erro, cache, invalidação, retry, timeout, respostas fora de ordem, recuperação sem duplicar). Remover o MSW e apontar o Axios para uma URL real não deveria exigir mudanças no resto (citar no ARCHITECTURE.md). Limitações a documentar: dados por navegador, ranking não compartilhado entre pessoas, reset apaga tudo.

## 14. Ranking e histórico
- `MatchRecord`: id (UUID gerado no CLIENTE no fim da partida), playerId, playerName (snapshot), createdAt, score, durationMs, endReason (`time_up` | `player_died`), config usada.
- Histórico: registros do `playerId` atual, mais recentes primeiro, paginado. Ranking: todos os jogadores (fixtures + local), filtrado por mesma configuração, paginado.
- **`configKey` = combinação dos dois parâmetros** [DECIDIDO] (valores inteiros, ex.: "120-3"); o ranking é consultado por `configKey` (padrão = config atual).
- **Desempate** [DECIDIDO]: pontuação desc → `durationMs` desc (sobreviveu mais) → `createdAt` asc (quem chegou primeiro) → `id`. `durationMs` é tempo simulado ATIVO (a pausa não conta); em `time_up`, gravar exatamente a duração configurada, em ms inteiros. Documentar a escolha.
- Fixtures [RECOMENDADO]: como quase toda combinação de parâmetros teria ranking vazio, o MSW gera fixtures SOB DEMANDA por `configKey` com PRNG de seed fixa (~25–40 jogadores, estáveis entre recarregamentos), dando paginação em qualquer config; o estado "vazio" é testado por cenário.
- Idempotência: `POST /matches` com `id` já existente devolve o registro existente (sem duplicar). Cobre reenvio, clique repetido e "timeout depois de registrar".
- Fila de pendentes: ao terminar a partida, gravar PRIMEIRO no localStorage como pendente; só então enviar. Sucesso → remove da fila e invalida queries; falha → continua pendente. `flushPending()` roda no fim da partida, na abertura do app, ao voltar ao menu, no evento `online` e no botão Retry; um mapa de envios em andamento por id evita envios concorrentes do mesmo registro. O jogador pode iniciar nova partida com pendentes. Status na tela de resultado: Saving / Saved / Pending (will retry) / Failed (Retry). Falhas de API nunca bloqueiam o jogo.
- Axios: timeout configurado, recebe `signal` do TanStack Query. TanStack Query: `useQuery` com queryKey incluindo página e configKey, `placeholderData: keepPreviousData`; `useMutation` por tentativa; retry limitado com backoff só para erros transitórios (rede, timeout, 5xx; não 4xx exceto 408/429). Fonte da verdade dos pendentes = fila local, não o retry do Query.
- Respostas atrasadas: queryKey por página/config isola o cache; mesma chave deduplica e cancela via signal; após registrar, `cancelQueries` + `invalidateQueries` nas duas abas.
- MSW: banco em módulo compartilhado persistido em localStorage; paginação (page, pageSize, total); cenário ativo consultado pelos handlers: success, empty, multi-page, slow, random-latency, out-of-order, timeout, http-4xx/5xx, fail-ranking, fail-history, timeout-after-register, down-on-submit. Seleção por painel dev/demo e/ou query string (`?scenario=`) + botão Reset (apaga banco simulado e fila). O Playwright seta o cenário via localStorage ou API em `window`. RNG com seed e latência fixa em teste. O worker do MSW deve rodar também no build de produção (`mockServiceWorker.js` em `public/`).
- Ordem de implementação: tipos/contratos → banco e handlers MSW (idempotência desde o início) → cliente Axios + hooks → fila de pendentes → abas e tela de resultado → cenários de falha + painel.

## 15. Plano de 2 dias (proposto)
- Dia 1 (jogo funciona): setup (Vite + TS strict + Pixi + lint + pastas) e carregamento de assets → core (movimento, tiro, colisão com ilha, Chaser, Shooter, spawn, fim de partida) → render Pixi + input de teclado + HUD básico → pausa, reinício e ciclo de vida limpo (Strict Mode). Deploy parcial no fim do dia.
- Dia 2 (tudo em volta): menus + campo de nome, Options com persistência, resultado → toque e responsividade → MSW + Axios + TanStack Query (ranking, histórico, pendentes) → Playwright (fluxos principais primeiro), README, ARCHITECTURE.md, deploy final.
- Ordem de construção do core: tipos/config/RNG → navio do jogador (movimento, limites) → projéteis/cooldowns → colisão com ilhas (com overlay de debug de hitboxes) → inimigos (IA, spawn) → dano, pontuação, fim de partida.
- Sacrificar primeiro se faltar tempo: efeitos visuais refinados, profiling completo, cobertura total dos 12 grupos de testes.

## 16. Pendências e ainda não discutido
- [PENDENTE] Tiles que faltam (borda W, borda E, canto SE, centros de grama): o usuário vai procurar/anexar; até lá vale o plano B da seção 7.
- [PENDENTE] Escolha de assets 1× ou retina por DPR; conferir os PNGs individuais de navios.
- Ainda não discutido em detalhe: deterioração visual dos navios (estágios de casco/vela), áudio, layout dos menus e interface semântica, estratégia detalhada do Playwright (instrumentação, seeds, baselines visuais), profiling e documentação.