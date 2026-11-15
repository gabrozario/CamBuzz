# Cambuzz — guia do projeto

App Android (React Native + Expo + TypeScript) criado no hackathon da Georgia Tech, tema **"Smarter Campus Map"**.
Time de 4 pessoas iniciantes em React Native trabalhando em paralelo: **explique brevemente o que fizer** e mantenha cada tela/componente no seu próprio arquivo.

Leia também o [AGENTS.md](AGENTS.md) (regras gerais do Expo: usar `npx expo install`, consultar a doc versionada do SDK, etc.).

## A ideia

O usuário insere sua agenda de aulas e, ao abrir o app, vê o mapa da Georgia Tech com o **caminho do dia** destacado (de aula em aula). Embaixo há uma **barra de filtros**. Ao tocar num filtro, uma aba (bottom sheet) sobe até 35% da tela (o mapa continua grande) e o mapa mostra os itens daquele filtro.

### Prioridades
1. ✅ Mapa + caminho do dia (Etapa 1)
2. ✅ Filtro **Events**: eventos perto do caminho do usuário, no horário em que ele está passando (ex.: entre uma aula e outra) (Etapa 2)
3. ✅ Filtro **People** (amigos): caminho de cada amigo (uma cor cada), com mostrar/esconder por amigo (Etapa 3)
4. ✅ Events + People ativos ao mesmo tempo → ver qual evento dá pra ir junto com um amigo (Etapa 3)
5. ✅ Popup **Add Friends** (link de convite + email) com serviço falso pronto para virar backend (Etapa 3)
6. ✅ Telas **My schedule** (Week/Block View, Add Course, Add Event, convidar amigos) e **Settings** (conta + modo claro/escuro) (Etapa 4)
7. ✅ Busca ("Search campus"): amigos, suas aulas, comida, resources, eventos, prédios e atalhos de categoria (ver seção Busca)

8. ✅ Filtro **Food**:
   - **Dining halls** (D1 North Ave, D2 Brittain, D3 West Village): horário real + cardápio de exemplo com nutrição (Figma `Food details · …`).
   - **Restaurants/Coffees** (C1–C25): TODOS os restaurantes/cafés do campus, Student Center e Tech Square, com dados reais de dining.gatech.edu — horário dos 7 dias (hoje em destaque, outros dias menores), Dining Dollars e BuzzCard Funds. **Sem cardápio** (decisão do time).
   - Vending machines (V1–V3): cardápio de exemplo.
   - Horários = "Normal Hours" do site; feriados/férias podem mudar. Lógica de aberto/fechado em `src/filters/food/foodHours.ts`.
9. ✅ Filtro **Resources** (Libraries/Printers/CRC)

## Regras técnicas

- **Expo SDK 58** (compatível com o Expo Go da Play Store), TypeScript estrito.
- Mapa: `react-native-maps`. **Android:** `PROVIDER_GOOGLE` (no Expo Go funciona **sem chave de API**). Visual escolhido por `MAP_LOOK` em `src/config.ts`: `'google'` (atual) = padrão do Google sem comércios/transporte; `'illustrated'` = bege do Figma, que com zoom grande mistura prédios e chão (o Google pinta os dois como `landscape.man_made`). Modo escuro sempre usa o estilo escuro do app. **iPhone:** Apple Maps (o Google Maps no iOS exige chave + build próprio, não roda no Expo Go); lá o estilo bege não se aplica, só claro/escuro. Nomes de lugares no iPhone: `pointsOfInterestFilter` (lista `IOS_PLACE_LABELS` em `CampusMap.tsx`) — **não** use só `showsPointsOfInterests={false}`, que no Apple Maps some com todos os nomes.
- Aba que sobe: `@gorhom/bottom-sheet` (já instalado com reanimated/gesture-handler; o `GestureHandlerRootView` já está no `App.tsx`).
- Ícones: `lucide-react-native` (traço fino, igual ao Figma). Fonte: Inter (`@expo-google-fonts/inter`).
- **Sem backend**: tudo vem dos JSONs em `/data`, sempre importados via `data/index.ts`.
- Caminhos entre prédios: linhas retas com um "cotovelo" (formato L), ou pontos manuais no `WAYPOINTS` de `src/utils/route.ts`. **Sem API de rotas.**
- **Nunca colocar chaves de API / segredos no código** — o repo é público.
- Instalar pacotes sempre com `npx expo install <pacote>` (escolhe versões compatíveis com o SDK). Só usar bibliotecas que funcionam no Expo Go.
- Antes de dar uma tarefa como pronta: `npx tsc --noEmit` e `npx expo-doctor`.
- `react-native-web` está instalado, mas o `react-native-maps` **não funciona no navegador**: teste sempre no Expo Go (Android).

