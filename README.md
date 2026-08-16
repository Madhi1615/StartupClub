# SE Connect — private member network MVP

A colourful, India-inspired private community directory with editable member profiles, one-to-one messaging and an admin control centre.

## Member data loaded

Source: `SE_Members_Directory.xlsx`

- 76 submitted directory rows recovered from the workbook
- 75 unique profiles created
- The two `Dr. Ali Abas Wani` submissions were merged into one richer profile instead of creating duplicate accounts
- Original source fields preserved:
  - Name
  - Who am I
  - What I am obsessed with/building
  - One thing I can help with
  - One thing I am looking for
- Search/topic tags are derived only from words in the submitted text and remain editable by each member

The production seed is in `data/members.csv`. A copy of the extracted source fields is in `data/source-directory-extracted.csv`.

## Features

- Username + password login for every member
- Searchable member directory
- Search by name, topic, location, what someone is building, what they can help with, or what they need
- Editable profile sections matching the directory questions
- Optional company, location, LinkedIn, website and profile photo URL
- Private one-to-one member messaging
- Supabase Realtime support
- Admin dashboard
- Block / unblock users
- Secure admin password resets
- Member/profile completeness reports
- Aggregate messaging activity without exposing private message content
- Admin audit log
- Responsive India-colour + Instagram-inspired visual theme
- Row Level Security for production

## Preview immediately

Open `index.html`.

`config.js` currently uses `DEMO_MODE: true`.

- Example member: `pradip.pariyar` with any password
- Any username shown in the directory can be used in preview mode with any password
- Admin: `admin` with any password

Preview mode is intentionally not secure. It is only for seeing and testing the interface locally.

## Production setup: Supabase + GitHub Pages/Vercel

1. Create a free Supabase project.
2. Run `supabase/schema.sql` in Supabase SQL Editor.
3. Deploy `supabase/functions/admin-user/index.ts` as an Edge Function named `admin-user`.
4. Create the first Supabase Authentication user for the administrator, e.g. `admin@members.example.com`, with a strong password.
5. Copy the admin auth UUID and insert the admin profile:

```sql
insert into public.profiles(id,username,full_name,role,status)
values ('AUTH-USER-UUID','admin','Community Admin','admin','active');
```

6. Edit `config.js`:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `MEMBER_EMAIL_DOMAIN`
   - set `DEMO_MODE: false`

7. Provision the 75 member accounts.

### Recommended: use the supplied private credentials file

The actual password file is intentionally supplied **separately from the public website ZIP**. Do not place it in GitHub.

```bash
export SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"
export MEMBER_EMAIL_DOMAIN="members.example.com"
node scripts/provision-members.mjs data/members.csv /PRIVATE/PATH/SE_member_login_credentials.csv
```

This creates the Supabase users using the same usernames and temporary passwords from the private credentials file.

### Or generate new passwords during provisioning

```bash
node scripts/provision-members.mjs data/members.csv
```

That produces `member_credentials.csv`. Keep it private.

8. Upload only the `member-community` website folder to GitHub Pages or Vercel. **Never upload any credentials CSV or Supabase service-role key.**

## Security notes

- `SUPABASE_ANON_KEY` may be used by the browser when RLS is enabled.
- `SUPABASE_SERVICE_ROLE_KEY` must never be placed in frontend code or GitHub.
- Blocking and password resets run only through the privileged admin Edge Function.
- Members can edit their own public profile content, but cannot change their role or blocked/active status.
- Direct messages are visible only to sender and recipient through database policies.
- The admin reporting screen exposes aggregate activity, not private message text.
- Before a public production launch, add a privacy notice, community rules, report-user flow and abuse moderation controls.
