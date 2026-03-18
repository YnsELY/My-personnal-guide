import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEST_PILGRIM = {
  email: 'store.review.pilgrim@nefsy.app',
  password: 'ReviewPilgrim#2026',
  fullName: 'Store Review Pilgrim',
};

const TEST_GUIDE = {
  email: 'store.review.guide@nefsy.app',
  password: 'ReviewGuide#2026',
  fullName: 'Store Review Guide',
};

async function findUserByEmail(email: string) {
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const users = data.users || [];
    const found = users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (found) return found;

    if (users.length < perPage) break;
    page += 1;
  }

  return null;
}

async function ensureUser(params: {
  email: string;
  password: string;
  metadata: Record<string, any>;
}) {
  const existing = await findUserByEmail(params.email);
  if (existing) return existing;

  const { data, error } = await supabase.auth.admin.createUser({
    email: params.email,
    password: params.password,
    email_confirm: true,
    user_metadata: params.metadata,
  });

  if (error) throw error;
  if (!data.user) throw new Error(`Unable to create user ${params.email}`);
  return data.user;
}

async function run() {
  const pilgrimUser = await ensureUser({
    email: TEST_PILGRIM.email,
    password: TEST_PILGRIM.password,
    metadata: {
      full_name: TEST_PILGRIM.fullName,
      role: 'pilgrim',
      gender: 'male',
      language: 'fr',
    },
  });

  const guideUser = await ensureUser({
    email: TEST_GUIDE.email,
    password: TEST_GUIDE.password,
    metadata: {
      full_name: TEST_GUIDE.fullName,
      role: 'guide',
      gender: 'male',
      language: 'fr',
    },
  });

  const nowIso = new Date().toISOString();

  const { error: profileError } = await supabase.from('profiles').upsert([
    {
      id: pilgrimUser.id,
      full_name: TEST_PILGRIM.fullName,
      email: TEST_PILGRIM.email,
      role: 'pilgrim',
      gender: 'male',
      language: 'fr',
      account_status: 'active',
      updated_at: nowIso,
    },
    {
      id: guideUser.id,
      full_name: TEST_GUIDE.fullName,
      email: TEST_GUIDE.email,
      role: 'guide',
      gender: 'male',
      language: 'fr',
      account_status: 'active',
      updated_at: nowIso,
    },
  ], { onConflict: 'id' });

  if (profileError) throw profileError;

  const { error: guideError } = await supabase.from('guides').upsert({
    id: guideUser.id,
    bio: 'Compte de test guide validé pour review store.',
    location: 'La Mecque',
    languages: ['Français', 'Arabe'],
    verified: true,
    onboarding_status: 'approved',
    phone_number: '+966500000000',
    price_per_day: 200,
    currency: 'EUR',
    price_unit: '/prestation',
    rating: 5,
    reviews_count: 3,
    updated_at: nowIso,
  }, { onConflict: 'id' });

  if (guideError) throw guideError;

  const { error: walletError } = await supabase.from('pilgrim_wallets').upsert({
    user_id: pilgrimUser.id,
    currency: 'EUR',
    available_balance: 500,
    total_credited: 500,
    total_debited: 0,
    updated_at: nowIso,
  }, { onConflict: 'user_id' });

  if (walletError) throw walletError;

  console.log('Store review accounts ready:');
  console.log(`Pilgrim: ${TEST_PILGRIM.email} / ${TEST_PILGRIM.password}`);
  console.log(`Guide:   ${TEST_GUIDE.email} / ${TEST_GUIDE.password}`);
}

run().catch((error) => {
  console.error('Failed to create store review accounts:', error);
  process.exit(1);
});