## Design (fonte da verdade: `/figma-designs`)

Telas exportadas do Figma. Siga-as o mais fielmente possível. Telas principais:
`Campus map · Start` (tela inicial), `Events · Collapsed/Half-open/Expanded`, `Event details · …`,
`People · You / Maya / You and Maya`, `Add Friends · Popup`, `Food · …`, `Campus resources · …`, `Campus details · …`,
`Schedule · View / Edit / Add course`, `Settings · Light / Dark mode / Edit account`.

### Cores (em `src/theme/colors.ts` — use sempre as constantes)

| Token | Hex | Uso |
|---|---|---|
| `ink` | `#233A43` | Títulos, ícones, pinos de eventos numerados, linha grossa "Next leg" |
| `muted` | `#6B776F` | Subtítulos, texto secundário, ícones/labels inativos da barra |
| `subtle` | `#9A9C8E` | Nomes de rua, notas de rodapé ("Sample events") |
| `surface` | `#FFFEFA` | Cards, botões flutuantes, barra inferior, bottom sheet |
| `border` / `divider` | `#E3E2D7` / `#EEECE4` | Borda da busca / separadores de lista |
| `activeTab` | `#EEE7D3` | Fundo do filtro selecionado na barra inferior |
| `handle` | `#C7C9BF` | "Pegador" do bottom sheet |
| `mapBackground` | `#EEEDE2` | Fundo do mapa |
| `mapRoad` / `mapBuilding` / `mapPark` | `#FFFCF2` / `#DDD6C4` / `#D5DEC4` | Ruas / prédios / gramados |
| `green` (+ `greenSoft #EEF3EC`) | `#477969` | **Você** (seu caminho), Printers, Restaurants/Coffees |
| `gold` | `#806C3C` | Horário dos eventos, categoria ("Social"), Dining hall, Libraries |
| `purple` (+ `purpleSoft #F1EDF3`) | `#83608D` | Amigo 1 (Maya) |
| `greenTint` | `#E5EBDD` | Caixa do link de convite, botão "Edit name & email" |
| `inputBorder` / `checkboxBorder` | `#C2CCC0` / `#9AA69B` | Campo de email / checkbox desmarcado |
| `friendPalette` | roxo, azul, dourado + 3 extras | Cor de cada amigo, na ordem; `tint(cor)` gera o fundo suave da linha selecionada |
| `blue` (+ `blueSoft #D7E3DF`) | `#526F8A` | Amigo 2, Vending, Campus Rec |
| `myLocation` | `#1A73E8` (escuro `#5AA2FF`) | "Você está aqui": a parada "agora" do SEU caminho, por cima de todos os pinos (zIndex 60) |

### Estilo
- Visual calmo, "mapa ilustrado" bege/verde, muito espaço em branco, cantos bem arredondados, sombras quase invisíveis.
- **Fonte Inter**: títulos de aba em Bold ~26px (`Events`, `People`), itens em SemiBold ~16px, texto secundário Regular ~14px em `muted`.
- **Topo**: botão quadrado branco de agenda (48×48, raio 16), campo "Search campus" com borda fina (raio 20), botão de configurações; abaixo, botão "adicionar amigo".
- **Barra de filtros "voadora"** (estilo Instagram): pílula flutuante com sombra, por cima do mapa e da aba. 4 itens: Events, Resources, Food, Friends. Em foco = pílula `activeTab` com borda + label Bold `ink`; ligado em segundo plano = apagado + ×.
- **A aba vai até o fim da tela, por trás da barra.** O MapScreen mede a barra e passa o espaço coberto via `BottomClearanceContext` (`components/sheet/bottomClearance.ts`); `FilterSheet` soma isso às alturas e `SheetScrollView` deixa esse espaço no fim da lista. **Use sempre `SheetScrollView`** — senão o último item fica atrás da barra.
- A barra tem fundo de vidro meio transparente (`colors.floatingBar`) e **encolhe/desce ao rolar uma lista para baixo**, voltando ao rolar para cima (`components/floatingBar.ts`; o `SheetScrollView` já avisa a rolagem). No Android ela não tem sombra (elevation + transparência fica manchado) — por isso a aba também não usa elevation no Android.
- **Bottom sheet**: fundo `surface`, cantos superiores ~28px, pegador cinza, título grande + subtítulo ("Today · 6 events"), botões chevron e X à direita. Listas com separadores finos.
- **Lista de eventos**: horário em `gold` à esquerda ("3:00" grande + "PM" pequeno), título SemiBold, local em `muted`, categoria em `gold`, chevron `>` à direita.
- **Lugares no mapa = ALFINETES** (formato gota, ponta no local exato; `components/map/PlacePin.tsx`, use `anchor={{ x: 0.5, y: 1 }}`): eventos em `ink` com o número; recursos/comida na cor da categoria com o código ("D1", "L2", "C3"); grupos com o número de lugares. Selecionado = alfinete maior + nome em cima. Os círculos numerados ficam só para as paradas do caminho (aulas) e o "você está aqui".
- **Cartão "My Route"** (`components/MyRouteCard.tsx`, canto inferior esquerdo, logo acima da barra/aba; some com a aba em tela cheia): a pílula liga/desliga o SEU caminho do dia. **Começa desligada** ao abrir o app (sem caminho nem legenda). Quando há caminho no mapa (seu e/ou de amigos), a legenda aparece no mesmo cartão. A aba Friends lista só amigos; o seu caminho entra junto com o dos amigos só se My Route estiver ligado (`usePeopleFilter(now, showMe)`). O filtro Events continua usando a sua agenda mesmo com o caminho escondido.
- **Caminhos**: linha fina na cor da pessoa = resto do dia; linha grossa `ink` = próximo trecho ("Next leg"); prédio com "anel" = onde a pessoa está agora. A legenda fica junto da pílula "My Route".
- **Câmera:** ao abrir/mudar um filtro, enquadra só os pinos DESSE filtro (ex.: só os restaurantes marcados), com margem pequena (`FIT_PADDING`); sem nada marcado, enquadra o seu caminho.
- **People**: linhas com checkbox na cor do amigo; linha selecionada com fundo suave da cor (`greenSoft`/`purpleSoft`); texto "Next: Clough Commons · 11:30 AM" na cor do amigo.
- Rodapés pequenos tipo "Sample events" / "Example schedules · Walking routes are illustrative".

