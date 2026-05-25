/**
 * Create an admin user via Firebase Admin SDK + set custom claim role=super_admin.
 *
 *   GOOGLE_APPLICATION_CREDENTIALS=../service-account.json node create-admin.mjs <email> <password>
 */
import admin from "firebase-admin";

admin.initializeApp({ projectId: process.env.GCLOUD_PROJECT || "ecosupport-1a5fd" });

const [, , email = "admin@ecosupport.local", password = "password123"] = process.argv;

async function run() {
  let user;
  try {
    user = await admin.auth().getUserByEmail(email);
    console.log(`Existing user found: ${user.uid}`);
  } catch {
    user = await admin.auth().createUser({ email, password, emailVerified: true, displayName: "Системийн админ" });
    console.log(`Created user: ${user.uid}`);
  }

  await admin.auth().setCustomUserClaims(user.uid, { role: "super_admin" });
  console.log(`✓ Set custom claim: role=super_admin`);

  await admin.firestore().doc(`users/${user.uid}`).set({
    email,
    displayName: "Системийн админ",
    role: "super_admin",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
  console.log(`✓ Firestore users/${user.uid} written`);

  console.log("\nЛогин:");
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${password}`);
  process.exit(0);
}

run().catch((e) => { console.error(e); process.exit(1); });
