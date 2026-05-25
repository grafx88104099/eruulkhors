import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/firebase/client";

/**
 * Шинэ хэрэглэгч анх удаа нэвтрэх үед Firestore-д `users/{uid}` document үүсгэнэ.
 * Анхдагч role нь `customer` — админ хэрэгтэй бол `create-admin.mjs` script-р
 * super_admin custom claim тавьна.
 */
export function startUserSync() {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) return;
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        uid: user.uid,
        email: user.email ?? null,
        displayName: user.displayName ?? null,
        photoURL: user.photoURL ?? null,
        provider: user.providerData[0]?.providerId ?? "unknown",
        role: "customer",
        createdAt: serverTimestamp(),
      });
    } else {
      // Хамгийн сүүлийн нэвтэрсэн цагийг шинэчлэх
      await setDoc(ref, { lastSignInAt: serverTimestamp() }, { merge: true });
    }
  });
}

export function userInitials(user: User | null) {
  if (!user) return "?";
  if (user.displayName) return user.displayName.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();
  if (user.email) return user.email[0].toUpperCase();
  return user.uid.slice(0, 2).toUpperCase();
}