## Estrutura de pastas

```
App.tsx                      # fontes + providers (gesture handler, safe area, tema, auth, amigos, agenda, toast) → AuthFlow ou RootScreen
data/                        # DADOS FALSOS (sem backend)
  buildings.json             # ~16 prédios da GT com coordenadas aproximadas
  schedule.json              # SUA agenda semanal: cursos (section + dias) e eventos pessoais. Segunda 16/11 = 5 aulas do mapa
  courses.json               # catálogo de cursos e sections (amostra; futuro: gt-scheduler)
  invites.json               # convites de eventos recebidos na demo (Maya: chegou com o app fechado → central de notificações)
  friends.json               # 3 amigos (Maya, Jordan, Priya): email, slug do convite, cor e agenda
  events.json                # 12 eventos do dia (prédios e barracas ao ar livre)
  me.json                    # o usuário logado (Alex Morgan): nome, email, slug do convite
  directory.json             # outros usuários do app, ainda não amigos (Sam, Chris) — para a demo de adicionar
  food.json                  # Food: dining halls (horário real + cardápio exemplo), 25 restaurantes reais
                             #   (horário semanal, Dining Dollars/BuzzCard, endereço — fonte dining.gatech.edu), vending
  index.ts                   # exporta os dados tipados + getBuilding() + DEMO_NOW + DEMO_TODAY
figma-designs/               # PNGs do Figma (design oficial)
src/
  config.ts                  # INVITE_BASE_URL (domínio provisório dos links de convite)
  types/index.ts             # Building, ClassSession, Friend, UserProfile, FriendRequest, Person, CampusEvent...
  theme/                     # colors.ts (+ tint(), mixHex(), coursePalette), typography.ts (Inter), mapStyle.ts
    ThemeProvider.tsx        #   modo claro/escuro: useAppTheme() → { c, isDark, courseBg(), courseText() }
  services/auth/             # "backend" de contas (hoje falso) — ver seção Contas
    authService.ts           #   interface AuthService + mockAuthService (sessão no AsyncStorage)
    AuthProvider.tsx         #   contexto React: useAuth() → status, user, logIn, signUp, logOut...
  screens/auth/              # WelcomeScreen (boas-vindas), AuthFormScreen (login/cadastro), AuthFlow (troca entre elas)
  components/auth/           # AuthButton, AuthTextField, ProviderLogos (Google/Microsoft), WelcomeIllustration (mapa em SVG)
  services/friends/          # "backend" de amigos (hoje falso) — ver seção Amigos
    friendsService.ts        #   interface FriendsService + mockFriendsService
    FriendsProvider.tsx      #   contexto React: useFriends() em qualquer tela
    invite.ts                #   montar/ler link de convite, validar email
  services/schedule/         # "backend" da agenda (hoje falso) — ver seção Agenda
    scheduleLogic.ts         #   LÓGICA pura: o que acontece em cada dia, repetição, conflitos, amigo livre/ocupado
    scheduleService.ts       #   interface ScheduleService + mockScheduleService (cursos, eventos, convites)
    catalogService.ts        #   busca de cursos/sections (como trocar pelo gt-scheduler está comentado lá)
    ScheduleProvider.tsx     #   contexto React: useSchedule() em qualquer tela (o mapa lê todayClasses daqui)
    confirmConflicts.ts      #   alerta "Overlaps with X — Replace / Keep both / Cancel"
  utils/
    time.ts                  # toMinutes, formatTime, formatTimeRange, nowTime, overlaps
    dates.ts                 # datas "YYYY-MM-DD": todayISO, weekdayOf, startOfWeek, formatDate, formatDaysLong...
    buildingSearch.ts        # reconhece um prédio da GT num texto livre ("Clough Commons 102" → culc)
    route.ts                 # buildDayRoute (paradas + trechos + "next leg"), regionFor, WAYPOINTS
    geo.ts                   # distâncias em metros, ponto mais próximo num caminho, minutos a pé
  hooks/useActiveFilters.ts  # quais filtros estão ligados (até 2, qualquer combinação) e qual está em foco
  hooks/useClock.ts          # relógio ao vivo do celular: { today, minutes } (atualiza a cada minuto e ao voltar do 2º plano)
  filters/
    filterConfig.ts          # lista dos 4 filtros (label, ícone, combinável, status)
    events/                  # ✅ filtro de Eventos (ver abaixo)
    people/                  # ✅ filtro People (amigos)
  components/
    friends/AddFriendModal.tsx  # popup "Add Friends" (link + email)
    Checkbox.tsx             # checkbox do Figma (só visual)
    map/CampusMap.tsx        # MapView base estilizado (recebe camadas como children; aceita ref). GT_CAMPUS_BOUNDS = campus inteiro (visão ao abrir o app e sem filtros)
    map/DayRouteLayer.tsx    # desenha o caminho de UM dia (reusar para amigos!)
    map/StopMarker.tsx       # marcador numerado + chip de horário
    map/useTracksViewChanges.ts  # truque para marcadores customizados no Android
    sheet/FilterSheet.tsx    # aba genérica (bottom sheet) com cabeçalho do Figma — reusar em todo filtro
    sheet/SheetScrollView.tsx  # lista rolável para dentro da aba (SEMPRE use esta, não a BottomSheetScrollView direto)
    MapTopBar.tsx, IconButton.tsx, FilterBar.tsx, BackPill.tsx
    MyRouteCard.tsx          # canto inferior esquerdo: pílula "My Route" + legenda dos caminhos (You / amigos / Next leg)
    ui/                      # peças com tema (claro/escuro): DialogCard (popup com "‹ Return"), FormField, AppButton, Toast
    schedule/                # tela My schedule: WeekView, BlockView, AddMenu, AddCourseModal (+SectionOption),
                             #   AddEventModal (+RepeatSelect, LocationField, InviteFriendsList), EventInviteModal
    settings/                # EditAccountModal, ThemeSwitch
  screens/
    RootScreen.tsx           # "navegação": mapa sempre montado embaixo + Schedule/Settings por cima + popup de convite
    MapScreen.tsx            # tela principal: junta mapa, camadas, abas, topo, legenda e barra
    ScheduleScreen.tsx       # My schedule (Week View / Block View, botão +)
    SettingsScreen.tsx       # Settings (conta, modo escuro)
```

