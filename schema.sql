Dans la base de données-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- Shared functions
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 1. PROFILES (Extends auth.users)
-- -----------------------------------------------------------------------------

CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('pilgrim', 'guide', 'admin')) DEFAULT 'pilgrim',
  gender TEXT CHECK (gender IN ('male', 'female')),
  date_of_birth DATE,
  language TEXT CHECK (language IN ('fr', 'ar')) DEFAULT 'fr',
  account_status TEXT CHECK (account_status IN ('active', 'suspended')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
      AND p.account_status = 'active'
  );
$$;

CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    gender,
    date_of_birth,
    language,
    account_status
  )
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'role', 'pilgrim'),
    NULLIF(new.raw_user_meta_data->>'gender', ''),
    NULLIF(new.raw_user_meta_data->>'date_of_birth', '')::DATE,
    COALESCE(new.raw_user_meta_data->>'language', 'fr'),
    'active'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- -----------------------------------------------------------------------------
-- 2. GUIDES (Specific details for guides)
-- -----------------------------------------------------------------------------

CREATE TABLE public.guides (
  id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  bio TEXT,
  location TEXT,
  price_per_day NUMERIC,
  currency TEXT DEFAULT 'EUR',
  price_unit TEXT DEFAULT '/tour',
  languages TEXT[],
  verified BOOLEAN DEFAULT false,
  onboarding_status TEXT CHECK (onboarding_status IN ('pending_review', 'approved', 'rejected')) DEFAULT 'pending_review',
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES public.profiles(id),
  rejected_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES public.profiles(id),
  rejection_reason TEXT,
  rating NUMERIC DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  specialty TEXT,
  experience_since TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.guides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved guides are public"
  ON public.guides FOR SELECT
  USING (
    onboarding_status = 'approved'
    OR verified = true
    OR auth.uid() = id
    OR public.is_admin()
  );

CREATE POLICY "Guides can insert their own details"
  ON public.guides FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Guides can update their own details"
  ON public.guides FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can manage guides"
  ON public.guides FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TRIGGER set_guides_updated_at
  BEFORE UPDATE ON public.guides
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- -----------------------------------------------------------------------------
-- 3. SERVICES
-- -----------------------------------------------------------------------------

CREATE TABLE public.services (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  guide_id UUID REFERENCES public.profiles(id),
  price_override NUMERIC,
  location TEXT,
  availability_start TIMESTAMPTZ,
  availability_end TIMESTAMPTZ,
  max_participants INTEGER,
  meeting_points JSONB,
  service_status TEXT CHECK (service_status IN ('active', 'hidden', 'archived')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active services"
  ON public.services FOR SELECT
  USING (
    (
      COALESCE(service_status, 'active') = 'active'
      AND (
        guide_id IS NULL
        OR EXISTS (
          SELECT 1
          FROM public.guides g
          WHERE g.id = services.guide_id
            AND (g.onboarding_status = 'approved' OR g.verified = true)
        )
      )
    )
    OR auth.uid() = guide_id
    OR public.is_admin()
  );

CREATE POLICY "Guides can create their own services"
  ON public.services FOR INSERT
  WITH CHECK (
    auth.uid() = guide_id
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'guide'
        AND p.account_status = 'active'
    )
  );

CREATE POLICY "Guides can update their own services"
  ON public.services FOR UPDATE
  USING (auth.uid() = guide_id)
  WITH CHECK (auth.uid() = guide_id);

CREATE POLICY "Guides can delete their own services"
  ON public.services FOR DELETE
  USING (auth.uid() = guide_id);

CREATE POLICY "Admins can manage services"
  ON public.services FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete services"
  ON public.services FOR DELETE
  USING (public.is_admin());

CREATE TRIGGER set_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- -----------------------------------------------------------------------------
-- 4. RESERVATIONS (Orders)
-- -----------------------------------------------------------------------------

CREATE TABLE public.reservations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  guide_id UUID REFERENCES public.profiles(id) NOT NULL,
  service_name TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
  total_price NUMERIC NOT NULL,
  commission_rate NUMERIC DEFAULT 0.15,
  platform_fee_amount NUMERIC,
  guide_net_amount NUMERIC,
  payout_status TEXT CHECK (payout_status IN ('not_due', 'to_pay', 'processing', 'paid', 'failed')) DEFAULT 'not_due',
  guide_start_confirmed_at TIMESTAMPTZ,
  pilgrim_start_confirmed_at TIMESTAMPTZ,
  visit_started_at TIMESTAMPTZ,
  guide_end_confirmed_at TIMESTAMPTZ,
  pilgrim_end_confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  admin_note TEXT,
  location TEXT,
  visit_time TEXT,
  pilgrims_names TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view related reservations"
  ON public.reservations FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = guide_id OR public.is_admin());

CREATE POLICY "Users can create reservations"
  ON public.reservations FOR INSERT
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users and guides can update own reservations"
  ON public.reservations FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = guide_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR auth.uid() = guide_id OR public.is_admin());

