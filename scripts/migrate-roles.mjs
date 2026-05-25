/**
 * Migrate users: convert single `role` claim → `roles: [role]` array.
 *
 *   GOOGLE_APPLICATION_CREDENTIALS=../service-account.json node migrate-roles.mjs
 */
import admin from "firebase-admin";

admin.initializeApp({ projectId: process.env.GCLOUD_PROJECT || "ecosupport-1a5fd" });

async function run() {
  const auth = admin.auth();
  const db = admin.firestore();
  let next;
  let migrated = 0;
  let skipped = 0;
  do {
    const page = await auth.listUsers(1000, next);
    for (const u of page.users) {
      const c = u.customClaims ?? {};
      if (Array.isArray(c.roles)) { skipped++; continue; }
      const role = c.role ?? "customer";
      const roles = [role];
      await auth.setCustomUserClaims(u.uid, { role, roles });
      await db.doc(`users/${u.uid}`).set({ role, roles }, { merge: true });
      console.log(`${u.uid} ${u.email ?? ""} → [${roles.join(",")}]`);
      migrated++;
    }
    next = page.pageToken;
  } while (next);
  console.log(`\n✓ Migrated ${migrated}, skipped ${skipped} (already array)`);
  process.exit(0);
}

run().catch((e) => { console.error(e); process.exit(1); });
