# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # Install dependencies
npm start            # Start dev server (choose platform interactively)
npm run ios          # iOS simulator
npm run android      # Android emulator
npm run web          # Web browser
npm run lint         # Lint with Expo lint
```

## Architecture

**Guide Omra / Nefsy** is a React Native mobile marketplace connecting Muslim pilgrims (Hajj/Omra) with French-speaking guides for religious services. Three roles: `pilgrim`, `guide`, `admin`.

### Stack
- **Expo 54 + React Native 0.81** with file-based routing via Expo Router
- **Supabase** for database (PostgreSQL), auth (JWT), and real-time messaging
- **NativeWind 4** (Tailwind CSS for React Native) — custom gold color `#b39164`
- **React Context** for state: `AuthContext` (auth + user profile), `ReservationsContext` (booking state)
- **TypeScript** strict mode with `@/*` path alias pointing to project root

### Key Files
- [lib/api.ts](lib/api.ts) — All pilgrim/guide Supabase queries (~1,900 lines)
- [lib/adminApi.ts](lib/adminApi.ts) — All admin Supabase queries (~1,500 lines)
- [lib/supabase.ts](lib/supabase.ts) — Supabase client (uses Expo Secure Store for tokens on native, localStorage on web)
- [context/AuthContext.tsx](context/AuthContext.tsx) — Auth state + role-based session
- [context/ReservationsContext.tsx](context/ReservationsContext.tsx) — Reservation state
- [app/_layout.tsx](app/_layout.tsx) — Root layout with all providers; admin route guard

### Route Groups
- `app/(auth)/` — Login, register flows
- `app/(tabs)/` — Main tabbed navigation (home, search, reservations, profile)
- `app/admin/` — 12 admin backoffice routes (protected by role check in layout)
- `app/guide/` — Guide profile and service management
- `app/service/` — Service detail pages
- `app/chat/` — Real-time messaging

### Business Logic

**Reservation states:** `pending → confirmed → completed → cancelled`
- Pilgrim books → Guide approves or proposes alternatives → Can be overridden by admin
- Pricing: base price × companion count + optional location supplement
- Female pilgrim rule: minimum 2 per group (enforced at booking)
- Transport services: fixed pricing with supplemental pickup points

**Financial system:**
- Commission calculated as % of completed reservations
- Guide wallet: tracks credits/debits from cancellations
- Payout states: `to_pay → processing → paid`
- All admin financial actions are audit-logged in `admin_audit_logs`

**Guide onboarding:** Registration → profile completion → admin interview → approval

### Global Popup Pattern
Six context-driven modal components in [components/](components/) handle cross-screen actions (cancellations, replacements, reviews). These are registered in the root layout and triggered via context.

### Database
[schema.sql](schema.sql) is the canonical schema. [migrations/](migrations/) contains 30+ incremental migrations. Key tables: `profiles`, `guides`, `services`, `reservations`, `reviews`, `messages`, `guide_wallets`, `guide_payouts`, `admin_audit_logs`.

Row Level Security (RLS) is enforced at the Supabase level. Role-based access is also enforced at the route layout level in the app.
