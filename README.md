<div align="center">

<img src="assets/cambuzz_logo.png" alt="Cambuzz logo" width="140" />

# Cambuzz

**A smarter campus map for Georgia Tech.**
Your day's route from class to class, plus the events, food, study spots and friends along the way.

![Expo SDK 58](https://img.shields.io/badge/Expo-SDK%2058-000020?logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React%20Native-0.88-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Platform](https://img.shields.io/badge/platform-Android%20%7C%20iOS-477969)

Built at a Georgia Tech hackathon · Theme: *Smarter Campus Map*

</div>

---

## Table of contents

- [About](#about)
- [Screenshots](#screenshots)
- [Features](#features)
- [How "events on your route" works](#how-events-on-your-route-works)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [Demo data and accounts](#demo-data-and-accounts)
- [Project structure](#project-structure)
- [Roadmap](#roadmap)
- [Acknowledgements](#acknowledgements)

## About

Most campus maps show you *where* things are. Cambuzz shows you *what fits into your day*.

Enter your class schedule and Cambuzz draws your walking route across campus, from one class to the next. A floating filter bar lets you layer on what you care about:

- **Events** happening near your path while you're walking past
- **Food**: dining halls, restaurants and cafés with real hours, plus vending machines
- **Resources**: libraries, printers and the CRC
- **Friends**: their routes for the day, so you can see when you'll cross paths

Turn on **Events** and **Friends** together and Cambuzz tells you which events you and a friend could go to *together* between classes.

[Demo Workflow](DEMO_WORKFLOW.md)

## Screenshots

<table>
  <tr>
    <td align="center"><img src="figma-designs/Campus%20map%20%C2%B7%20Start.png" width="220" /><br /><sub><b>Campus map</b></sub></td>
    <td align="center"><img src="figma-designs/Events%20%C2%B7%20Half-open.png" width="220" /><br /><sub><b>Events on your route</b></sub></td>
    <td align="center"><img src="figma-designs/People%20%C2%B7%20You%20and%20Maya.png" width="220" /><br /><sub><b>You and a friend</b></sub></td>
  </tr>
  <tr>
    <td align="center"><img src="figma-designs/Food%20details%20%C2%B7%20North%20Avenue%20Dining%20Hall.png" width="220" /><br /><sub><b>Dining hall details</b></sub></td>
    <td align="center"><img src="figma-designs/Campus%20details%20%C2%B7%20Clough%20Commons.png" width="220" /><br /><sub><b>Building occupancy</b></sub></td>
    <td align="center"><img src="figma-designs/Schedule%20%C2%B7%20Week%20View.png" width="220" /><br /><sub><b>My schedule</b></sub></td>
  </tr>
</table>

<sub>These are the Figma designs the app was built from. All of them are in <a href="figma-designs/"><code>figma-designs/</code></a>.</sub>

## Features

### 🗺️ Your day on the map
- Your route between today's classes, with the **next leg** highlighted and a "you are here" marker at your current stop
- Walking paths that follow real sidewalks (via [OpenRouteService](https://openrouteservice.org/)), cached for the campus so they load instantly
- The **My Route** toggle shows or hides your path, with a legend for you and each friend

### 🎉 Events
- Events that **fit between your classes**: close to your path, happening while you walk by, with enough time to stop (see [below](#how-events-on-your-route-works))
- Event details, plus **Add to schedule** to drop an event into today's route
- With Friends on: "Maya & Priya can go too", and the time window you'd be there together

### 🍔 Food
- **Dining halls**: real hours and menus with nutrition info
- **25+ restaurants and cafés** across campus, the Student Center and Tech Square, with real weekly hours, open/closed status, and Dining Dollars and BuzzCard info (from dining.gatech.edu)
- **Vending machines** with what's inside

### 📚 Campus resources
- Libraries, printers and the Campus Recreation Center
- Floor-by-floor occupancy for buildings like Clough Commons

### 👥 Friends
- Each friend's route in their own color, with show/hide per friend
- "Library now" / "Next: Clough Commons · 11:30 AM" status
- **Add Friends** by invite link (copy or share) or by email
- Drag to reorder friends, and remove friends
- **Notifications** for event invites, with accept/decline

### 📅 My schedule
- **Week View** and **Block View**, a live "now" line, and swiping between weeks
- **Add Course**: search a course, then pick a section
- **Add Event**: repeats, overnight events, location recognition, and inviting friends (it shows who's free or busy)
- Conflict detection with **Replace / Keep both / Cancel**

### 🔍 Search and more
- **Search campus**: friends, your classes, food, resources, events, buildings and category shortcuts
- **Dark mode** across the whole app, map included
- Accounts: email, Google or Microsoft (simulated in the demo), or continue as a guest
- Georgia Tech-themed filter icons, map pins that group together when zoomed out, and place names that appear as you zoom in

## How "events on your route" works

The logic lives in [`src/filters/events/eventsOnRoute.ts`](src/filters/events/eventsOnRoute.ts):

1. Your day is split into **free windows**: each walk between two classes, plus 2½ hours after your last class.
2. An event fits a window if:
   - it's within **300 m** of your path for that window,
   - it's happening during the window (and hasn't ended yet), and
   - you'd still get at least **10 minutes** there after the detour and the walk to your next class (at 80 m/min).
3. If an event fits several windows, Cambuzz keeps the one that gives you the most time there.

With **Friends** on, the same rule runs on each visible friend's day. If you'd both be at the event at the same time for at least 10 minutes, it shows up as something you can do together.

## Tech stack

| | |
|---|---|
| **Framework** | [Expo](https://expo.dev/) SDK 58 · React Native 0.88 · React 19 |
| **Language** | TypeScript (strict) |
| **Map** | [`react-native-maps`](https://github.com/react-native-maps/react-native-maps): Google Maps on Android, Apple Maps on iOS |
| **Bottom sheet** | [`@gorhom/bottom-sheet`](https://github.com/gorhom/react-native-bottom-sheet) + Reanimated + Gesture Handler |
| **Walking routes** | [OpenRouteService](https://openrouteservice.org/) foot-walking API, with a preloaded campus cache |
| **Icons and fonts** | [`lucide-react-native`](https://lucide.dev/), custom SVG icons, Roboto and Roboto Slab |
| **Storage** | AsyncStorage (login session) |
| **Backend** | None yet: JSON data in [`data/`](data/) behind swappable service interfaces |

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS)
- The **Expo Go** app on your phone ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) · [iOS](https://apps.apple.com/app/expo-go/id982107779))

### Run it

```bash
git clone https://github.com/gabrozario/cambuzz.git
cd cambuzz
npm install
npx expo start
```

Scan the QR code with Expo Go (Android) or the Camera app (iOS). Your phone and computer need to be on the same Wi-Fi network. If the network blocks it (eduroam, for example), use:

```bash
npx expo start --tunnel
```

> [!NOTE]
> `react-native-maps` doesn't work in the browser, so test on a phone with Expo Go, not with `expo start --web`.

### Checks

```bash
npx tsc --noEmit     # type check
npx expo-doctor      # Expo project health check
```

## Configuration

| Variable | What it's for |
|---|---|
| `EXPO_PUBLIC_ORS_API_KEY` | [OpenRouteService](https://openrouteservice.org/dev/#/signup) key for walking routes that aren't in the preloaded campus cache |

Put it in a `.env.local` file at the project root (this file is git-ignored):

```bash
EXPO_PUBLIC_ORS_API_KEY=your-key-here
```

Other settings are in [`src/config.ts`](src/config.ts). `MAP_LOOK` switches between the clean Google style and the illustrated beige style, and `INVITE_BASE_URL` sets the domain for invite links.

**Fixed demo time:** the app uses your phone's real date and time. For a repeatable demo, set `DEMO_NOW = '11:15'` and `DEMO_TODAY = '2026-11-16'` in [`data/index.ts`](data/index.ts). That's a Monday with five classes on the map.

## Demo data and accounts

There's no backend yet. Everything comes from JSON files in [`data/`](data/), loaded through service interfaces (`authService`, `friendsService`, `scheduleService`) so a real API can be added later without touching the screens.

| To try | Do this |
|---|---|
| Log in | **Google** or **Microsoft** (simulated), or `alex.morgan@gatech.edu` with any password |
| Add a friend instantly | Add `sam.lee@gatech.edu` or `chris.park@gatech.edu` by email |
| Pending friend request | Add any other valid email |
| Event invite | Open the bell in the **Friends** sheet: Maya has invited you to something |
| Invite a friend | Create an event and invite a friend who's free. They accept after a few seconds |

Changes to your schedule and friends are kept in memory and reset when the app closes.

## Project structure

```
App.tsx                  # fonts, providers, intro video → welcome/auth or the map
data/                    # demo data: buildings, schedules, friends, events, food…
figma-designs/           # the Figma screens the app is built from
src/
├── screens/             # MapScreen, ScheduleScreen, SettingsScreen, auth screens
├── filters/             # one folder per map filter
│   ├── events/          #   logic (eventsOnRoute) · state hook · map layer · sheet
│   ├── people/          #   (shown as "Friends")
│   ├── food/
│   └── resources/
├── components/          # map pins, bottom sheet, filter bar, schedule & settings UI
├── services/            # auth, friends, schedule, routing (mock services, API-ready)
├── search/              # search index and search screen
├── hooks/  utils/       # active filters, clock, time/date/geo helpers
└── theme/               # colors, typography, light/dark map styles
```

Each filter follows the same pattern: **pure logic** (no React) → a **state hook** → a **map layer** → a **bottom sheet**. This let three people build filters in parallel without conflicts.

## Acknowledgements

- Dining hours and payment info: [Georgia Tech Dining](https://dining.gatech.edu/)
- Walking routes: [OpenRouteService](https://openrouteservice.org/) by HeiGIT
- Icons: [Lucide](https://lucide.dev/)
- Built by a team of three at a Georgia Tech hackathon 🐝
