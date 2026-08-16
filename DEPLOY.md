# SE Connect — Production deployment

This folder is safe to publish as a static frontend. It contains **no SE member directory data, Excel source, credentials CSV, temporary passwords, Supabase Secret key, or service-role key**.

## Already configured

- Supabase project URL: configured in `config.js`
- Supabase publishable key: configured in `config.js`
- `DEMO_MODE: false`
- Supabase client uses the publishable key
- Public frontend reads profiles/messages only after authentication and according to RLS

## 1. Create the database

In the Supabase Dashboard for this project:

1. Open **SQL Editor**.
2. Create a new query.
3. Paste the complete contents of `supabase/schema.sql`.
4. Run it once.

This creates `profiles`, `messages`, `admin_actions`, helper functions, and Row Level Security policies.

## 2. Deploy the admin Edge Function

Create an Edge Function named exactly:

`admin-user`

Paste the contents of:

`supabase/functions/admin-user/index.ts`

The function requires Supabase's server-side environment variables, especially the project service-role/secret credential. Keep that credential only in Supabase/another trusted server environment. Never add it to `config.js` or GitHub.

## 3. Provision users

Provision the admin and member Auth users from a trusted server-side environment using the Supabase Admin API. Each Auth user must also have a matching row in `public.profiles` with the same UUID.

The private SE member source and credentials should **not** be committed to the public GitHub repository.

## 4. Make one account an administrator

After that user's Auth account and profile exist, run in SQL Editor (replace the username):

```sql
update public.profiles
set role = 'admin'
where username = 'YOUR_ADMIN_USERNAME';
```

## 5. Publish on GitHub Pages

Create a GitHub repository and upload the **contents of this production folder** to the repository root.

Then go to:

**Repository → Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: main → /(root) → Save**

The generated GitHub Pages URL can then be shared with members.

## Security note

The Supabase **publishable key** in `config.js` is expected to be browser-visible. Security depends on Auth + RLS. Never expose the Supabase Secret key/service-role key in this frontend or GitHub.