CREATE TRIGGER set_reservations_updated_at
  BEFORE UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- -----------------------------------------------------------------------------
-- 5. REVIEWS
-- -----------------------------------------------------------------------------

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

CREATE POLICY "Users can create reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

-- -----------------------------------------------------------------------------
-- 6. MESSAGES
-- -----------------------------------------------------------------------------

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
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id OR public.is_admin());

CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id OR public.is_admin());

CREATE POLICY "Users can update their received messages"
  ON public.messages FOR UPDATE
  USING (auth.uid() = receiver_id OR public.is_admin())
  WITH CHECK (auth.uid() = receiver_id OR public.is_admin());

-- -----------------------------------------------------------------------------
-- 7. GUIDE PAYOUTS
-- -----------------------------------------------------------------------------

CREATE TABLE public.guide_payouts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  guide_id UUID REFERENCES public.profiles(id) NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  gross_amount NUMERIC NOT NULL,
  platform_fee NUMERIC NOT NULL,
  net_amount NUMERIC NOT NULL,
  status TEXT CHECK (status IN ('to_pay', 'processing', 'paid', 'failed')) DEFAULT 'to_pay',
  paid_at TIMESTAMPTZ,
  payment_reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.guide_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guides can view own payouts"
  ON public.guide_payouts FOR SELECT
  USING (auth.uid() = guide_id OR public.is_admin());

CREATE POLICY "Admins can manage payouts"
  ON public.guide_payouts FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TRIGGER set_guide_payouts_updated_at
  BEFORE UPDATE ON public.guide_payouts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- -----------------------------------------------------------------------------
-- 8. GUIDE INTERVIEWS (Admin <-> Guide WhatsApp scheduling)
-- -----------------------------------------------------------------------------

CREATE TABLE public.guide_interviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  guide_id UUID REFERENCES public.profiles(id) NOT NULL,
  admin_id UUID REFERENCES public.profiles(id) NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  whatsapp_contact TEXT,
  status TEXT CHECK (status IN ('pending_guide', 'pending_admin', 'accepted', 'cancelled')) DEFAULT 'pending_guide',
  proposed_by TEXT CHECK (proposed_by IN ('admin', 'guide')) DEFAULT 'admin',
  admin_note TEXT,
  guide_note TEXT,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.guide_interviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guides and admins can view guide interviews"
  ON public.guide_interviews FOR SELECT
  USING (auth.uid() = guide_id OR auth.uid() = admin_id OR public.is_admin());

CREATE POLICY "Admins can create guide interviews"
  ON public.guide_interviews FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update guide interviews"
  ON public.guide_interviews FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Guides can update own guide interviews"
  ON public.guide_interviews FOR UPDATE
  USING (auth.uid() = guide_id)
  WITH CHECK (auth.uid() = guide_id);

CREATE POLICY "Admins can delete guide interviews"
  ON public.guide_interviews FOR DELETE
  USING (public.is_admin());

CREATE TRIGGER set_guide_interviews_updated_at
  BEFORE UPDATE ON public.guide_interviews
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- -----------------------------------------------------------------------------
-- 9. ADMIN AUDIT LOGS
-- -----------------------------------------------------------------------------

CREATE TABLE public.admin_audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  admin_id UUID REFERENCES public.profiles(id) NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
  ON public.admin_audit_logs FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can write audit logs"
  ON public.admin_audit_logs FOR INSERT
  WITH CHECK (public.is_admin());
