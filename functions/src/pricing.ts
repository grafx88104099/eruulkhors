/**
 * Үнэлгээний хөдөлгүүр (pricing engine) — Cloud Functions TS port.
 *
 * Формул:
 *   final = (base × tank_coef + distance_km × zone_rate) × zone_multiplier
 *           × (1 + Σ multiplier_pcts) × (1 + VAT)
 */

export const VAT_RATE = 10; // %

export interface PricingInputs {
  baseServicePrice: number;   // Бүсийн суурь үнэ (₮)
  tankCoefficient: number;    // Танкны коэф
  distanceKm: number;         // Зай (км)
  zoneDistanceRate: number;   // ₮/км
  zoneMultiplier: number;     // 1.0 — 1.6
  multiplierPcts: number[];   // [50, 35, ...]
  vatPct?: number;
}

export interface PricingBreakdown {
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

const round = (x: number) => Math.round(x);

export function calculateOrderPrice(inp: PricingInputs): PricingBreakdown {
  const {
    baseServicePrice: base,
    tankCoefficient: coef,
    distanceKm: dist,
    zoneDistanceRate: rate,
    zoneMultiplier: zmult,
    multiplierPcts = [],
    vatPct = VAT_RATE,
  } = inp;

  const tankAdjusted = base * coef;
  const distanceSurcharge = dist * rate;
  const subtotalBeforeZone = tankAdjusted + distanceSurcharge;
  const zoneMultiplied = subtotalBeforeZone * zmult;

  const urgencyTotalPct = multiplierPcts.reduce((s, p) => s + p, 0);
  const surchargeAmount = zoneMultiplied * (urgencyTotalPct / 100);
  const preVat = zoneMultiplied + surchargeAmount;

  const vatAmount = preVat * (vatPct / 100);
  const total = preVat + vatAmount;

  return {
    base: round(base),
    tankAdjusted: round(tankAdjusted),
    distanceSurcharge: round(distanceSurcharge),
    subtotalBeforeZone: round(subtotalBeforeZone),
    zoneMultiplied: round(zoneMultiplied),
    urgencyTotalPct,
    surchargeAmount: round(surchargeAmount),
    preVat: round(preVat),
    vatAmount: round(vatAmount),
    total: round(total),
  };
}

export function calculateCommission(
  basePct: number,
  bonusPct: number,
  monthlyCap: number,
  grossAmount: number,
  withBonus: boolean,
  paidSoFar: number,
): number {
  const pct = basePct + (withBonus ? bonusPct : 0);
  const raw = Math.floor((grossAmount * pct) / 100);
  const remainingCap = Math.max(0, monthlyCap - paidSoFar);
  return Math.min(raw, remainingCap);
}
