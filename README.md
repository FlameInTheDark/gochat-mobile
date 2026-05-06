# GoChat Mobile

Capacitor-powered iOS and Android client for GoChat, built from the existing React client with a native mobile shell.

## Stack

- React 19 + TypeScript + Vite
- Capacitor 8 for Android and iOS shells
- TanStack Query and Zustand, matching `gochat-react`
- Native Capacitor plugins for app lifecycle, haptics, keyboard, splash screen, and status bar

## Setup

```bash
npm install
cp .env.example .env
```

Point `.env` at a reachable GoChat backend:

```env
VITE_API_BASE_URL=https://gochat.anticode.dev/api/v1
VITE_WEBSOCKET_URL=wss://gochat.anticode.dev/ws
```

For emulator/device testing, do not use `localhost` unless the backend is running inside the device. Use a LAN IP, tunnel, or hosted backend.

## Development

```bash
npm run dev
```

The web preview is useful for UI iteration. Native-only behavior is active when the app runs inside Capacitor.

## Native Builds

```bash
npm run sync
npm run android
npm run ios
```

`npm run sync` builds the web bundle and copies it into both native projects. `npm run android` opens Android Studio. `npm run ios` opens Xcode and requires macOS.

## Mobile Notes

- The app forces mobile mode on native platforms.
- `gochat://...` deep links are registered for Android and iOS.
- Android system back minimizes the app from `/` or `/app`, and otherwise navigates back.
- Safe areas, keyboard resize, touch targets, status bar, splash screen, and light haptics are wired for native use.

## Verification

```bash
npm run build
npx cap sync
```

`npm run typecheck` currently inherits generated OpenAPI typing mismatches from the React client, mainly Snowflake IDs represented as strings in app code while generated types expect numbers.