### Como um filtro é montado (modelo: `src/filters/events/`)
Cada filtro tem sua pasta, para não haver conflito entre as pessoas do time:
```
src/filters/events/
  eventsOnRoute.ts     # LÓGICA pura: quais eventos cabem no seu dia (sem React)
  useEventsFilter.ts   # ESTADO: lista numerada, seções, selecionado, "mostrar todos"
  EventsLayer.tsx      # MAPA: pinos (vai dentro do <CampusMap>)
  EventPin.tsx         #   pino numerado (+ halo e nome quando selecionado)
  EventsSheet.tsx      # ABA: usa <FilterSheet>; lista ou detalhe
  EventListItem.tsx    #   linha da lista
  EventDetails.tsx     #   detalhe do evento (setinha ‹ no canto superior esquerdo volta para a lista; X do cabeçalho da lista fecha o filtro)
  eventsWithFriends.ts # LÓGICA: quais amigos podem ir junto a cada evento (Events + People)
src/filters/people/
  peopleDay.ts         # LÓGICA: dia de cada pessoa (status "Library now", "Next: ..."), prédios compartilhados
  usePeopleFilter.ts   # ESTADO: quem está visível (começa só "You")
  PeopleLayer.tsx      # MAPA: caminho de cada pessoa visível, deslocados para não sobrepor
  SharedBuildingCallout.tsx  # card "Clough Commons / You now · Maya 11:30" (com 2+ pessoas)
  PeopleSheet.tsx      # ABA: lista com checkbox + pedidos pendentes + "Add friends"
  PersonRow.tsx        #   linha de uma pessoa
src/filters/food/      # ✅ filtro Food (mesma lógica de seleção do Resources)
  useFoodFilter.ts         # ESTADO: categorias marcadas/expandidas, local aberto
  FoodLayer.tsx            # MAPA: pinos D/C/V (reusa ResourcePin)
  FoodSheet.tsx            # ABA: "Select all" + categorias, ou o cardápio do local
  FoodCategoryRow.tsx      #   categoria com checkbox, bolinha e locais expansíveis (tocar → cardápio)
  FoodDetails.tsx          #   "‹ Food" + "Menu for today" por refeição, com calorias/proteína/carbs/açúcar
src/filters/resources/ # ✅ filtro Campus resources (Libraries, Printers, CRC + detalhes de ocupação de prédios)
  useResourcesFilter.ts    # ESTADO: seleção, expansão, detalhes do prédio
  ResourcesLayer.tsx       # MAPA: pinos de recursos ativos (L1..L3, P1..P3, R1)
  ResourcePin.tsx          #   pino circular colorido com código (+ halo e chip de nome quando selecionado)
  ResourcesSheet.tsx       # ABA: lista de categorias ("Select all", Libraries, Printers, CRC) ou detalhe do prédio
  ResourceCategoryRow.tsx  #   linha de categoria com checkbox, dot colorido e sub-locais expansíveis
  CampusDetails.tsx        #   detalhe de ocupação por andar (Clough Commons) com barras coloridas e foto CC0
```
No `MapScreen`: chame o hook do filtro, renderize a camada dentro do `<CampusMap>` quando `active.includes('<key>')`,
adicione a key em `FILTERS_WITH_SHEET` e renderize a aba quando `sheetFilter === '<key>'`.
Só uma aba aparece por vez, mas as camadas de todos os filtros ligados aparecem juntas no mapa.
**Até 2 filtros ligados, qualquer combinação** (`MAX_ACTIVE_FILTERS`). Ligar um 3º tira o que está em segundo plano.
Na barra: o filtro **em foco** (aba aberta) fica escuro com borda; o de **segundo plano** fica apagado com um **×**.
Tocar no escuro desliga; tocar no apagado traz ele para frente; tocar no × desliga direto.
O filtro "People" aparece para o usuário como **Friends** (a key no código continua `'people'`).

