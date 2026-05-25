import { onAuthStateChanged, User } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/firebase/client";

/**
 * Auth state listener — fires for every sign-in (and on app boot when the
 * cached user rehydrates).
 *
 * Provisioning of new users (users/{uid} doc + default 'customer' claim)
 * is handled SERVER-SIDE by the `onUserCreate` Cloud Function. The client
 * never writes the initial doc — Firestore rules forbid it on purpose so
 * a user cannot escalate its own role.
 *
 * The only thing we do from the client is bump `lastSignInAt` so the
 * admin "People" screen can show last-seen times. The Firestore rule
 * whitelists `lastSignInAt` for self-update.
 *
 * Race window: on a brand-new account the onUserCreate trigger usually
 * completes within ~1s, but auth-state-changed fires immediately. If the
 * users/{uid} doc does not exist yet, the update below will fail with
 * permission-denied because there is no doc to merge into. That's OK —
 * the trigger writes its own `lastSignInAt = createdAt`, and the next
 * sign-in (or page refresh) will succeed. We log a debug-level warning
 * and move on.
 */
export function startUserSync() {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) return;
    try {
      await setDoc(
        doc(db, "users", user.uid),
        { lastSignInAt: serverTimestamp() },
        { merge: true },
      );
    } catch (err: any) {
      // Anonymous users are not provisioned with a users/{uid} doc by the
      // Cloud Function (they have no real identity to record), so the
      // update will deny — that's expected. For real accounts a denial
      // here usually means the onUserCreate trigger is still running on
      // a brand-new signup; the next sign-in will succeed.
      if (err?.code === "permission-denied") {
        console.debug("[userSync] lastSignInAt skipped (doc not ready or anon user)");
      } else {
        console.warn("[userSync] lastSignInAt failed:", err);
      }
    }
  });
}

export function userInitials(user: User | null) {
  if (!user) return "?";
  if (user.displayName) return user.displayName.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();
  if (user.email) return user.email[0].toUpperCase();
  return user.uid.slice(0, 2).toUpperCase();
}
