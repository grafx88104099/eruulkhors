export interface OrderDoc {
  id: string;
  code: string;
  customer: string;
  district: string | null;
  service: string;
  tank: string;
  tankId?: string;
  zoneId?: string;
  technicianCode: string | null;
  technicianId: string | null;
  priority: string;
  status: string;
  eta: string;
  totalPrice: number;
  distanceKm: number;
  priceBreakdown?: PriceBreakdown | null;
  notes?: string;
  multiplierIds?: string[];
  createdAt?: any;
}

export interface PriceBreakdown {
  base: number;
  tankAdjusted: number;
  distanceSurcharge: number;
  subtotalBeforeZone: number;
  zoneMultiplied: number;
  urgencyTotalPct: number;
  surchargeAmount: number;
  preVat: number;
  vatAmount: number;
  total: number;
}

export interface TechnicianDoc {
  id: string;
  code: string;
  name: string;
  role: string;
  status: "busy" | "idle" | "off";
  rating: number;
  vehiclePlate: string | null;
  location?: { lat: number; lng: number } | null;
}

export interface StockDoc {
  id: string;
  skuCode: string;
  skuName: string;
  skuCategory: string;
  skuUnit: string;
  skuCost: number;
  warehouseCode: string;
  stock: number;
  reserved: number;
  minThreshold: number;
  maxThreshold: number;
  isLow: boolean;
  isCritical: boolean;
}

export interface WarehouseDoc {
  id: string;
  code: string;
  name: string;
  location: string;
  capacity: number;
  manager: string;
  geo?: { lat: number; lng: number } | null;
}

export interface PricingZoneDoc {
  id: string;
  name: string;
  servicePump: number;
  serviceInstall: number;
  serviceRepair: number;
  distanceKmRate: number;
  multiplier: number;
}

export interface MultiplierDoc {
  id: string;
  code: string;
  name: string;
  pct: number;
  scope: string;
  active: boolean;
}

export interface CommissionDoc {
  id: string;
  role: string;
  basePct: number;
  bonusPct: number;
  monthlyCap: number;
}

export interface TankSizeDoc {
  id: string;
  label: string;
  volumeM3: number;
  coefficient: number;
}
