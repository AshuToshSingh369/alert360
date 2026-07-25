import test from "node:test";
import assert from "node:assert/strict";
import { getAuthErrorMessage } from "./authErrorMessages";

test("maps popup closure to a helpful message", () => {
  const message = getAuthErrorMessage({ code: "auth/popup-closed-by-user" });
  assert.match(message, /popup/i);
});

test("maps invalid credential to a clear message", () => {
  const message = getAuthErrorMessage({ code: "auth/invalid-credential" });
  assert.match(message, /email/i);
});

test("falls back to a generic message", () => {
  const message = getAuthErrorMessage("unexpected");
  assert.match(message, /Firebase/i);
});
