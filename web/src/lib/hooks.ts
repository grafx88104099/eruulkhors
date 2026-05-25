import { useEffect, useState } from "react";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  QueryConstraint,
} from "firebase/firestore";
import { db } from "@/firebase/client";

export function useCollection<T>(path: string, ...constraints: QueryConstraint[]) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const q = constraints.length ? query(collection(db, path), ...constraints) : collection(db, path);
    const unsub = onSnapshot(
      q as any,
      (snap: any) => {
        setData(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as T)));
        setLoading(false);
      },
      (err: Error) => {
        setError(err);
        setLoading(false);
      },
    );
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  return { data, loading, error };
}

// Keep snapshot windows bounded so the persistent IndexedDB cache + in-memory
// listener set stay small. Tune per-page if a screen genuinely needs more.
export const DEFAULT_PAGE_LIMIT = 200;
export const LARGE_COLLECTION_LIMIT = 500;

export function useOrders(count: number = LARGE_COLLECTION_LIMIT) {
  return useCollection<import("./types").OrderDoc>("orders", orderBy("code", "desc"), limit(count));
}

export function useTechnicians(count: number = DEFAULT_PAGE_LIMIT) {
  return useCollection<import("./types").TechnicianDoc>("technicians", limit(count));
}

export function useStockLevels(count: number = LARGE_COLLECTION_LIMIT) {
  return useCollection<import("./types").StockDoc>("stockLevels", limit(count));
}

export function useWarehouses(count: number = DEFAULT_PAGE_LIMIT) {
  return useCollection<import("./types").WarehouseDoc>("warehouses", limit(count));
}

export function usePricingZones(count: number = DEFAULT_PAGE_LIMIT) {
  return useCollection<import("./types").PricingZoneDoc>("pricingZones", orderBy("order"), limit(count));
}

export function useMultipliers(count: number = DEFAULT_PAGE_LIMIT) {
  return useCollection<import("./types").MultiplierDoc>("multipliers", limit(count));
}

export function useCommissionRules(count: number = DEFAULT_PAGE_LIMIT) {
  return useCollection<import("./types").CommissionDoc>("commissionRules", limit(count));
}

export function useTankSizes(count: number = DEFAULT_PAGE_LIMIT) {
  return useCollection<import("./types").TankSizeDoc>("tankSizes", orderBy("volumeM3"), limit(count));
}

export function useDistricts(count: number = DEFAULT_PAGE_LIMIT) {
  return useCollection<{ id: string; name: string }>("districts", limit(count));
}

export interface StockMovementDoc {
  id: string;
  skuCode: string;
  skuName: string;
  skuUnit?: string;
  warehouseCode: string;
  warehouseName?: string;
  type: "in" | "out" | "adjust";
  quantity: number;
  delta: number;
  balanceBefore: number;
  balanceAfter: number;
  unitCost?: number;
  totalValue?: number;
  reason?: string;
  note?: string;
  actorUid?: string;
  createdAt?: any;
}

export function useStockMovements(count: number = 30) {
  return useCollection<StockMovementDoc>("stockMovements", orderBy("createdAt", "desc"), limit(count));
}

export function useSKUs(count: number = LARGE_COLLECTION_LIMIT) {
  return useCollection<{
    id: string;
    code: string;
    name: string;
    category: string;
    unit: string;
    cost: number;
    minThreshold?: number;
    maxThreshold?: number;
  }>("skus", limit(count));
}
