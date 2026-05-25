/**
 * Provision an admin via Firebase Admin SDK.
 *
 * Two modes:
 *   1) New user (email + password):
 *        node create-admin.mjs <email> <password> [role]
 *   2) Promote existing user (email only — Google sign-in already happened):
 *        node create-admin.mjs <email>
 *
 * Default role is `super_admin`. Other valid roles:
 *   super_admin | dispatcher | warehouse | finance
 *
 * Race-safe vs the onUserCreate Cloud Function trigger:
 * createUser fires onUserCreate which assigns default `customer` claims.
 * We poll-and-reapply our chosen role until the read-back matches, so
 * whichever invocation finishes last leaves the correct state.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=../service-account.json \
 *     GCLOUD_PROJECT=ecosupport-1a5fd \
 *     node create-admin.mjs admin@eruulkhors.mn НууцҮг123
 */
import admin from "firebase-admin";

const VALID_ROLES = ["super_admin", "dispatcher", "warehouse", "finance"];

admin.initializeApp({ projectId: process.env.GCLOUD_PROJECT || "ecosupport-1a5fd" });

const [, , email, passwordOrRole, maybeRole] = process.argv;
if (!email) {
  console.error("Usage: node create-admin.mjs <email> [<password>] [role]");
  console.error("       node create-admin.mjs <email>   # promote existing user");
  process.exit(1);
}

// Disambiguate args: if 3rd arg looks like a role, treat 2nd arg as the role
// and skip password (existing-user mode); otherwise 2nd arg is password.
let password = null;
let role = "super_admin";
if (passwordOrRole) {
  if (VALID_ROLES.includes(passwordOrRole)) {
    role = passwordOrRole;
  } else {
    password = passwordOrRole;
    if (maybeRole) {
      if (!VALID_ROLES.includes(maybeRole)) {
        console.error(`Invalid role '${maybeRole}'. Valid: ${VALID_ROLES.join(", ")}`);
        process.exit(1);
      }
      role = maybeRole;
    }
  }
}

const displayName = "Системийн админ";

async function ensureRoleStable(uid, targetRole, maxAttempts = 6) {
  // The onUserCreate trigger may overwrite our claim with the default
  // `customer`. Reapply until a read-back confirms the target role.
  for (let i = 0; i < maxAttempts; i++) {
    await admin.auth().setCustomUserClaims(uid, {
      role: targetRole,
      roles: [targetRole],
    });
    await new Promise((r) => setTimeout(r, 1500));
    const u = await admin.auth().getUser(uid);
    const c = u.customClaims || {};
    const ok = c.role === targetRole
            && Array.isArray(c.roles)
            && c.roles.length === 1
            && c.roles[0] === targetRole;
    if (ok) {
      console.log(`✓ Claim stable after attempt ${i + 1}: role=${targetRole}`);
      return;
    }
    console.log(`  attempt ${i + 1}/${maxAttempts}: claim drifted (role=${c.role ?? "none"}), retrying…`);
  }
  throw new Error(`Failed to stabilize claim after ${maxAttempts} attempts`);
}

async function run() {
  let user;
  let created = false;
  try {
    user = await admin.auth().getUserByEmail(email);
    console.log(`Existing user: ${user.uid}`);
  } catch {
    if (!password) {
      console.error(`No existing user for ${email} and no password supplied.`);
      console.error("Either provide a password to create a new account, or have the user sign in via Google first.");
      process.exit(1);
    }
    user = await admin.auth().createUser({
      email,
      password,
      emailVerified: true,
      displayName,
    });
    created = true;
    console.log(`Created user: ${user.uid}`);
  }

  await ensureRoleStable(user.uid, role);

  // Mirror in users/{uid} for display in the People screen.
  await admin.firestore().doc(`users/${user.uid}`).set({
    uid: user.uid,
    email,
    displayName: user.displayName || displayName,
    role,
    roles: [role],
    roleUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    roleUpdatedBy: "create-admin.mjs",
  }, { merge: true });
  console.log(`✓ users/${user.uid} updated`);

  console.log("\nЛогин:");
  console.log(`  Email:    ${email}`);
  if (created) console.log(`  Password: ${password}`);
  else console.log(`  Password: (existing — use the credential they already have)`);
  console.log(`  Role:     ${role}`);
  console.log("\n⚠ The user must sign out and back in for the new claim to take effect.");
  process.exit(0);
}

run().catch((e) => { console.error(e); process.exit(1); });
