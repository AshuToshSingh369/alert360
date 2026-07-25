"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmail, signInWithGoogle } from "@/lib/authService";
import { getAuthErrorMessage } from "@/lib/authErrorMessages";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@alert360.app");
  const [password, setPassword] = useState("admin123");
  const [message, setMessage] = useState("Sign in to the admin console");
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => email.trim().length > 0 && password.trim().length > 0, [email, password]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      setMessage("Please enter both email and password");
      return;
    }

    setLoading(true);
    setMessage("Authenticating with Firebase...");

    try {
      await signInWithEmail(email.trim(), password);
      router.replace("/");
    } catch (error) {
      setMessage(getAuthErrorMessage(error));
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setMessage("Opening Google sign-in...");

    try {
      await signInWithGoogle("citizen");
      router.replace("/");
    } catch (error) {
      setMessage(getAuthErrorMessage(error));
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fbf9f6] p-6">
      <div className="w-full max-w-md rounded border border-[#c5c6ca] bg-white p-8 shadow-sm">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#75777a]">Alert360 Admin</p>
          <h1 className="mt-2 font-['Archivo_Narrow'] text-2xl font-bold uppercase tracking-tight text-[#1a1c1e]">
            Secure Sign In
          </h1>
          <p className="mt-3 text-sm text-[#44474a]">{message}</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#1a1c1e]" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded border border-[#c5c6ca] px-3 py-2 text-sm"
              placeholder="admin@alert360.app"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#1a1c1e]" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded border border-[#c5c6ca] px-3 py-2 text-sm"
              placeholder="Enter password"
            />
          </div>

          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="w-full rounded bg-[#1a1c1e] px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-4">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full rounded border border-[#c5c6ca] bg-white px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#1a1c1e] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Please wait..." : "Sign in with Google"}
          </button>
        </div>

        <div className="mt-6 rounded border border-[#efeeeb] bg-[#fbf9f6] p-3 text-sm text-[#44474a]">
          <p className="font-semibold text-[#1a1c1e]">Setup note</p>
          <p className="mt-1">
            Use the sign-up option below to create a Firebase Auth account and automatically add the matching Firestore role record.
          </p>
        </div>

        <div className="mt-4 text-center text-sm">
          <Link href="/signup" className="font-semibold text-[#b51a1e] underline-offset-2 hover:underline">
            Create an admin account
          </Link>
        </div>
      </div>
    </div>
  );
}
