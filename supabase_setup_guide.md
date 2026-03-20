# Supabase Setup Guide for ShareMe

Follow these steps to set up your database. It's free and takes about 5 minutes.

## 1. Create a Project
1.  Go to [supabase.com](https://supabase.com) and sign in.
2.  Click **"New Project"**.
3.  Name it `ShareMe`, set a password, and click **"Create New Project"**. Wait a minute for it to start.

## 2. Create the Table
1.  On the left sidebar, click the **"Table Editor"** (table icon).
2.  Click **"Create a new table"**.
3.  Name: `snippets`.
4.  Uncheck `Enable Row Level Security (RLS)` for now (we'll fix this later if needed, or keep it off for a quick MVP).
5.  Add Columns:
    - `id`: Type `text`, Primary Key: `True`, Default Value: `NULL` (we will generate this in the app).
    - `content`: Type `text`.
    - `created_at`: Type `timestampz`, Default: `now()`.
6.  Click **"Save"**.

## 3. Enable Public Access (SQL Editor)
To make sure anyone can read/write snippets (it's a public pastebin after all), go to the **SQL Editor** (icon with `>_`) on the left:
1.  Click **"New Query"**.
2.  Paste this code:
    ```sql
    -- Allow everyone to read snippets
    CREATE POLICY "Allow public read" ON snippets FOR SELECT USING (true);
    
    -- Allow everyone to insert snippets
    CREATE POLICY "Allow public insert" ON snippets FOR INSERT WITH CHECK (true);
    
    -- Enable RLS (if you disabled it earlier, run this to keep it secure)
    ALTER TABLE snippets ENABLE ROW LEVEL SECURITY;
    ```
3.  Click **"Run"**.

## 4. Get Your API Keys
1.  Go to **Project Settings** (gear icon at the bottom left).
2.  Click **"API"**.
3.  Copy these two values:
    - **Project URL** (e.g., `https://xyz.supabase.co`)
    - **API Key (anon/public)** (e.g., `ey...`)

## 5. Enable Realtime (Multiplayer)
1.  Go to the **Database** tab (database icon on the left).
2.  Click **Replication**.
3.  Under `Supabase Realtime`, click on the number of tables.
4.  Toggle the switch for the `snippets` table to **ON**.
