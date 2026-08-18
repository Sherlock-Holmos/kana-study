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
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session?.user || null));
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

function tableMissing(error) {
  return ["42P01", "PGRST205", "PGRST204"].includes(error?.code) || /relation .* does not exist|Could not find the table/i.test(error?.message || "");
}

async function loadNormalized(userId) {
  const supabase = getSupabaseClient();
  const [settingsRes, courseRes, metaRes, skillsRes, dailyRes, sessionsRes] = await Promise.all([
    supabase.from("user_settings").select("settings, updated_at").eq("user_id", userId).maybeSingle(),
    supabase.from("user_course_progress").select("completed_lessons, updated_at").eq("user_id", userId).maybeSingle(),
    supabase.from("user_learning_meta").select("lifetime, active_session, meta, updated_at").eq("user_id", userId).maybeSingle(),
    supabase.from("user_item_progress").select("skill_key, progress").eq("user_id", userId),
    supabase.from("user_daily_stats").select("study_date, devices").eq("user_id", userId),
    supabase.from("study_sessions").select("payload").eq("user_id", userId).order("started_at", { ascending: true }).limit(180)
  ]);
  const responses = [settingsRes, courseRes, metaRes, skillsRes, dailyRes, sessionsRes];
  const error = responses.find(result => result.error)?.error;
  if (error) throw error;
  const hasAny = settingsRes.data || courseRes.data || metaRes.data || (skillsRes.data?.length || 0) || (dailyRes.data?.length || 0) || (sessionsRes.data?.length || 0);
  if (!hasAny) return null;
  return {
    schemaVersion: 11,
    settings: settingsRes.data?.settings || {},
    curriculum: {
      completedLessons: courseRes.data?.completed_lessons || [],
      updatedAt: courseRes.data?.updated_at || null
    },
    skills: Object.fromEntries((skillsRes.data || []).map(row => [row.skill_key, row.progress])),
    activity: Object.fromEntries((dailyRes.data || []).map(row => [row.study_date, { devices: row.devices || {} }])),
    lifetime: metaRes.data?.lifetime || { devices: {} },
    activeSession: metaRes.data?.active_session || null,
    sessions: (sessionsRes.data || []).map(row => row.payload).filter(Boolean),
    meta: metaRes.data?.meta || {}
  };
}

async function loadLegacySnapshot(userId) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("user_progress").select("progress").eq("user_id", userId).maybeSingle();
  if (error) {
    if (tableMissing(error)) return null;
    throw error;
  }
  return data?.progress || null;
}

export async function loadCloudProgress(userId) {
  const supabase = getSupabaseClient();
  if (!supabase || !userId) return null;
  try {
    const normalized = await loadNormalized(userId);
    if (normalized) return normalized;
  } catch (error) {
    if (!tableMissing(error)) throw error;
  }
  return loadLegacySnapshot(userId);
}

function meaningfulSkill(progress) {
  if (!progress) return false;
  if (progress.mastery || progress.lastReviewedAt || progress.nextReviewAt) return true;
  return Object.values(progress.counters || {}).some(counts => Number(counts.correct || 0) + Number(counts.wrong || 0) > 0);
}

async function saveNormalized(userId, state) {
  const supabase = getSupabaseClient();
  const now = new Date().toISOString();

  const baseWrites = await Promise.all([
    supabase.from("user_settings").upsert({ user_id: userId, settings: state.settings, updated_at: now }, { onConflict: "user_id" }),
    supabase.from("user_course_progress").upsert({ user_id: userId, completed_lessons: state.curriculum?.completedLessons || [], updated_at: now }, { onConflict: "user_id" }),
    supabase.from("user_learning_meta").upsert({ user_id: userId, lifetime: state.lifetime || { devices: {} }, active_session: state.activeSession || null, meta: state.meta || {}, updated_at: now }, { onConflict: "user_id" })
  ]);
  const baseError = baseWrites.find(result => result.error)?.error;
  if (baseError) throw baseError;

  const skillDelete = await supabase.from("user_item_progress").delete().eq("user_id", userId);
  if (skillDelete.error) throw skillDelete.error;
  const skillRows = Object.entries(state.skills || {}).filter(([, progress]) => meaningfulSkill(progress)).map(([skillKey, progress]) => ({ user_id: userId, skill_key: skillKey, progress, updated_at: now }));
  if (skillRows.length) {
    const { error } = await supabase.from("user_item_progress").upsert(skillRows, { onConflict: "user_id,skill_key" });
    if (error) throw error;
  }

  const dailyDelete = await supabase.from("user_daily_stats").delete().eq("user_id", userId);
  if (dailyDelete.error) throw dailyDelete.error;
  const dailyRows = Object.entries(state.activity || {}).map(([date, entry]) => ({ user_id: userId, study_date: date, devices: entry.devices || {}, updated_at: now }));
  if (dailyRows.length) {
    const { error } = await supabase.from("user_daily_stats").upsert(dailyRows, { onConflict: "user_id,study_date" });
    if (error) throw error;
  }

  const sessionDelete = await supabase.from("study_sessions").delete().eq("user_id", userId);
  if (sessionDelete.error) throw sessionDelete.error;
  const sessionRows = (state.sessions || []).slice(-180).filter(session => session?.id).map(session => ({
    user_id: userId,
    session_id: session.id,
    started_at: session.startedAt || now,
    completed_at: session.completedAt || null,
    payload: session
  }));
  if (sessionRows.length) {
    const { error } = await supabase.from("study_sessions").upsert(sessionRows, { onConflict: "user_id,session_id" });
    if (error) throw error;
  }
  return true;
}

async function saveLegacySnapshot(userId, state) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("user_progress").upsert({ user_id: userId, progress: state, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) throw error;
  return true;
}

export async function saveCloudProgress(userId, state) {
  const supabase = getSupabaseClient();
  if (!supabase || !userId) return false;
  try {
    return await saveNormalized(userId, state);
  } catch (error) {
    if (!tableMissing(error)) throw error;
    return saveLegacySnapshot(userId, state);
  }
}
