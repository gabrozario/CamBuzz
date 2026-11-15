# Cambuzz — Live Demo Workflow

A script for presenting Cambuzz on a live device. It starts with what the app is for, then moves through the features from simple to advanced. Each step ends with a checkbox, and the [Feature coverage checklist](#feature-coverage-checklist) at the bottom maps every feature to the step that shows it, so nothing gets skipped.

**Length:** about 12–15 minutes for the full run. A 5-minute version is at the end.
**Roles:** a **Presenter** who talks, and a **Driver** who holds the phone (mirrored to the screen). One person can do both.

---

## 0. Pre-flight (do this before the audience arrives)

### Device and build
- [ ] Phone has **Expo Go** installed and is on the same network as the laptop (`npx expo start`, or `npx expo start --tunnel` on eduroam).
- [ ] Screen mirroring works (scrcpy for Android, QuickTime for iPhone), and the phone's brightness is up and Do Not Disturb is on.
- [ ] `.env.local` has `EXPO_PUBLIC_ORS_API_KEY` set (only needed for routes outside the preloaded campus cache, so it's a safety net).
- [ ] Use a phone, not `--web`. `react-native-maps` doesn't run in the browser.

### Freeze the clock (so the demo is the same every time)
In [`data/index.ts`](../data/index.ts):

```ts
export const DEMO_NOW: string | null = '11:15';
export const DEMO_TODAY: ISODate | null = '2026-11-16'; // Monday, 5 classes
```

At 11:15 on Monday you're in **CS 1332 at CULC**. You've already had PHYS 2211 (9:00) and MATH 1554 (10:00). Still to come: CS 2110 at Klaus (2:00) and the PHYS 2211 lab at the Instructional Center (4:30). Maya's invite in [`data/invites.json`](../data/invites.json) is dated 2026-11-16, so it only shows up when `DEMO_TODAY` matches.

> Remember to set both back to `null` after the demo, before you commit.

### Optional: make the live invite popup appear
The popup that appears over any screen when a friend invites you ([`EventInviteModal`](../src/components/schedule/EventInviteModal.tsx)) only appears for invites with `"arrival": "live"`. The current demo data has only a `"while-away"` invite, which goes straight to the notification bell. To show the popup, add a second entry to `data/invites.json`:

```json
{
  "id": "inv-jordan-1",
  "from": { "id": "jordan", "name": "Jordan Ellis" },
  "event": {
    "name": "Late Lunch at Tech Square",
    "location": "Tech Square",
    "date": "2026-11-16",
    "start": "15:30",
    "end": "16:15",
    "repeat": "none"
  },
  "status": "pending",
  "arrival": "live",
  "delaySeconds": 45
}
```

Set `delaySeconds` so it arrives during **Step 4 (Friends)**. Check the friend `id` against [`data/friends.json`](../data/friends.json) first.

### Reset state
- [ ] **Fully close and reopen the app** right before you start. Schedule and friend changes are kept in memory only, so this resets everything.
- [ ] Start **logged out** (Settings → Log out in a previous run), so the Welcome screen shows.
- [ ] Start in **Light mode**. Dark mode is shown later.

---

## The storyline

| # | Step | Complexity | What it shows |
|---|------|-----------|---------------|
| 1 | Opening and sign-in | ★ | What Cambuzz is, who it's for |
| 2 | Your day on the map | ★ | The core idea: your route between classes |
| 3 | Single filters: Food and Resources | ★★ | Pins, details, the bottom sheet |
| 4 | Friends | ★★ | Social layer, friend routes, add, reorder |
| 5 | Events on your route | ★★★ | The main algorithm |
| 6 | Combining filters: Events + Friends | ★★★★ | "Who can go with me?" |
| 7 | My Schedule: planning the week | ★★★★ | Courses, events, invites, conflicts |
| 8 | Search, settings, and polish | ★★ | Search everything, dark mode, accounts |
| 9 | Close | — | Under the hood and roadmap |

---

## Step 1 — Opening and sign-in (~1 min)

**Say:** "Most campus maps show you *where* things are. Cambuzz shows you *what fits into your day*. You put in your class schedule, it draws your walking route across Georgia Tech, and then it shows you the food, study spots, events, and friends along the way."

**Do:**
1. Launch the app. The **intro video** plays (white → logo animation → fade).
2. **Welcome screen:** point out the Tech Tower photo, *"Your Day on One Map"*, and the three options.
3. Mention **Continue as guest** ("guests can explore the map, but you log in to save your schedule"). Don't tap it yet; it comes back in Step 8.
4. Tap **Log in** → show the email/password form, then tap **Continue with Google** (simulated sign-in as Alex Morgan).
   - Backup: email `alex.morgan@gatech.edu`, any password.

- [ ] Intro video · [ ] Welcome screen · [ ] Log in (Google / Microsoft / email) · [ ] Guest option mentioned

---

## Step 2 — Your day on the map (~1.5 min)

**Say:** "This is the home screen: the Georgia Tech campus. Everything else happens on this map."

**Do:**
1. Point out the **top bar**: the calendar icon (My Schedule), **Search campus**, Settings, and Add friend.
2. Point out the **floating filter bar** at the bottom: Events, Resources, Food, Friends, with the Georgia Tech-themed icons (football, Tech Tower, beehive).
3. Tap the **My Route** pill (bottom-left).
   - Your walking route for today appears, following real sidewalks (OpenRouteService).
   - The **next leg** is highlighted, and the **"you are here"** stop (CULC, CS 1332) has a ring around it.
   - Read the legend: *"Ringed = now · Thin line = rest of day."*
4. Pinch to zoom in → **building names appear** as you zoom. Zoom out → they disappear.
5. Turn My Route **off** again to show it's a toggle.

**Say:** "That's the core: your day as a path. Next, we add things on top of it."

- [ ] Top bar · [ ] Filter bar · [ ] My Route toggle and legend · [ ] Next leg / "now" marker · [ ] Labels on zoom

---

## Step 3 — Single filters: Food and Resources (~2.5 min)

### 3a. Food
1. Tap **Food**. The bottom sheet opens with no categories selected (*"No resources selected · Choose a filter below"*).
2. Check **Dining hall** → pins appear and the map zooms to fit them.
3. Tap **North Avenue Dining Hall** (in the list or on its pin) → **details**: real **hours**, open/closed status, **payment** (Dining Dollars / BuzzCard), and **Menu for today** with nutrition info.
4. Tap **‹ Food** to go back. Tap **Select all** → restaurants, cafés and vending machines are added (25+ places).
5. Zoom out → nearby pins **merge into cluster pins**. Tap a cluster → the map zooms into it.
6. Open a **vending machine** to show what's inside.
7. Drag the sheet between its heights (collapsed / middle / full). Scroll the list and note that the **filter bar shrinks** while scrolling and returns when you scroll back up.

### 3b. Resources
1. Tap **Resources**. **Food stays on** in the background: its pill fades and gets a **×**.
2. Check **Libraries** → open **Clough Commons** → **Live Waitz Occupancy**, floor by floor.
3. Check **Printers** → open one → *"Where to find it"* and *"BuzzCard access required"*.
4. Mention the **Campus Recreation Center**.
5. Tap **Food** in the bar to bring it back to the front, then tap **×** on the background pill to turn it off.

**Say:** "Up to two filters can be on at once. The one you're looking at has its sheet open, and the other stays on the map."

- [ ] Dining hall details (hours, payment, menu, nutrition) · [ ] Restaurants and cafés · [ ] Vending · [ ] Select all · [ ] Cluster pins · [ ] Sheet heights · [ ] Filter bar shrinks on scroll · [ ] Libraries · [ ] Clough occupancy · [ ] Printers · [ ] CRC · [ ] Two filters at once / × to turn off

---

## Step 4 — Friends (~2 min)

1. Turn everything off and tap **Friends**. You'll see Maya, Jordan and Priya.
2. Check **Maya** → her route appears **in her color**. Her row shows where she is and *"Next: …"*.
3. Turn **My Route** on as well → where you and Maya are in the same building, a **shared-building card** appears (e.g. *"Clough Commons · You now · Maya 11:30"*). The legend lists you and Maya.
4. Check **Priya** too, to show more than one friend.
5. **Hold and drag** a friend to **reorder** the list.
6. Tap **Add friends**:
   - **Copy your link** → *"Link copied"*. Tap the share icon → the system **share sheet** opens.
   - Enter `sam.lee@gatech.edu` → **added right away**, and Sam appears in the list.
   - Enter any other valid email (e.g. `demo@gatech.edu`) → **pending request** (*"Invite sent · waiting for them to accept"*).
7. **Remove** Sam (the user-minus icon → confirm) to put the list back to normal.
8. If you added the live invite (pre-flight), Jordan's **invite popup** should appear around now → **Accept**. Say: "Friend invites can show up on any screen."

- [ ] Friend routes in color · [ ] Show/hide per friend · [ ] Status and "Next:" · [ ] Shared-building card · [ ] Drag to reorder · [ ] Invite link copy/share · [ ] Add by email (instant + pending) · [ ] Remove friend · [ ] Live invite popup (optional)

---

## Step 5 — Events on your route (~2 min) — the main feature

**Say:** "This is what makes Cambuzz different. It doesn't list every event on campus. It shows the ones **you can actually get to** between classes."

1. Turn Friends off and tap **Events**. The subtitle reads *"Today · N on your route"*.
2. Explain the rule while the list is on screen:
   - Your day is split into **free windows**: each walk between classes, plus 2½ hours after your last class.
   - An event counts if it's **within 300 m of your path**, happening **during that window**, and you'd still get **at least 10 minutes there** after the detour and the walk to your next class.
3. Point out the list **grouped by free window**, with numbered pins on the map that match the list.
4. Open an event (e.g. **Tech Green Hangout**):
   - The green card shows the detour and *"up to N min there"*, and that you'll be *"back in time for"* your next class.
   - When, where, indoor/outdoor, description, and who's hosting.
5. Tap **Add to schedule** → a toast confirms it → the button changes to **Added**. Turn on **My Route**: the event is now a stop on your route.
6. Go back and tap **Show all N events today** → events that aren't on your route appear, faded out, and ended events are marked *Ended*. Tap **Only show events on my route** to go back.

- [ ] Events on route (300 m / during window / 10 min) · [ ] Grouped by window · [ ] Numbered pins · [ ] Event details and how it fits your day · [ ] Add to schedule → appears on route · [ ] Show all / only on route · [ ] Ended label

---

## Step 6 — Combining filters: Events + Friends (~1.5 min)

**Say:** "Now we put the two together."

1. With **Events** on, tap **Friends** and check **Maya** and **Priya**. Then tap **Events** to bring it back to the front.
2. The subtitle now ends with *"· N with friends"*. List rows show colored dots and *"Maya & Priya can go too"*.
3. Open one of those events → each friend has a card: *"Maya can go too · Together 12:15 – 12:45 · 30 min"*.

**Say:** "The same rule runs on each friend's day. If you'd both be there at the same time for at least 10 minutes, Cambuzz shows it as something you can do together."

- [ ] Events + Friends combined · [ ] "X & Y can go too" · [ ] Time window together

---

## Step 7 — My Schedule: planning the week (~3 min)

1. Tap the **calendar icon** (top bar) → **My Schedule**.
2. **Week View:** classes in their own colors with a legend. The red **"now" line** is at 11:15. **Swipe** (or use the arrows) to the next week and back.
3. Switch to **Block View** → courses and events as cards.
4. **Add a course:** **+** → **Add Course** → type `CS 1331` (suggestions appear as you type) → **Find sections** → choose a section (instructor and times are shown) → it's added with a new color.
5. **Add an event with an invite:** **+** → **Add Event**:
   - Name: *"Study session"*. Day: today. From **3:30 PM** (the end time fills in one hour later on its own).
   - Location: type *"Clough"* → choose the suggestion → *"Clough Commons · shows on your campus map"*.
   - **Repeat:** weekly.
   - **Invite friends:** each friend shows as **free** (green) or **busy** (red) for that time. Pick one who's free → **Done**.
   - Wait about 4 seconds: the free friend **accepts** on their own.
   - Mention **overnight events**: a start at 11:30 PM ends at 12:30 AM the next day.
6. **Notification bell** (back on the map, in the Friends sheet header; the red dot means something unread) → *"Maya invited you to Board Games Night"* (6:30–8:00 PM, Student Center).
7. **Conflict handling:** first add **A Cappella Showcase** (6:00–7:00 PM) from Events → **Show all** → **Add to schedule**. Then **Accept** Maya's Board Games invite → the conflict dialog appears: **Replace / Keep both / Cancel** → choose **Keep both** → back in Week View, both events sit side by side.
   - Mention you can still **Accept instead** after declining an invite.
8. **Tap a course** in Week View → details → **Skip Mon, Nov 16** (hides that one class) or **Drop course** (drop the CS 1331 you just added). Tap a repeating event → **Skip** that day or **Delete event**.
9. **Campus map** (top-left) → back to the map. Turn on **My Route**: the new stops are on today's route.

- [ ] Week View · [ ] "Now" line · [ ] Swipe between weeks · [ ] Block View · [ ] Add Course (search → section) · [ ] Add Event · [ ] Automatic end time · [ ] Overnight event · [ ] Location recognition · [ ] Repeat · [ ] Invite friends (free/busy) · [ ] Friend accepts automatically · [ ] Notification bell and inbox · [ ] Accept/decline invite · [ ] Conflict: Replace/Keep both/Cancel · [ ] Skip a day · [ ] Drop course / delete event · [ ] Schedule changes appear on the map

---

## Step 8 — Search, settings, and polish (~1.5 min)

### Search
1. Tap **Search campus** → **Friends & shortcuts** show before you type anything.
2. Type `Maya` → her result shows where she is now → tap → Friends turns on and a pin shows where she is right now.
3. Clear (×) → the Friends filter that search turned on is turned off again.
4. Try a couple of other kinds of result: a **course** (`1332` → a pin at CULC), a **building** (`Klaus`), a **category shortcut** (`coffee` → all restaurants & coffee, or `gym` → CRC), an **event** (`volleyball`).

### Settings
5. Tap the gear → **Settings** → **Edit name & email** → save.
6. Toggle **Dark mode** → the whole app turns dark, **including the map**. Go back to the map to show it.
7. **Log out** → back to Welcome → **Continue as guest** → Settings now shows *"Guest · Log in to save your schedule"*.
   - Mention: logged-in sessions are saved between launches, guest sessions aren't.

- [ ] Search: friends · [ ] courses · [ ] food/resources · [ ] events · [ ] buildings · [ ] category shortcuts · [ ] Clearing search undoes its filter · [ ] Edit account · [ ] Dark mode (map included) · [ ] Log out · [ ] Guest mode

---

## Step 9 — Close (~1 min)

**Say:**
- "No backend yet. Everything comes from JSON through service interfaces (`authService`, `friendsService`, `scheduleService`), so a real API can replace them without changing any screen."
- "Each filter follows the same pattern: pure logic → state hook → map layer → bottom sheet. That's how three of us built them in parallel."
- "Walking routes come from OpenRouteService and are cached for campus. Dining hours come from dining.gatech.edu."
- Roadmap: a real backend, live event feeds, push notifications for invites, and deep links for invite URLs.

---

## 5-minute version

Step 1 (Google sign-in only) → Step 2 (My Route) → Step 5 (Events on route + Add to schedule) → Step 6 (Events + Friends) → Step 7.5 (Add Event with an invite) → Step 8.6 (Dark mode).

---

## Feature coverage checklist

Use this to check a rehearsal, and update it whenever a feature is added. Each row lists the step that shows it and where the code lives.

| Area | Feature | Step | Source |
|------|---------|------|--------|
| Launch | Intro video | 1 | `src/components/IntroVideo.tsx` |
| Auth | Welcome screen | 1 | `src/screens/auth/WelcomeScreen.tsx` |
| Auth | Email / Google / Microsoft log in, sign up | 1 | `src/screens/auth/AuthFormScreen.tsx` |
| Auth | Guest mode | 8 | `src/services/auth/AuthProvider.tsx` |
| Auth | Session saved between launches | 8 (mentioned) | `src/services/auth/authService.ts` |
| Map | Campus map, top bar | 2 | `src/screens/MapScreen.tsx`, `src/components/MapTopBar.tsx` |
| Map | My Route toggle and legend | 2 | `src/components/MyRouteCard.tsx` |
| Map | Day route, next leg, "now" marker | 2 | `src/components/map/DayRouteLayer.tsx` |
| Map | Labels appear on zoom | 2 | `src/utils/mapLabel.ts` |
| Map | Cluster pins, tap to zoom | 3a | `src/utils/cluster.ts`, `ClusterPin.tsx` |
| Map | Up to 2 filters, background pill with × | 3b | `src/hooks/useActiveFilters.ts`, `FilterBar.tsx` |
| Map | Filter bar shrinks on scroll | 3a | `src/components/floatingBar.ts` |
| Map | Bottom sheet heights | 3a | `src/components/sheet/FilterSheet.tsx` |
| Food | Dining halls: hours, payment, menu, nutrition | 3a | `src/filters/food/FoodDetails.tsx`, `FoodHoursCard.tsx` |
| Food | Restaurants and cafés, open/closed | 3a | `src/filters/food/foodHours.ts` |
| Food | Vending machines | 3a | `data/food.json` |
| Resources | Libraries, printers, CRC | 3b | `src/filters/resources/` |
| Resources | Floor-by-floor occupancy | 3b | `src/filters/resources/CampusDetails.tsx` |
| Resources | Printer location, BuzzCard notice | 3b | `ResourceLocationDetails.tsx` |
| Friends | Friend routes in color, show/hide | 4 | `src/filters/people/` |
| Friends | Status and "Next:" | 4 | `src/filters/people/peopleDay.ts` |
| Friends | Shared-building card | 4 | `SharedBuildingCallout.tsx` |
| Friends | Drag to reorder | 4 | `src/components/DraggableList.tsx` |
| Friends | Invite link copy / share | 4 | `src/components/friends/AddFriendModal.tsx` |
| Friends | Add by email (instant / pending / error) | 4 | `src/services/friends/friendsService.ts` |
| Friends | Remove friend | 4 | `PeopleSheet.tsx` |
| Events | Events on route (300 m / window / 10 min) | 5 | `src/filters/events/eventsOnRoute.ts` |
| Events | Grouped by window, numbered pins | 5 | `EventsSheet.tsx`, `EventPin.tsx` |
| Events | Event details and how it fits your day | 5 | `EventDetails.tsx` |
| Events | Add to schedule / remove | 5 | `AddToScheduleButton.tsx` |
| Events | Show all / only on route, Ended | 5 | `EventsSheet.tsx` |
| Events | "Friends can go too" and time together | 6 | `eventsWithFriends.ts` |
| Schedule | Week View, now line, swipe between weeks | 7 | `src/components/schedule/WeekView.tsx` |
| Schedule | Block View | 7 | `BlockView.tsx` |
| Schedule | Add Course (search → section) | 7 | `AddCourseModal.tsx` |
| Schedule | Add Event: repeat, overnight, location | 7 | `AddEventModal.tsx`, `LocationField.tsx` |
| Schedule | Invite friends with free/busy | 7 | `InviteFriendsList.tsx` |
| Schedule | Friend accepts automatically (~3.5 s) | 7 | `scheduleService.ts` |
| Schedule | Conflicts: Replace / Keep both / Cancel | 7 | `confirmConflicts.ts` |
| Schedule | Skip one day / drop / delete | 7 | `ScheduleScreen.tsx` |
| Invites | Notification bell, inbox, accept/decline | 7 | `NotificationsModal.tsx` |
| Invites | Live invite popup on any screen | 4 (optional) | `EventInviteModal.tsx` |
| Search | Friends, courses, food, resources, events, buildings, shortcuts | 8 | `src/search/` |
| Settings | Edit account | 8 | `EditAccountModal.tsx` |
| Settings | Dark mode (map included) | 8 | `ThemeSwitch.tsx`, `src/theme/mapStyle.ts` |
| Settings | Log out | 8 | `SettingsScreen.tsx` |
| Platform | Android back button: detail → list → close sheet → map | Optional | `MapScreen.tsx`, `RootScreen.tsx` |

---

## If something goes wrong

| Problem | Fix |
|---------|-----|
| No route or events on the map | `DEMO_TODAY`/`DEMO_NOW` aren't set, or it's a day without classes. Check `data/index.ts`. |
| Maya's invite isn't in the bell | `DEMO_TODAY` doesn't match the invite date (`2026-11-16`). |
| A route is a straight line, not following sidewalks | That route isn't in the cache and there's no ORS key or network. Keep going: the logic still works. |
| Leftover changes from a rehearsal | Fully close Expo Go and reopen. Everything is in memory. |
| QR code doesn't connect | `npx expo start --tunnel`. |
| Opens on the map, not Welcome | You're still logged in from earlier: Settings → Log out. |
