import test from "node:test";
import assert from "node:assert/strict";
import { getAccessState, isAdminLikeRole, summarizeIncidentStats } from "./adminHelpers";

test("allows admin role and blocks citizen role", () => {
  assert.equal(getAccessState("admin").canAccess, true);
  assert.equal(getAccessState("admin").role, "admin");
  assert.equal(getAccessState("citizen").canAccess, false);
  assert.equal(getAccessState("citizen").reason, "role");
});

test("identifies admin-like roles", () => {
  assert.equal(isAdminLikeRole("admin"), true);
  assert.equal(isAdminLikeRole("operator"), true);
  assert.equal(isAdminLikeRole("citizen"), false);
  assert.equal(isAdminLikeRole(null), false);
});

test("summarizes incidents by status", () => {
  const summary = summarizeIncidentStats([
    { status: "pending" },
    { status: "in-progress" },
    { status: "resolved" },
    { status: "pending" },
  ]);

  assert.deepEqual(summary, {
    pending: 2,
    inProgress: 1,
    resolved: 1,
  });
});
