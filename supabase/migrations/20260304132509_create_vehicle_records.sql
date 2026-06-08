/*
  # Vehicle Control System Schema

  1. New Tables
    - `vehicle_records`
      - `id` (uuid, primary key)
      - `vehicle_plate` (text) - Vehicle plate or identification
      - `reason` (text) - Reason for vehicle use
      - `authorized_by` (text) - Authorization source
      - `usage_type` (text) - Usage type snapshot: "Comum" or "Rota"
      - `pickup_date` (date) - Pickup date
      - `pickup_time` (time) - Pickup time
      - `pickup_name` (text) - Name of person picking up
      - `pickup_signature` (text) - Base64 encoded signature
      - `return_date` (date, nullable) - Return date
      - `return_time` (time, nullable) - Return time
      - `return_name` (text, nullable) - Name of person returning
      - `return_signature` (text, nullable) - Base64 encoded signature
      - `observations` (text, nullable) - Additional observations
      - `status` (text) - Status: "Em uso" or "Devolvido"
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record update timestamp

  2. Security
    - Enable RLS on `vehicle_records` table
    - Add policy for public access (as this appears to be an internal tool)
*/

CREATE TABLE IF NOT EXISTS vehicle_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_plate text NOT NULL,
  reason text NOT NULL,
  authorized_by text NOT NULL,
  usage_type text NOT NULL DEFAULT 'Comum',
  pickup_date date NOT NULL,
  pickup_time time NOT NULL,
  pickup_name text NOT NULL,
  pickup_signature text NOT NULL,
  return_date date,
  return_time time,
  return_name text,
  return_signature text,
  observations text DEFAULT '',
  status text NOT NULL DEFAULT 'Em uso',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE vehicle_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to vehicle records"
  ON vehicle_records
  FOR ALL
  USING (true)
  WITH CHECK (true);
