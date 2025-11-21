/*
  # Create staff accounts table with authentication

  1. New Tables
    - `staff_accounts`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `role` (text: 'staff' or 'admin')
      - `is_active` (boolean)
      - `created_by` (uuid, references Supabase auth.users)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `staff_accounts` table
    - Add policy for admins to view all staff accounts
    - Add policy for admins to create/update/delete staff accounts
    - Add policy for staff to view their own account
*/

CREATE TABLE IF NOT EXISTS staff_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('staff', 'admin')),
  is_active boolean DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE staff_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all staff accounts"
  ON staff_accounts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_accounts
      WHERE staff_accounts.email = auth.jwt() ->> 'email'
      AND staff_accounts.role = 'admin'
    )
  );

CREATE POLICY "Staff can view their own account"
  ON staff_accounts FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'email' = email
  );

CREATE POLICY "Admins can create staff accounts"
  ON staff_accounts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_accounts
      WHERE staff_accounts.email = auth.jwt() ->> 'email'
      AND staff_accounts.role = 'admin'
    )
  );

CREATE POLICY "Admins can update staff accounts"
  ON staff_accounts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_accounts
      WHERE staff_accounts.email = auth.jwt() ->> 'email'
      AND staff_accounts.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_accounts
      WHERE staff_accounts.email = auth.jwt() ->> 'email'
      AND staff_accounts.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete staff accounts"
  ON staff_accounts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_accounts
      WHERE staff_accounts.email = auth.jwt() ->> 'email'
      AND staff_accounts.role = 'admin'
    )
  );
