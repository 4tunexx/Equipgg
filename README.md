# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Local-only setup (no external backend)

- Auth is implemented with localStorage in `src/components/auth-provider.tsx`.
- Chat stores per-room messages in localStorage under `equipgg_chat_<Room>`.
- Activity feed can be overridden by putting a JSON array into `localStorage['equipgg_activity']`; otherwise, mock data is shown.

Auth routes:
- `/signin`: local email/password login
- `/signup`: local registration

Environment:
- `.env.local` only needs `NEXT_PUBLIC_MAINTENANCE_MODE=false` for local.

Later migration:
- You can swap the provider and data layers to MySQL or any backend—components are already reading from the provider and local stores.

