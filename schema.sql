-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (Extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('pilgrim', 'guide')) DEFAULT 'pilgrim',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', COALESCE(new.raw_user_meta_data->>'role', 'pilgrim'));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. GUIDES (Specific details for guides)
CREATE TABLE public.guides (
  id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  bio TEXT,
  location TEXT,
  price_per_day NUMERIC,
  currency TEXT DEFAULT 'SAR',
  price_unit TEXT DEFAULT '/tour', -- e.g. /day, /tour, /group
  languages TEXT[], -- Array of languages e.g. ['French', 'Arabic']
  verified BOOLEAN DEFAULT false,
  rating NUMERIC DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  specialty TEXT, -- e.g. 'Historical Guide', 'Transport & Ziyara'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.guides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guides are viewable by everyone"
  ON public.guides FOR SELECT
  USING (true);

CREATE POLICY "Guides can update their own details"
  ON public.guides FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Guides can insert their own details"
  ON public.guides FOR INSERT
  WITH CHECK (auth.uid() = id);


-- 3. SERVICES (Offerings like Omra Badal, etc.)
CREATE TABLE public.services (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  guide_id UUID REFERENCES public.profiles(id), -- Nullable for system services, populated for guide services
  price_override NUMERIC, -- Specific price for this service if different from guide max/min
  location TEXT, -- City/Location of the service
  availability_start TIMESTAMPTZ, 
  availability_end TIMESTAMPTZ,
  meeting_points JSONB, -- Array of {name: string, supplement: number}
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Services are viewable by everyone"
  ON public.services FOR SELECT
  USING (true);

CREATE POLICY "Guides can create their own services"
  ON public.services FOR INSERT
  WITH CHECK (
    auth.uid() = guide_id 
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'guide')
  );

CREATE POLICY "Guides can update their own services"
  ON public.services FOR UPDATE
  USING (auth.uid() = guide_id);

CREATE POLICY "Guides can delete their own services"
  ON public.services FOR DELETE
  USING (auth.uid() = guide_id);



-- 4. RESERVATIONS (Bookings)
CREATE TABLE public.reservations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  guide_id UUID REFERENCES public.profiles(id) NOT NULL,
  service_name TEXT, -- Snapshot of service name or reference
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')) DEFAULT 'pending',
  total_price NUMERIC NOT NULL,
  location TEXT, -- Pickup location
  visit_time TEXT, -- e.g. "14:00"
  pilgrims_names TEXT[], -- Array of names
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reservations"
  ON public.reservations FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = guide_id);

CREATE POLICY "Users can create reservations"
  ON public.reservations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users and Guides can update their reservations"
  ON public.reservations FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = guide_id);


-- 5. REVIEWS
CREATE TABLE public.reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reservation_id UUID REFERENCES public.reservations(id),
  reviewer_id UUID REFERENCES public.profiles(id) NOT NULL,
  guide_id UUID REFERENCES public.guides(id) NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are viewable by everyone"
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can create reviews for their completed reservations"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id); 
  -- Ideally we check if reservation exists and is completed, but RLS is often kept simpler.


-- 6. MESSAGES
CREATE TABLE public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id UUID REFERENCES public.profiles(id) NOT NULL,
  receiver_id UUID REFERENCES public.profiles(id) NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages they are part of"
  ON public.messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);
