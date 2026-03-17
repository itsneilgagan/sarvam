
Goal: make auth/session reliable, unblock provider service creation with image, and ensure services are searchable/visible on Home and Browse.

1) Deep diagnosis (current blockers)
- Auth/profile mismatch: `auth.users` has user(s), but `profiles` is empty (`profiles_count=0`), so role-based UI/routes cannot work.
- Signup flow bug: `signUp()` inserts into `profiles` immediately; when email confirmation is enabled, session is null, so RLS insert can fail silently.
- Provider route deadlock: `/services/new` uses `ProtectedRoute requiredRole="provider"`; when profile is missing, spinner can persist instead of recovering.
- Empty marketplace data: `services_count=0`, so Home/Browse show no cards.
- Search quality gap: `listServices()` uses `ilike` fallback only (not proper full-text search), and provider info isn’t consistently attached for card rendering.
- DB hygiene: duplicate search triggers exist on `services` (`services_search_vector_trigger` and `update_search_vector_trigger`).

2) Refactor plan (auth first, then data visibility)

A. Stabilize auth/profile bootstrap
Files: `src/hooks/useAuth.tsx`, `src/components/ProtectedRoute.tsx`
- Refactor auth init into explicit phases:
  - session restore
  - profile fetch (`maybeSingle`)
  - auto-upsert profile if missing (from `user_metadata`)
- Avoid async deadlock patterns in `onAuthStateChange`; perform async profile sync in dedicated effect.
- Expose separate flags (`loading`, `profileLoading`) so protected routes don’t hang.
- `ProtectedRoute` behavior:
  - unauthenticated → `/login`
  - role route + missing profile after sync attempt → redirect `/profile` (not infinite spinner)
  - role mismatch → `/browse` with friendly toast.

B. Fix signup/login correctness
Files: `src/pages/Signup.tsx`, `src/pages/Login.tsx`, `src/lib/errors.ts`
- Signup:
  - keep password rules/checklist.
  - if `signUp` returns `data.session` null (email confirm flow), show success info (“Verify your email, then sign in”) and go `/login` (not `/onboarding`).
  - if session exists, continue `/onboarding`.
- Login:
  - after sign-in, ensure profile exists (upsert if missing), then route by role:
    - provider → `/profile`
    - customer → `/browse`
    - null/unknown → `/onboarding`
- Keep strict mapped errors only (no raw Supabase strings).

C. Make Add Service flow consistently usable
Files: `src/pages/CreateService.tsx`, `src/components/Navbar.tsx`, `src/components/BottomNav.tsx`, `src/components/AddServiceModal.tsx` (remove or align)
- Enforce route/user guard at page level:
  - no user → `/login`
  - non-provider → `/browse` + “Only providers can add services”
- Keep required cover image upload, validation (type/size), preview, progress.
- Ensure insert always includes: `provider_id`, `cover_image_url`, `short_description`, `city`, `tags`, `is_active`.
- Auto-prefill service area from profile city/area.
- Remove dead legacy modal or fully align it with new schema so it cannot create partial/broken rows.

D. Search + cards visibility upgrade
Files: `src/lib/services.ts`, `src/pages/Home.tsx`, `src/pages/Browse.tsx`, `src/components/ServiceCard.tsx`, `src/components/ServiceGrid.tsx`
- `listServices`:
  - use `.textSearch('search_vector', query, { type: 'websearch' })` when query exists.
  - keep combined filters (category, price, city, provider).
- Card data completeness:
  - include provider display data for cards (name/avatar via provider profile lookup) so cards look populated.
- Home/Browse:
  - preserve skeletons while loading.
  - add explicit empty-state CTA when zero services (“No services yet, add your first service”).

3) Database work (single pass)

A. Data integrity and search cleanup
- Keep existing `services` table (already has required columns).
- Migration changes:
  - remove duplicate trigger, keep one canonical `services_search_vector_trigger`.
  - keep/ensure GIN index on `search_vector`.
  - ensure useful indexes (`provider_id`, `created_at`, `city`).
  - (optional but recommended) add FK `services.provider_id -> profiles.id` for reliable provider joins.

B. Backfill missing profile rows (critical)
- Run one-time data backfill so existing auth users get profile rows:
  - insert from `auth.users` into `public.profiles` with defaults (role from metadata or `customer`) using `ON CONFLICT (id) DO UPDATE`.
- This directly fixes “signed in but no provider/customer behavior”.

C. Optional seed data if you want immediate visible cards
- If desired, insert 2–4 sample services so Home/Browse aren’t empty while testing fresh accounts.

4) Validation checklist after implementation
- Signup as provider:
  - profile row created/available
  - no silent failure
  - proper post-signup path (verify-email flow handled)
- Login:
  - correct role redirect
  - no blank state / no infinite spinner
- Provider UI:
  - navbar “+ Add Service” visible
  - bottom-nav Add tab active for providers
- Create service:
  - image upload works
  - service saves with provider_id + cover image
  - appears in `/profile`, `/browse`, and homepage trending if active
- Search:
  - query returns matches via full-text search
  - filters still apply correctly
- RLS:
  - providers can manage own services
  - public can view active services only.

5) Manual action note
- If you want users to be logged in immediately after signup (no email verification step), disable “Confirm email” in Supabase Auth settings.
- If email verification stays enabled, the new flow will still work (signup -> verify email -> login -> role redirects + provider features).
