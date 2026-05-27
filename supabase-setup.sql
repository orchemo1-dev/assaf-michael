-- =============================================
-- ASSAF MICHAEL – Supabase DB Setup
-- הרץ את הקוד הזה ב-Supabase SQL Editor
-- =============================================

-- EVENTS
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('gig','studio','meeting','other')),
  title text NOT NULL,
  date date NOT NULL,
  start_time time,
  end_time time,
  price numeric DEFAULT 0,
  advance_paid numeric DEFAULT 0,
  advance_received boolean DEFAULT false,
  contact_name text,
  contact_phone text,
  lineup text,
  equipment text,
  payment_status text CHECK (payment_status IN ('closing','unpaid','advance','done')),
  venue_capacity integer,
  location text,
  audience_count integer,
  rating integer CHECK (rating BETWEEN 1 AND 5),
  notes text,
  attendees text,
  meeting_topic text,
  meeting_goals text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- TASKS
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL,
  description text,
  status text DEFAULT 'open' CHECK (status IN ('open','in_progress','done')),
  due_date date,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- MARKETING
CREATE TABLE IF NOT EXISTS marketing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  title text NOT NULL,
  description text,
  url text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- CONTACTS
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text,
  company text,
  category text NOT NULL,
  phone text,
  email text,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- EPK DATA
CREATE TABLE IF NOT EXISTS epk_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_name text UNIQUE NOT NULL,
  field_value text,
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now()
);

-- ROW LEVEL SECURITY
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE epk_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users only" ON events FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated users only" ON tasks FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated users only" ON marketing FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated users only" ON contacts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated users only" ON epk_data FOR ALL USING (auth.role() = 'authenticated');

-- EPK DEMO DATA
INSERT INTO epk_data (field_name, field_value) VALUES
('bio_en', 'Assaf Michael is a DJ and electronic music producer from Tel Aviv, making waves in the global house scene. Resident DJ of Magical Sunrise and Rabbit TLV. Founder of Connection Community.'),
('labels', 'Maccabi House IL, Nervous Records NYC, Three Records UK, Three Hands Records IT, Mau House IL'),
('supported_by', 'Keinemusik, Solomun, Hugel, Mau P, Pete Tong, Andrea Oliva, Nick Fanciulli, Adriatique, Camelphat, Mochakk, Louie Vega, Steve Lawler, Elif, Adam Ten, Mita Gami, Yulia Niko'),
('rider', 'Pioneer CDJ-3000 × 2, Pioneer DJM-900NXS2, Booth Monitor, Stage Plot on request'),
('beatport_chart', '#2 Indie Dance'),
('streams', '500K+'),
('website', 'assafmichael.com')
ON CONFLICT (field_name) DO NOTHING;
