

## Plan: Fix All Functionality and Correct Every Flow

### Current State Analysis

The codebase has most pages built but several issues:
1. **Auth.tsx** exists as a legacy page with raw Supabase errors — not used in routing but still present
2. **Login.tsx** doesn't redirect based on role after login
3. **Signup.tsx** redirects to `/onboarding` but doesn't map Supabase errors properly (partially done)
4. **Profile.tsx** works but needs upsert fallback if profile row missing
5. **CreateService.tsx** works but `AddServiceModal` doesn't include `provider_id` or `cover_image_url`
6. **Navbar.tsx** already shows role-based buttons — working
7. **BottomNav.tsx** already exists — working
8. **Browse.tsx** works with filters — working
9. **Index.tsx** (old page) still exists, redirects to `/auth` — dead code
10. **Services table** already has all needed columns including `provider_id`, `cover_image_url`, `city`, `short_description`, `tags`, `search_vector`

### No Database Changes Needed

The schema already has all required columns on `services` and `profiles`. RLS policies are correctly configured. Storage buckets exist. No migration needed.

### Changes to Implement

#### 1. Fix Login.tsx — Role-based redirect
After successful login, fetch `profile.role` and redirect:
- `provider` → `/profile`
- `customer` → `/browse`
- `null` → `/onboarding`

Also map error messages properly.

#### 2. Fix Signup.tsx — Error mapping (already mostly done)
Verify error mapping is complete. Add redirect to `/onboarding` (already done).

#### 3. Fix Profile.tsx — Upsert fallback
On mount, if profile fetch returns null, upsert a new profile row using user metadata. Show error card with Retry if fetch fails entirely.

#### 4. Fix AddServiceModal.tsx — Include provider_id
The modal currently doesn't pass `provider_id` when creating a service, which will fail the RLS policy. Add `provider_id` from auth context. Also add `cover_image_url` and `short_description` fields.

#### 5. Delete Auth.tsx and Index.tsx — Dead code
Remove `Auth.tsx` and `Index.tsx` since the app uses `Home.tsx` at `/` route. Remove the `/auth` route from `App.tsx` if it exists (it doesn't appear to be there, but `Index.tsx` imports exist).

#### 6. Fix global error mapping utility
Create a `mapSupabaseError(error)` helper used across login, signup, and service operations. Map:
- "Invalid login credentials" → "Incorrect email or password"
- "User already registered" → "An account with this email already exists"
- "Password should be at least 6 characters" → "Password must be at least 8 characters"
- "row-level security" → "You don't have permission to do that"
- Fallback → "Something went wrong. Please try again."

#### 7. Verify all routes work end-to-end
- `/` → Home.tsx (working)
- `/login` → Login.tsx (fix redirect)
- `/signup` → Signup.tsx (working)
- `/onboarding` → Onboarding.tsx (working)
- `/browse` → Browse.tsx (working)
- `/services/:id` → ServiceDetail.tsx (working)
- `/services/new` → CreateService.tsx (working, protected)
- `/services/:id/edit` → EditServicePage.tsx (working, protected)
- `/profile` → Profile.tsx (fix upsert)
- `/terms` → Terms.tsx (working)

### Files to Modify
1. **`src/pages/Login.tsx`** — Add role-based redirect after login, use error mapper
2. **`src/pages/Profile.tsx`** — Add upsert fallback, error state with Retry
3. **`src/components/AddServiceModal.tsx`** — Pass `provider_id` from useAuth, won't break RLS
4. **`src/lib/errors.ts`** (new) — Shared error mapping utility
5. **`src/pages/Signup.tsx`** — Use shared error mapper
6. **`src/lib/services.ts`** — Use error mapper in CRUD functions
7. **Delete `src/pages/Auth.tsx`** and **`src/pages/Index.tsx`** — Dead code cleanup

### Technical Details

**Login redirect logic:**
```typescript
const { error } = await signIn(email, password);
if (!error) {
  // profile is fetched by AuthProvider on auth state change
  // wait briefly for profile to populate, then redirect based on role
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (data?.role === 'provider') navigate('/profile');
  else if (data?.role === 'customer') navigate('/browse');
  else navigate('/onboarding');
}
```

**AddServiceModal fix:**
Add `useAuth()` hook, pass `provider_id: user?.id` in the createService call. Without this, the RLS INSERT policy (`auth.uid() = provider_id`) rejects the insert.

**Profile upsert:**
If `profile` is null after auth loads, call `supabase.from('profiles').upsert({ id: user.id, email: user.email, role: 'customer' })` then refetch.

