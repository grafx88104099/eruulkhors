import { useEffect, useState } from "react";
import { collection, doc, limit, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { auth, db } from "@/firebase/client";
import { CommissionDoc, OrderDoc, TechnicianDoc } from "./types";

/** Нэвтэрсэн техникийн өөрт оноогдсон бүх захиалга — real-time. */
export function useMyTechOrders() {
  const [data, setData] = useState<OrderDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) { setLoading(false); return; }
    const q = query(
      collection(db, "orders"),
      where("technicianId", "==", uid),
      orderBy("createdAt", "desc"),
      limit(200),
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

/** Нэвтэрсэн техникийн өөрийн technicians/{uid} doc. */
export function useMyTechnician() {
  const [data, setData] = useState<TechnicianDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) { setLoading(false); return; }
    const ref = doc(db, "technicians", uid);
    const unsub = onSnapshot(ref, (snap) => {
      setData(snap.exists() ? ({ id: snap.id, ...snap.data() } as TechnicianDoc) : null);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  return { data, loading };
}

/** Бүх нээлттэй broadcast захиалга — real-time (тех гар утсан дээр live update). */
export function useAvailableOrders() {
  const [data, setData] = useState<OrderDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, "orders"),
      where("isOpen", "==", true),
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

/** Комиссын дүрэм — бүгдийг real-time. */
export function useCommissionRules() {
  const [data, setData] = useState<CommissionDoc[]>([]);
  useEffect(() => {
    const q = query(collection(db, "commissionRules"), limit(200));
    const unsub = onSnapshot(q, (snap) => {
      setData(snap.docs.map((d) => ({ id: d.id, ...d.data() } as CommissionDoc)));
    }, () => {});
    return () => unsub();
  }, []);
  return data;
}
