import { useEffect, useState } from "react";
import { collection, limit, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { auth, db } from "@/firebase/client";
import { OrderDoc } from "./types";

/** Зөвхөн нэвтэрсэн захиалагчийн өөрийн захиалга real-time subscription. */
export function useMyOrders() {
  const [data, setData] = useState<OrderDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) { setLoading(false); return; }
    const q = query(
      collection(db, "orders"),
      where("customerId", "==", uid),
      orderBy("createdAt", "desc"),
      limit(100),
    );
    const unsub = onSnapshot(q,
      (snap) => {
        setData(snap.docs.map((d) => ({ id: d.id, ...d.data() } as OrderDoc)));
        setLoading(false);
      },
      (err) => { setError(err); setLoading(false); },
    );
    return () => unsub();
  }, []);

  return { data, loading, error };
}
