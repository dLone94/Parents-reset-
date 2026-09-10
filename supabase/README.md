# Supabase setup

Milestone 1 runs fully without Supabase (guest mode, on-device persistence).
Set it up now if you want the schema in place for accounts, history, Family
Load and Community in later milestones.

1. Create a project at https://supabase.com.
2. Copy the project URL and the anon (publishable) key into `.env.local`:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```

3. Apply the schema. Either paste `migrations/0001_init.sql` into the SQL
   editor, or with the CLI:

   ```
   supabase link --project-ref <ref>
   supabase db push
   ```

4. In Authentication → Providers enable Email. Disable "Confirm email" for
   local testing if you prefer.

Row Level Security is enabled on every table. Users can only read and write
their own resets, reset items and load items. Community posts and comments
are readable by everyone but writable only by their author.

The service role key is never used by the app in the browser. Keep it out of
`NEXT_PUBLIC_*` variables.
