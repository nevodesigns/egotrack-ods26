# web

The React app: screens, components, language strings, styles.

## Stack

React 19, Vite, TypeScript, Tailwind CSS v4 (tokens in `src/index.css`, matching `~/odS_hack/plan/19_BRAND_AND_UX.md`), `lucide-react` for icons, `react-router` for navigation, `motion` for the few interactions the brand doc calls for (nothing decorative).

## Running it

```
npm install
npm run dev
```

## Layout

- `src/screens/` one file per screen (Welcome, Home, Scan, CheckPage, Owed, CustomerDetail, Trust, PublicTrust, More)
- `src/components/` shared pieces: `Shell` (the phone-width layout), `BottomNav`, `ui.tsx` (Button, Panel, Chip, LedgerRow), `Logo`
- `src/lib/strings.ts` every piece of UI copy, English only; reminder messages to customers are separate (T10)
- `src/lib/money.ts` naira formatting

Screens currently show placeholder demo data (the same shop and customer used in the pitch deck and the mockup) until the server and database are wired in.
