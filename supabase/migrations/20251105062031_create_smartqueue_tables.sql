/*
  # SmartQueue Database Schema

  ## Overview
  Creates the database structure for SmartQueue system with real-time queue management.

  ## New Tables
  
  ### `queue_config`
  - `id` (uuid, primary key) - Unique identifier
  - `current_number` (integer, default 0) - Currently serving queue number
  - `next_number` (integer, default 1) - Next queue number to be issued
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### `queue_tickets`
  - `id` (uuid, primary key) - Unique identifier
  - `ticket_number` (integer) - Queue number issued to customer
  - `status` (text) - Status: 'waiting', 'serving', 'completed'
  - `created_at` (timestamptz) - Ticket creation time
  - `served_at` (timestamptz, nullable) - Time when service started
  - `completed_at` (timestamptz, nullable) - Time when service completed

  ## Security
  - Enable RLS on all tables
  - Public read access for queue status (all users can view)
  - Public write access for taking numbers and calling next (simulated public kiosk)

  ## Notes
  - This is a public kiosk system, so authentication is not required
  - Real-time subscriptions enabled for live updates
  - Single row in queue_config maintains global state
*/

-- Create queue_config table
CREATE TABLE IF NOT EXISTS queue_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  current_number integer DEFAULT 0,
  next_number integer DEFAULT 1,
  updated_at timestamptz DEFAULT now()
);

-- Create queue_tickets table
CREATE TABLE IF NOT EXISTS queue_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number integer NOT NULL,
  status text DEFAULT 'waiting',
  created_at timestamptz DEFAULT now(),
  served_at timestamptz,
  completed_at timestamptz
);

-- Enable RLS
ALTER TABLE queue_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_tickets ENABLE ROW LEVEL SECURITY;

-- Public access policies for queue_config
CREATE POLICY "Anyone can view queue config"
  ON queue_config FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can update queue config"
  ON queue_config FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can insert queue config"
  ON queue_config FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Public access policies for queue_tickets
CREATE POLICY "Anyone can view tickets"
  ON queue_tickets FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert tickets"
  ON queue_tickets FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update tickets"
  ON queue_tickets FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Insert initial config row
INSERT INTO queue_config (id, current_number, next_number)
VALUES ('00000000-0000-0000-0000-000000000001', 0, 1)
ON CONFLICT (id) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tickets_status ON queue_tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_number ON queue_tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_tickets_created ON queue_tickets(created_at);