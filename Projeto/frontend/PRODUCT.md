# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Every profile uses the app routinely (owner correction, 23/10/2026). The síndico and the funcionário carry responsibilities tied to the app, so they are expected to be the heaviest daily users; the morador is the most numerous.

- **Síndico (heavy daily use)** — a resident elected to manage the building, on the phone and on a computer: triages occurrences, assigns them to staff, answers complaints, publishes notices, sends messages to staff.
- **Funcionário (heavy daily use)** — maintenance/cleaning/etc. staff on the phone during the shift: sees tasks assigned to them or open in their specialty, puts them in progress, concludes them with a photo, answers messages.
- **Morador (most numerous)** — resident, mostly on the phone, in short sessions: books common areas (dependências; planned), reports a problem (common area or inside the own apartment), files a confidential complaint about another unit, follows the status of what they opened, reads notices and events. No training, no obligation to use it; it only survives if it is easier than the building's WhatsApp group.
- **Master** — the person responsible for one condominium: approves residents, appoints/revokes the síndico, registers and removes staff, manages blocks.
- **Dev (equipe Habitare)** — platform team: approves or refuses new condominium sign-ups.

## Product Purpose

Habitare centralizes the requests of a condominium in one place so nothing gets lost: every occurrence has a protocol, a category, a status (Aberta → Em Análise → Em Andamento → Concluída), a responsible person, a history and photographic proof of completion. Success = residents stop using WhatsApp/verbal requests and the síndico can account for every service with evidence.

## Positioning

Built around the real life of a Brazilian residential condominium: blocks and apartments (floor + 2 digits), the síndico as an elected resident, staff with specialties, confidential complaints that only the síndico sees, personal occurrences inside the apartment that never go to the public mural, and completion that requires a photo.

## Operating Context

- Resident: phone, quick, often while something is broken (leak, elevator, light).
- Síndico/Master: notebook/desktop sessions (reference 1280×656), scanning queues and dashboards.
- Staff: phone during work, outdoors/in corridors.
- Notifications in real time; mural of occurrences shared by the whole building; notices with expiry and up to 3 images.

## Capabilities and Constraints

- React 19 + Vite + Supabase (Postgres, Auth, Storage, Realtime); plain CSS per page plus shared rules in `src/index.css`. Tailwind is installed but barely used.
- Roles and menus per profile (see `src/components/Sidebar.jsx`); status colors are fixed in `src/utils/statusOcorrencia.js` (Aberta red, Em Análise blue, Em Andamento amber, Concluída green).
- Performance constraint learned in production: never animate `filter`/blur or `backdrop-filter` (froze the owner's Chrome); animate only opacity/transform; respect `prefers-reduced-motion`.
- Android app = **this same React code wrapped with Capacitor** (owner decision 23/10/2026), built and run from Android Studio. The phone layout of the web app IS the app: mobile-first, bottom navigation, safe areas (notch, gesture bar), touch targets ≥ 40px, no hover-only affordances.
- Terminology (pt-BR): Ocorrência, Reclamação, Mural de Ocorrências, Mural de Avisos, Minhas Solicitações, Recados, Gestão de Moradores/Funcionários, Blocos, "Concluída" (stored as Resolvida).

## Brand Commitments

- Name: **Habitare** ("Portal do Morador" is legacy). Logo: `public/Habitare-logo-predio.svg` (building shaped like an H + wordmark), orange `#f47920`.
- **The Habitare orange is the brand color across every profile** (owner decision 23/10/2026: no more per-profile accent colors; the profile shows as a discreet label).
- Typography already approved by the owner: Poppins for titles, Plus Jakarta Sans for form fields.
- Owner preferences: login can have more flourish; internal screens simple, functional and fast.

## Evidence on Hand

Real data only from test condominiums (no real testimonials, customers or metrics). Do not invent numbers, testimonials or claims.

## Product Principles

1. Nothing gets lost: every request is visible, has an owner and a status.
2. Easier than WhatsApp: the resident finishes a task in a few taps on the phone.
3. Privacy by role: complaints only for the síndico; personal occurrences never on the mural.
4. Proof over promises: completion carries description and photo.
5. Fast and calm: interfaces load quickly and move without jank.

## Accessibility & Inclusion

Síndicos skew older (22% over 60): legible type sizes, strong contrast, few steps, large touch targets; respect reduced-motion.
