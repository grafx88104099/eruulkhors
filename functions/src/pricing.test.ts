import { calculateOrderPrice } from "./pricing";

describe("calculateOrderPrice", () => {
  it("basic pump in center zone, 5km, no multipliers", () => {
    const b = calculateOrderPrice({
      baseServicePrice: 180000,
      tankCoefficient: 1.0,
      distanceKm: 5,
      zoneDistanceRate: 2500,
      zoneMultiplier: 1.0,
      multiplierPcts: [],
    });
    expect(b.tankAdjusted).toBe(180000);
    expect(b.distanceSurcharge).toBe(12500);
    expect(b.subtotalBeforeZone).toBe(192500);
    expect(b.zoneMultiplied).toBe(192500);
    expect(b.vatAmount).toBe(19250);
    expect(b.total).toBe(211750);
  });

  it("remote zone + urgent 50% + night 35%", () => {
    const b = calculateOrderPrice({
      baseServicePrice: 480000,
      tankCoefficient: 1.4,
      distanceKm: 20,
      zoneDistanceRate: 6800,
      zoneMultiplier: 1.6,
      multiplierPcts: [50, 35],
    });
    expect(b.tankAdjusted).toBe(672000);
    expect(b.distanceSurcharge).toBe(136000);
    expect(b.zoneMultiplied).toBe(1292800);
    expect(b.urgencyTotalPct).toBe(85);
    expect(b.total).toBe(2630848);
  });

  it("zero distance", () => {
    const b = calculateOrderPrice({
      baseServicePrice: 145000,
      tankCoefficient: 0.7,
      distanceKm: 0,
      zoneDistanceRate: 2500,
      zoneMultiplier: 1.0,
      multiplierPcts: [],
    });
    expect(b.distanceSurcharge).toBe(0);
    expect(b.tankAdjusted).toBe(101500);
    expect(b.total).toBe(111650);
  });
});