### Regra "evento no caminho" (`eventsOnRoute.ts`)
1. O dia vira **janelas livres**: entre cada par de aulas (você caminhando do prédio A ao B, de `fim de A` até `início de B`) e **depois da última aula** (2h30).
2. Um evento entra se: fica a até **300 m** do caminho da janela (`NEAR_ROUTE_METERS`), está acontecendo durante a janela (e depois de "agora"), e sobra pelo menos **10 min** no evento (`MIN_MINUTES_AT_EVENT`) descontando a caminhada até a próxima aula e o desvio (ida e volta, a 80 m/min).
3. Se cabe em várias janelas, fica a que dá mais tempo no evento.
A lista é agrupada por janela; "Show all events" mostra também os que não cabem (pinos cinza).
No detalhe, uma linha tracejada liga o seu caminho ao evento (o desvio).

### Detalhe do evento
- Cabeçalho: "‹" (volta para a lista) + categoria + nome, e à direita **"Add to schedule"** (`AddToScheduleButton.tsx`): põe o evento na sua agenda de HOJE (checagem de conflito de sempre; o evento guarda `campusEventId`). Depois vira "✓ Added" — tocar oferece tirar da agenda.
- Não há botão "‹ All events" no topo do mapa (o "‹" da aba basta; o botão de adicionar amigo fica sempre lá).
- **Nomes de eventos em Title Case** ("Pickup Volleyball", "Bake Sale for Hurricane Relief"): palavras pequenas no meio em minúsculas, siglas intactas.

### Nome dos lugares no mapa (com zoom)
- Eventos, restaurantes/cafés, dining halls e bibliotecas mostram o NOME embaixo do alfinete quando você dá zoom (estilo dos nomes do Google/Apple Maps) e somem ao afastar. Impressoras, vending e CRC não.
- O zoom é acompanhado DURANTE o gesto (`onRegionChange`), então os nomes aparecem/somem na hora; o estado só muda ao cruzar o limite (`LABELS_SHOW_DELTA` / `LABELS_HIDE_DELTA` em `components/map/mapViewport.ts`, com folga para não piscar). Número maior = aparecem mais cedo.
- Peça compartilhada: `PlacePinLabel` + `placePinAnchor` em `PlacePin.tsx` (o nome faz parte do marcador; tocar nele abre o lugar).
- Nome grande → apelido: campo opcional `shortName` em `events.json` e `food.json`; sem apelido, `mapLabel` (`utils/mapLabel.ts`) corta numa palavra inteira com "…".

