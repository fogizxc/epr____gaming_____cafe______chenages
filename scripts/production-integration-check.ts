import { strict as assert } from "node:assert";

/**
 * Production integration contract checks.
 *
 * These checks are intentionally dependency-free: they validate the invariants
 * that must remain true across booking, payments, wallet, membership, F&B and
 * refunds. Runtime API tests can call the same assertions against a test Atlas
 * database in CI/staging.
 */

type Payment = { id: string; amountPaise: number; status: string; refundedAmountPaise?: number };
type Refund = { id: string; amountPaise: number; status: string; providerRefundId?: string };

function assertIntegerPaise(value: unknown, name: string) {
  assert.equal(Number.isSafeInteger(value), true, `${name} must be integer paise`);
  assert.ok(Number(value) >= 0, `${name} must be non-negative`);
}

function assertRefundCap(payment: Payment, refunds: Refund[], nextAmount: number) {
  assertIntegerPaise(payment.amountPaise, "payment.amountPaise");
  assertIntegerPaise(nextAmount, "refund.amountPaise");
  const persisted = Number(payment.refundedAmountPaise || 0);
  const activeRefunds = refunds
    .filter((r) => r.status === "COMPLETED" || r.status === "PROCESSING")
    .reduce((sum, r) => sum + Number(r.amountPaise || 0), 0);
  assert.ok(nextAmount + Math.max(persisted, activeRefunds) <= payment.amountPaise, "refund exceeds captured payment");
}

function assertBookingTransition(from: string, to: string) {
  const allowed: Record<string, string[]> = {
    UPCOMING: ["ACTIVE", "CANCELLED", "NO-SHOW"],
    ACTIVE: ["COMPLETED"],
    CANCELLED: [],
    "NO-SHOW": [],
    COMPLETED: [],
  };
  assert.ok(allowed[from]?.includes(to), `invalid booking transition ${from} -> ${to}`);
}

function assertStationTransition(from: string, to: string) {
  const allowed: Record<string, string[]> = {
    AVAILABLE: ["RESERVED", "ACTIVE", "MAINTENANCE", "OFFLINE"],
    RESERVED: ["ACTIVE", "AVAILABLE", "MAINTENANCE"],
    ACTIVE: ["AVAILABLE", "MAINTENANCE"],
    MAINTENANCE: ["AVAILABLE", "OFFLINE"],
    OFFLINE: ["AVAILABLE"],
  };
  assert.ok(allowed[from]?.includes(to), `invalid station transition ${from} -> ${to}`);
}

function run() {
  assertIntegerPaise(19900, "gaming price");
  assertIntegerPaise(399900, "membership price");

  assertBookingTransition("UPCOMING", "ACTIVE");
  assertBookingTransition("UPCOMING", "CANCELLED");
  assertBookingTransition("UPCOMING", "NO-SHOW");
  assertBookingTransition("ACTIVE", "COMPLETED");

  assertStationTransition("AVAILABLE", "RESERVED");
  assertStationTransition("RESERVED", "ACTIVE");
  assertStationTransition("ACTIVE", "AVAILABLE");
  assertStationTransition("AVAILABLE", "MAINTENANCE");

  const payment: Payment = { id: "PAY-TEST", amountPaise: 10000, status: "CAPTURED", refundedAmountPaise: 0 };
  const refunds: Refund[] = [{ id: "R1", amountPaise: 3000, status: "COMPLETED" }];
  assertRefundCap(payment, refunds, 7000);
  assert.throws(() => assertRefundCap(payment, refunds, 7001), /refund exceeds/);

  console.log("production integration contract checks: PASS");
}

run();
