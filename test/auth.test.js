import test from "node:test";
import assert from "node:assert/strict";

test("password reset and password update use Supabase auth without exposing service credentials", async () => {
  const calls = { reset: null, update: null };
  let authCallback = null;
  globalThis.location = { origin: "https://nihongo.jokersh.site", pathname: "/" };
  globalThis.supabase = {
    createClient() {
      return {
        auth: {
          resetPasswordForEmail: async (email, options) => { calls.reset = { email, options }; return { error: null }; },
          updateUser: async payload => { calls.update = payload; return { data: { user: { id: "u1" } }, error: null }; },
          onAuthStateChange: callback => { authCallback = callback; return { data: { subscription: { unsubscribe() {} } } }; }
        }
      };
    }
  };

  const mod = await import(`../src/sync/supabase.js?auth-test=${Date.now()}`);
  await mod.sendPasswordReset("user@example.com");
  assert.equal(calls.reset.email, "user@example.com");
  assert.equal(calls.reset.options.redirectTo, "https://nihongo.jokersh.site/");

  await mod.updatePassword("12345678");
  assert.deepEqual(calls.update, { password: "12345678" });

  let received = null;
  mod.onAuthStateChange((user, event) => { received = { user, event }; });
  authCallback("PASSWORD_RECOVERY", { user: { id: "u1" } });
  assert.equal(received.event, "PASSWORD_RECOVERY");
  assert.equal(received.user.id, "u1");
});