### Dia sem nada na agenda
- Tocar em **My Route** checa a sua agenda NAQUELE momento (`blocksOnDate`/`classesOnDate` em `onMyRouteChange`): sem nada hoje → "You have nothing on your schedule today"; com coisas hoje mas nenhuma com lugar no mapa → "Today's plans don't have a place on the map yet". Se o dia esvaziar com ele ligado, desliga sozinho.
- Eventos SEM prédio mas com posição (ex.: eventos ao ar livre adicionados pelo "Add to schedule") também viram parada do caminho (`ClassSession.place`).
- O filtro **Events** mostra TODOS os eventos do dia direto ("Showing all events of the day"): "All events today" (alfinetes normais) e "Earlier today" (os que já acabaram, apagados, "Ended"). O botão "Only show events on my route" some.

### Events + People ("ir junto com um amigo") — `eventsWithFriends.ts`
Com os dois filtros ligados, para cada evento do **seu** caminho aplicamos a mesma regra ao dia de cada amigo **visível**.
Se o evento também cabe no dia do amigo e vocês ficariam lá ao mesmo tempo por ≥ 10 min, ele aparece:
bolinhas coloridas no pino, "Maya & Priya can go too" na lista, e no detalhe "Together 1:20 – 2:00 PM · 40 min".

## Contas (login / cadastro / convidado)
- Ao abrir o app, `App.tsx` lê a sessão salva (`useAuth().status`): **logado** → mapa direto; **ninguém** → tela de boas-vindas (Create account / Log in / Continue as guest).
- **Convidado** vai direto ao mapa, mas não é salvo: na próxima abertura volta a tela de boas-vindas. Convidado não salva agenda.
- Login/cadastro com **email + senha** ou **Google / Microsoft**. Sessão salva com `@react-native-async-storage/async-storage`.
- **Settings** tem o botão **Log out** (convidado vê "Log in or sign up"); os dois voltam para a tela de boas-vindas.
- **Demo (serviço falso):** Google/Microsoft são simulados e entram como Alex Morgan (`data/me.json`). Login por email aceita qualquer senha para contas existentes (`alex.morgan@gatech.edu` ou as criadas no cadastro). O mock **não guarda senhas**.
- **Para o futuro:** criar `apiAuthService` com as mesmas funções de `AuthService` (servidor confere senha e devolve token); Google/Microsoft reais com `expo-auth-session` (os client IDs ficam em config, nunca segredos no código — e o login real provavelmente exige um development build em vez do Expo Go). Depois, `FriendsProvider` e a agenda devem usar `useAuth().user` no lugar de `data/me.json`, e a agenda passa a ser salva por conta.

### Pinos e ordem de amigos
- **Todo pino de filtro abre a descrição dele** (evento → detalhe do evento; restaurante → horário/pagamento; biblioteca/CRC → ocupação; impressora → `ResourceLocationDetails`). Se o filtro do pino estava em segundo plano, ele vem para a frente (`focusFilter` em `useActiveFilters`) e a descrição aberta nos outros filtros fecha.
- **Pinos tocáveis no Android (regras):**
  - A "foto" do marcador (o `<View>` dentro do `<Marker>`) define a área de toque. Mantenha do tamanho do que se vê; halo/área grande só quando selecionado.
  - `tappable={false}` **não funciona no Android**: marcadores decorativos (chips com nome/horário) roubam toques. Deixe-os com `zIndex` MENOR que os pinos tocáveis.
  - Pinos colados no zoom atual viram um grupo ("12") — `clusterOnScreen` (`utils/cluster.ts`) + `ClusterPin`; tocar dá zoom (`useMapViewport().zoomTo`). Use isso em toda camada nova de pinos.
- **Ao desligar um filtro, ele volta ao estado inicial** (`reset()` de cada hook: nada marcado/aberto; Friends volta a mostrar só "You").
- **Reordenar amigos:** na aba Friends, segure um amigo (~0,3 s) e arraste (`components/DraggableList.tsx`, reutilizável). A ordem é salva por `reorderFriends(ids)` no `friendsService`. "You" fica sempre no topo.

