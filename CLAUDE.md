# Cambuzz — guia do projeto

App Android (React Native + Expo + TypeScript) criado no hackathon da Georgia Tech, tema **"Smarter Campus Map"**.
Time de 4 pessoas iniciantes em React Native trabalhando em paralelo: **explique brevemente o que fizer** e mantenha cada tela/componente no seu próprio arquivo.

Leia também o [AGENTS.md](AGENTS.md) (regras gerais do Expo: usar `npx expo install`, consultar a doc versionada do SDK, etc.).

## A ideia

O usuário insere sua agenda de aulas e, ao abrir o app, vê o mapa da Georgia Tech com o **caminho do dia** destacado (de aula em aula). Embaixo há uma **barra de filtros**. Ao tocar num filtro, uma aba (bottom sheet) sobe até metade da tela e o mapa mostra os itens daquele filtro.

### Prioridades
1. ✅ Mapa + caminho do dia (Etapa 1)
2. ⏳ Filtro **Events**: eventos perto do caminho do usuário, no horário em que ele está passando (ex.: entre uma aula e outra)
3. ⏳ Filtro **People** (amigos): caminho de cada amigo (uma cor cada), com mostrar/esconder por amigo
4. ⏳ Events + People ativos ao mesmo tempo → ver qual evento dá pra ir junto com um amigo

**Depois (não fazer agora; estrutura já preparada):** filtros **Food options** (Dining) e **Campus resources** (Libraries/Printers). Eles já aparecem na barra com `status: 'planned'` em `src/filters/filterConfig.ts`.

## Regras técnicas

- **Expo SDK 58** (compatível com o Expo Go da Play Store), TypeScript estrito.
- Mapa: `react-native-maps` com `PROVIDER_GOOGLE`. No Expo Go o Google Maps funciona **sem chave de API**.
- Aba que sobe: `@gorhom/bottom-sheet` (já instalado com reanimated/gesture-handler; o `GestureHandlerRootView` já está no `App.tsx`).
- Ícones: `lucide-react-native` (traço fino, igual ao Figma). Fonte: Inter (`@expo-google-fonts/inter`).
- **Sem backend**: tudo vem dos JSONs em `/data`, sempre importados via `data/index.ts`.
- Caminhos entre prédios: linhas retas com um "cotovelo" (formato L), ou pontos manuais no `WAYPOINTS` de `src/utils/route.ts`. **Sem API de rotas.**
- **Nunca colocar chaves de API / segredos no código** — o repo é público.
- Instalar pacotes sempre com `npx expo install <pacote>` (escolhe versões compatíveis com o SDK). Só usar bibliotecas que funcionam no Expo Go.
- Antes de dar uma tarefa como pronta: `npx tsc --noEmit` e `npx expo-doctor`.

## Design (fonte da verdade: `/figma-designs`)

Telas exportadas do Figma. Siga-as o mais fielmente possível. Telas principais:
`Campus map · Start` (tela inicial), `Events · Collapsed/Half-open/Expanded`, `Event details · …`,
`People · You / Maya / You and Maya`, `Food options · …`, `Campus resources · …`, `Campus details · …`.

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
| `blue` (+ `blueSoft #D7E3DF`) | `#526F8A` | Amigo 2, Vending, Campus Rec, ponto de localização |

