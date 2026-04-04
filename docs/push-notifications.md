# Push Notifications — Feature Design

## Overview

Add Web Push notifications to the Android PWA so users receive native alerts
for task reminders (snooze expiry, daily planning time) even when the app is
closed. This requires client-side subscription management and a lightweight
backend push service.

---

## User Stories

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| PN-US1 | As a user, I can enable push notifications from within the app | A permission prompt appears; once granted, my device is subscribed and a confirmation is shown |
| PN-US2 | As a user, I receive a notification when a snoozed task becomes due | A push arrives at the snoozed-until time with the task title and a "View" action |
| PN-US3 | As a user, I receive a daily planning reminder at a configurable time | I can set a time (e.g. 08:00) and receive a daily push to open the Day view |
| PN-US4 | As a user, I can disable notifications | A toggle in settings unsubscribes my device and stops all pushes |
| PN-US5 | As a user, tapping a notification opens the relevant view in the app | Tapping a snooze alert opens the Active/Day tab; tapping a planning alert opens Day view |

---

## Architecture

```
┌─────────────────────────────────────┐     ┌──────────────────────────────┐
│           Client (PWA)              │     │      Backend (Node.js)       │
│                                     │     │                              │
│  Vue App                            │     │  push-server/                │
│   └─ NotificationSettings.vue       │     │   ├─ index.ts  (HTTP server) │
│   └─ useNotifications.ts            │     │   ├─ vapid.ts  (key mgmt)    │
│                                     │     │   ├─ scheduler.ts (cron)     │
│  Service Worker (sw.ts)             │     │   └─ sender.ts (web-push)    │
│   └─ push event handler             │     │                              │
│   └─ notificationclick handler      │     │  CouchDB                     │
│                                     │     │   └─ push_subscriptions DB   │
└─────────────────────────────────────┘     └──────────────────────────────┘
         │  subscribe()                              │
         │  POST subscription ──────────────────────▶│
         │                                           │ stores in CouchDB
         │                                           │
         │  ◀─────────────── Web Push API ───────────│ (at due time)
         │  service worker wakes                     │
         │  showNotification()                       │
```

---

## Frontend

### 1. VAPID Public Key

Store the public VAPID key as an env variable:

```
VITE_VAPID_PUBLIC_KEY=BExamplePublicKeyBase64...
```

### 2. Composable — `src/composables/useNotifications.ts`

Responsible for all notification logic in the Vue layer.

```ts
// Exposes:
const { permission, supported, subscribe, unsubscribe, isSubscribed } = useNotifications()
```

| Member | Type | Description |
|--------|------|-------------|
| `supported` | `Ref<boolean>` | `'PushManager' in window && 'serviceWorker' in navigator` |
| `permission` | `Ref<NotificationPermission>` | `'default' \| 'granted' \| 'denied'` |
| `isSubscribed` | `Ref<boolean>` | Whether this device has an active push subscription |
| `subscribe()` | `async () => void` | Calls `requestPermission()`, then `pushManager.subscribe()`, then POSTs subscription to backend |
| `unsubscribe()` | `async () => void` | Calls `pushManager.getSubscription().unsubscribe()`, then DELETEs from backend |

**`subscribe()` flow:**
1. `await Notification.requestPermission()` — abort if not `'granted'`
2. Get SW registration: `await navigator.serviceWorker.ready`
3. `await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VITE_VAPID_PUBLIC_KEY) })`
4. POST the subscription JSON + `userId` to `POST /api/push/subscribe`
5. Set `isSubscribed.value = true`; persist flag in localStorage

### 3. Notification Settings UI — `src/components/organisms/NotificationSettings.vue`

A settings panel (initially accessible from a gear icon or a new Settings tab) with:

- Toggle: **Enable notifications** (calls `subscribe` / `unsubscribe`)
- Time picker: **Daily planning reminder** (stored in PouchDB under user preferences, sent to backend)
- Status line: shows current permission state and sync status

### 4. Service Worker — `src/sw.ts` (custom SW via `injectManifest` strategy)

Switch `vite-plugin-pwa` from `generateSW` to `injectManifest` to allow custom SW code.

**Add two event handlers:**

```ts
// Push received (app may be closed)
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/get-it-done/pwa-192x192.png',
      badge: '/get-it-done/pwa-192x192.png',
      data: { url: data.url },   // e.g. '/get-it-done/#day'
      actions: data.actions ?? []
    })
  )
})

// Notification tapped
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/get-it-done/'
  event.waitUntil(clients.openWindow(url))
})
```

### 5. Vite PWA config change

```ts
// vite.config.ts
VitePWA({
  strategies: 'injectManifest',   // was 'generateSW'
  srcDir: 'src',
  filename: 'sw.ts',
  // ... rest unchanged
})
```

---

## Backend

A small standalone Node.js service (TypeScript). Lives in a new directory:
`push-server/` at the repository root (sibling to `src/`).