## Busca ("Search campus")
- `src/search/searchIndex.ts` (LÓGICA pura): `buildSearchIndex` monta tudo que dá para pesquisar; `searchItems` ordena por relevância (ignora acento/maiúscula/pontuação; acha por código "C3", "CS1332", tags, email...).
- `src/search/SearchScreen.tsx`: tela de busca (sem texto: amigos + atalhos; digitando: resultados).
- Ao tocar num resultado, `onSearchSelect` (MapScreen):
  - restaurante/dining/vending → liga Food e abre a descrição mostrando SÓ o alfinete dele (não marca a categoria; "‹ Return" volta para a lista com nada marcado);
  - biblioteca/impressora/CRC → idem em Resources;
  - evento → liga Events e abre o detalhe (se precisou ligar "Show all" para achá-lo, desliga ao voltar);
  - amigo → liga Friends, mostra o caminho dele e dá zoom onde ele deve estar agora (aula atual → próxima), com alfinete;
  - prédio / sua aula → zoom no prédio com alfinete (`SearchPin`); o alfinete some ao tocar nele ou mexer nos filtros;
  - atalho ("Libraries", "All restaurants & coffee"...) → liga o filtro com a categoria marcada.
- **Busca atual na barra:** depois de escolher um resultado, a barra mostra o nome dele com um **×**. O × tira o alfinete/descrição e desliga o filtro se foi a busca que ligou. A busca sai da barra sozinha quando o resultado deixa de estar na tela ("‹ Return", fechar o filtro...). Tocar no texto reabre a busca com o termo.
- **Item novo pesquisável?** Adicione em `buildSearchIndex` e trate o `SearchTarget` em `onSearchSelect`.

## Amigos (link de convite + email)
- Cada conta tem **email** e um **link de convite** próprio: `cambuzz.app/friends/<inviteSlug>` (`src/config.ts`, domínio provisório).
- Popup "Add Friends" (botão de pessoa com "+" no topo, ou "Add friends" na aba People): tocar no link **copia** (expo-clipboard); o ícone ao lado abre o **compartilhar** do Android. Embaixo, o campo de **email** envia um pedido de amizade.
- **Remover amigo:** na aba People, ícone de pessoa com "−" à direita de cada amigo → confirmação → `removeFriend(id)` no serviço. Quem foi removido pode ser adicionado de novo por email/link.
- Toda a lógica passa por `friendsService` (`src/services/friends/friendsService.ts`). As telas **não** leem `friends.json` direto: usam `useFriends()`.
- **Demo (serviço falso):** `sam.lee@gatech.edu` e `chris.park@gatech.edu` existem no `directory.json` e viram amigos na hora (com cor e caminho). Qualquer outro email válido fica como **pedido pendente** na aba People.
- **Para o futuro (não implementado):**
  1. Cadastro/login (o email e o `inviteSlug` nascem aqui) → substituir `data/me.json`.
  2. Backend: criar `apiFriendsService` com as mesmas funções da interface `FriendsService` e trocar a linha `export const friendsService = ...`.
  3. Deep link: `scheme` no `app.json` + `expo-linking` para abrir `cambuzz.app/friends/<slug>` no app e chamar `acceptInviteLink(link)` (já existe e já valida o link).
  4. Aceitar/recusar pedidos recebidos; envio de email de convite pelo servidor.

## Agenda (My schedule) — Etapa 4
- **Modelo:** `MySchedule` = cursos (`EnrolledCourse`: section, professor, encontros semanais com dias/horário/prédio) + eventos (`PersonalEvent`: dia, horário, `repeat`, local, convites). Cursos só acontecem entre `termStart` e `termEnd`.
- **O mapa** usa `useSchedule().todayClasses` (aulas + eventos **com prédio** de hoje). Adicionou algo hoje → aparece no caminho do dia.
- **Add Course:** código → "Find sections" (sugere enquanto digita) → toque na section = entra direto na agenda. Se já tem o curso, troca de section. Section que bate com algo mostra aviso em vermelho.
- **Add Event:** nome, dia (caixa de calendário `CalendarSelect`), From/To (caixa de horários `TimeSelect`, de 15 em 15 min), Repeat (uma vez, todo dia, dias úteis, semanal, mensal), local (reconhece prédio → aparece no mapa). Done → se bater com algo: **Replace / Keep both / Cancel**.
  - *Replace* = o novo ganha: curso x curso → o antigo sai; evento de uma vez → sai; o resto → só os dias em conflito são pulados (`skipDates`).
  - Conflitos de coisas que se repetem são procurados até 120 dias à frente (`CONFLICT_HORIZON_DAYS`).
- **Invite friends:** lista os amigos com "Free · …" / "Busy · CS 1332 until 1:20 PM" (puxa a agenda deles; na demo as aulas do `friends.json` valem de seg a sex). Na demo, quem está livre **aceita sozinho ~3,5 s depois** e o evento entra no dia dele (aparece no filtro People).
- **Convite recebido:**
  - Chegou com o app ABERTO → popup "Maya invited you" (Accept/Decline) por cima de qualquer tela.
  - Chegou com o app FECHADO → só na **central de notificações**: sininho à esquerda do X na aba Friends; bolinha vermelha = não visto; abrir marca tudo como visto. Lá dá para aceitar/recusar; um recusado ainda pode ser aceito ("Accept instead"). Ao recusar pelo popup, o aviso tem "Tap to undo".
  - Aceitar põe na sua agenda (com a mesma checagem de conflito).
  - Demo (`data/invites.json`): `"arrival": "while-away"` = já está na central ao abrir (é o caso da Maya — sem popup na apresentação); `"arrival": "live"` (+ `"delaySeconds"`) = chega com o app aberto e abre o popup.