### Estilo
- Visual calmo, "mapa ilustrado" bege/verde, muito espaço em branco, cantos bem arredondados, sombras quase invisíveis.
- **Fonte Inter**: títulos de aba em Bold ~26px (`Events`, `People`), itens em SemiBold ~16px, texto secundário Regular ~14px em `muted`.
- **Topo**: botão quadrado branco de agenda (48×48, raio 16), campo "Search campus" com borda fina (raio 20), botão de configurações; abaixo, botão "adicionar amigo". Chips brancos de info ao lado (ex.: "Your day · Today · 11:15 AM").
- **Barra inferior**: 4 itens (ícone + label): Events, Campus resources, Food options, People. Selecionado = fundo `activeTab` em pílula + label SemiBold `ink`.
- **Bottom sheet**: fundo `surface`, cantos superiores ~28px, pegador cinza, título grande + subtítulo ("Today · 6 events"), botões chevron e X à direita. Listas com separadores finos.
- **Lista de eventos**: horário em `gold` à esquerda ("3:00" grande + "PM" pequeno), título SemiBold, local em `muted`, categoria em `gold`, chevron `>` à direita.
- **Pinos de eventos**: círculos `ink` com número branco e borda branca. **Pinos de recursos**: círculos com código ("D1", "L2", "P1") na cor da categoria.
- **Caminhos**: linha fina na cor da pessoa = resto do dia; linha grossa `ink` = próximo trecho ("Next leg"); prédio com "anel" = onde a pessoa está agora. Legenda branca sobre o mapa.
- **People**: linhas com checkbox na cor do amigo; linha selecionada com fundo suave da cor (`greenSoft`/`purpleSoft`); texto "Next: Clough Commons · 11:30 AM" na cor do amigo.
- Rodapés pequenos tipo "Sample events" / "Example schedules · Walking routes are illustrative".

## Estrutura de pastas

```
App.tsx                      # fontes + providers (gesture handler, safe area) → MapScreen
data/                        # DADOS FALSOS (sem backend)
  buildings.json             # ~16 prédios da GT com coordenadas aproximadas
  schedule.json              # agenda do usuário (5 aulas)
  friends.json               # 3 amigos, cada um com cor e agenda
  events.json                # 12 eventos do dia (prédios e barracas ao ar livre)
  index.ts                   # exporta os dados tipados + getBuilding() + DEMO_NOW
figma-designs/               # PNGs do Figma (design oficial)
src/
  types/index.ts             # Building, ClassSession, DaySchedule, Friend, CampusEvent, FilterKey
  theme/                     # colors.ts, typography.ts (Inter), mapStyle.ts (estilo do Google Maps)
  utils/
    time.ts                  # toMinutes, formatTime, nowTime, overlaps
    route.ts                 # buildDayRoute (paradas + trechos + "next leg"), regionFor, WAYPOINTS
  hooks/useActiveFilters.ts  # quais filtros estão ligados (Events+People combinam)
  filters/filterConfig.ts    # lista dos 4 filtros (label, ícone, combinável, status)
  components/
    map/CampusMap.tsx        # MapView base estilizado (recebe camadas como children)
    map/DayRouteLayer.tsx    # desenha o caminho de UM dia (reusar para amigos!)
    map/StopMarker.tsx       # marcador numerado + chip de horário
    MapTopBar.tsx, IconButton.tsx, InfoChip.tsx, RouteLegend.tsx, FilterBar.tsx
  screens/MapScreen.tsx      # tela principal: junta mapa, camadas, topo, legenda e barra
```

### Onde colocar cada filtro (próximas etapas)
Cada filtro ganha sua pasta, para não haver conflito entre as pessoas do time:
```
src/filters/events/   EventsLayer.tsx (pinos no mapa)  EventsSheet.tsx (lista na aba)  eventsNearRoute.ts (lógica)
src/filters/people/   FriendsLayer.tsx                 PeopleSheet.tsx
src/filters/food/     (depois)
src/filters/resources/(depois)
```
Depois é só renderizar a camada dentro do `<CampusMap>` e a aba no `MapScreen` quando `active.includes('<key>')`.
Para "eventos perto do caminho no horário certo": use `buildDayRoute(...).legs` (cada trecho tem `path`, `freeFrom`, `freeUntil`) + `overlaps()` de `utils/time.ts`.

## Convenções
- Horários são strings `"HH:MM"` 24h; converta com `toMinutes()` para comparar.
- `DEMO_NOW` em `data/index.ts` fixa o "agora" em 11:15 para a demo ficar sempre igual (ponha `null` para usar o relógio real).
- Textos da interface em **inglês** (como no Figma); comentários do código podem ser em português.
- Marcadores customizados no Android: use o padrão de `tracksViewChanges` de `StopMarker.tsx` (liga no início, desliga depois).

## Como rodar
```
npm install
npx expo start          # escaneie o QR code com o app Expo Go (Android)
```
Celular e computador na mesma rede Wi‑Fi. Se a rede bloquear (ex.: eduroam), use `npx expo start --tunnel`.