### Technology

| Package | Purpose |
|---------|---------|
| `web-push` | Signs VAPID requests and sends pushes to FCM/APNS |
| `node-cron` | Schedules daily reminders |
| `nano` or `node-fetch` | Reads from CouchDB |
| `fastify` or plain `http` | Minimal HTTP server for subscribe/unsubscribe endpoints |

### VAPID Key Generation (one-time setup)

```bash
npx web-push generate-vapid-keys
# → paste into .env
VAPID_PUBLIC_KEY=B...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:admin@example.com
```

### CouchDB — `push_subscriptions` database

Each document represents one device subscription:

```jsonc
{
  "_id": "<userId>_<endpoint-hash>",
  "userId": "alice",
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/fcm/send/...",
    "keys": { "p256dh": "...", "auth": "..." }
  },
  "dailyReminderTime": "08:00",   // null = disabled
  "createdAt": "2026-04-04T10:00:00Z",
  "updatedAt": "2026-04-04T10:00:00Z"
}
```

### API Endpoints

#### `POST /api/push/subscribe`
Save or update a subscription.

```jsonc
// Request body
{
  "userId": "alice",
  "subscription": { /* PushSubscription JSON */ },
  "dailyReminderTime": "08:00"   // optional
}
// Response: 201 Created
```

#### `DELETE /api/push/subscribe`
Remove a subscription (unsubscribe).

```jsonc
// Request body
{ "userId": "alice", "endpoint": "https://fcm.googleapis.com/..." }
// Response: 204 No Content
```

#### `POST /api/push/send` *(internal / admin)*
Manually trigger a push for testing.

```jsonc
{ "userId": "alice", "title": "Test", "body": "Hello", "url": "/get-it-done/#day" }
```

### Snooze Reminder Trigger

The backend polls CouchDB's `_changes` feed (or a scheduled job every minute)
for tasks whose `snoozedUntil` timestamp has just passed. For each match:

1. Query `push_subscriptions` for all subscriptions belonging to that `userId`
2. Call `webpush.sendNotification(subscription, payload)` for each device
3. On `410 Gone` response from FCM → delete the stale subscription from CouchDB

```ts
// Notification payload shape
interface PushPayload {
  title: string        // e.g. "Snooze ended: Buy groceries"
  body: string         // e.g. "This task is ready for you"
  url: string          // e.g. "/get-it-done/#day"
  actions?: Array<{ action: string; title: string }>
}
```

### Daily Reminder Scheduler

On server startup, read all subscriptions with a `dailyReminderTime` set.
Use `node-cron` to fire at each unique time:

```ts
cron.schedule('0 8 * * *', () => sendDailyReminders('08:00'))
```

The reminder push payload:
```jsonc
{
  "title": "Plan your day",
  "body": "You have tasks waiting in your Day view",
  "url": "/get-it-done/#day"
}
```

---

## Notification Payload Types

| Trigger | Title | Body | URL |
|---------|-------|------|-----|
| Snooze expired | `"Snooze ended: {task title}"` | `"This task is ready for you"` | `/#day` |
| Daily planning | `"Plan your day"` | `"N tasks are waiting in your Day view"` | `/#day` |
| Weekly review | `"Weekly review ready"` | `"Take a moment to review your backlog"` | `/#backlog` |

---

## Implementation Phases

### Phase 1 — Foundation
- [ ] Generate VAPID keys, add to `.env`
- [ ] Create `push_subscriptions` CouchDB database
- [ ] Switch vite-plugin-pwa to `injectManifest` strategy
- [ ] Write `src/sw.ts` with `push` and `notificationclick` handlers

### Phase 2 — Client subscription
- [ ] Implement `useNotifications.ts` composable
- [ ] Build `NotificationSettings.vue` with enable/disable toggle
- [ ] Wire settings into the app (new settings panel or tab)

### Phase 3 — Backend
- [ ] Scaffold `push-server/` with TypeScript + web-push
- [ ] Implement subscribe/unsubscribe HTTP endpoints
- [ ] Implement snooze expiry watcher (`_changes` feed)
- [ ] Implement daily reminder cron

### Phase 4 — Polish
- [ ] Handle `410 Gone` subscription cleanup
- [ ] Show notification permission state in UI
- [ ] Test on Android Chrome with an installed PWA
- [ ] Add `dailyReminderTime` preference to user PouchDB document

---

## Open Questions

1. **Backend hosting** — Where does `push-server/` run? Same host as CouchDB, or separate process?
2. **Auth** — Should the subscribe endpoint verify the CouchDB session cookie to prevent spoofing?
3. **Multiple devices** — One user may have several subscriptions (phone + tablet). The design supports this; confirm it's desired.
4. **iOS** — iOS 16.4+ supports Web Push but only for PWAs added to the home screen. Scope iOS support for a later phase.