- **Trocar de semana:** setas ‹ › ou **arrastar a grade para os lados** (esquerda→direita = semana anterior; direita→esquerda = próxima). Gesto `usePanGesture` (gesture-handler v3) no `WeekView.tsx`.
- **Week View:** topo fixo ("Campus map", título, semana e dias da semana); só a grade de horas rola, por baixo do cabeçalho. Grade do dia inteiro (12 AM–12 AM); ao abrir, começa 1 hora antes da linha vermelha (`LEAD_MINUTES` em `WeekView.tsx`); **linha vermelha** do "agora" na coluna de hoje (`useClock`, anda a cada minuto, cor `nowLine`); blocos que já terminaram ficam apagados (opacidade 0.45).
- **Eventos que viram a noite:** no Add Event, a lista do "To" continua depois da meia-noite (separador "Next day"). Salvo como `endsNextDay: true` (`end` = horário do dia seguinte). `eventPortionsOn()` em `scheduleLogic.ts` corta em 2 pedaços ("23:30–24:00" no dia do início + "00:00–02:30" no dia seguinte) — use essa função sempre que precisar dos horários de um evento num dia.
- Tocar num curso/evento (Week ou Block View) → detalhes + "Skip <dia>" / "Drop course" / "Delete event".
- **Tudo em memória** (some ao fechar o app), igual aos amigos. Para o futuro: `apiScheduleService` / `apiCatalogService` com as mesmas funções; catálogo real do gt-scheduler (ver comentário em `catalogService.ts`); notificação push para convites.

## Settings e modo escuro
- Conta: nome/email vêm de `useFriends().me`; "Edit name & email" chama `updateProfile` (o link de convite não muda).
- **Modo escuro vale para o app inteiro** (mapa, barra, abas dos filtros, popups, Schedule, Settings). Fica em memória (`ThemeProvider`).
- **Regra para TODO componente novo** (senão ele fica claro no modo escuro):
  ```tsx
  import { useAppTheme, useThemedStyles, type Palette } from '../theme';
  export function MeuComponente() {
    const { colors } = useAppTheme();            // cores do modo atual (mesmas chaves de colors.ts)
    const styles = useThemedStyles(makeStyles);  // estilos refeitos ao trocar o modo
    ...
  }
  const makeStyles = (colors: Palette) => StyleSheet.create({ ... colors.surface ... });
  ```
  - Não importe `colors` direto de `theme` dentro de componentes (é sempre a paleta clara).
  - Texto/ícone sobre fundo `ink` (pinos) → `colors.onInk`. Fundo suave de uma cor → `useAppTheme().tint(cor)`.
  - Cores de dados (amigos) no mapa → `useAppTheme().vivid(cor)` (mais claras no escuro).
  - Telas Schedule/Settings usam a paleta `c` (`AppColors`) do mesmo hook.
- Mapa: `useAppTheme().mapStyle` (`googleCleanMapStyle` ou `campusMapStyle` no claro, conforme `MAP_LOOK`; `campusMapStyleDark` no escuro — tudo em `mapStyle.ts`).

## Convenções
- Horários são strings `"HH:MM"` 24h; converta com `toMinutes()` para comparar.
- `DEMO_NOW` / `DEMO_TODAY` em `data/index.ts` estão em `null` = o app usa a **data e hora reais do celular**. Para uma apresentação sempre igual, ponha `'11:15'` e `'2026-11-16'` (segunda com as 5 aulas do mapa).
- Datas são strings `"YYYY-MM-DD"` (use `src/utils/dates.ts`).
- Textos da interface em **inglês** (como no Figma); comentários do código podem ser em português.
- Marcadores customizados no Android: use o hook `useTracksViewChanges([deps])` (liga ao montar/mudar, desliga depois).
- **Gestos da aba:** arrastar o **cabeçalho** (pegador + título) sobe/desce a aba; arrastar a **lista** só rola a lista (em qualquer altura). Por isso o cabeçalho é o `handleComponent` do bottom-sheet e `enableContentPanningGesture` está desligado no `FilterSheet`.

## Como rodar
```
npm install
npx expo start          # escaneie o QR code com o app Expo Go (Android)
```
Celular e computador na mesma rede Wi‑Fi. Se a rede bloquear (ex.: eduroam), use `npx expo start --tunnel`.
