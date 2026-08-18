const SUPABASE_URL = "https://actgbctprjohjqhxwvlz.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_g2TZB_-n02_IDT3tVpHhNA_-8yAUxEy";

let client = null;

export function getSupabaseClient() {
  if (client) return client;
  if (!globalThis.supabase?.createClient) return null;
  client = globalThis.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  return client;
}

export async function getCurrentUser() {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session?.user || null;
}

export function onAuthStateChange(callback) {
  const supabase = getSupabaseClient();
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null);
  });
  return () => data.subscription.unsubscribe();
}

export async function signIn(email, password) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase SDK 未加载。");
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function signUp(email, password) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase SDK 未加载。");
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data.user;
}

export async function signOut() {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function loadCloudProgress(userId) {
  const supabase = getSupabaseClient();
  if (!supabase || !userId) return null;
  const { data, error } = await supabase
    .from("user_progress")
    .select("progress, updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data?.progress || null;
}

export async function saveCloudProgress(userId, state) {
  const supabase = getSupabaseClient();
  if (!supabase || !userId) return false;
  const { error } = await supabase
    .from("user_progress")
    .upsert({
      user_id: userId,
      progress: state,
      updated_at: new Date().toISOString()
    }, { onConflict: "user_id" });
  if (error) throw error;
  return true;
}
