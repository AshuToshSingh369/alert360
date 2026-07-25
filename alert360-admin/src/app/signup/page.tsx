"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signUpWithEmail, signUpWithGoogle } from "@/lib/authService";
import { getAuthErrorMessage } from "@/lib/authErrorMessages";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@alert360.app");
  const [password, setPassword] = useState("Admin123!");
  const [role, setRole] = useState<"admin" | "operator" | "citizen">("admin");
  const [message, setMessage] = useState("Create a new admin account for the portal");
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => email.trim().length > 0 && password.trim().length >= 6, [email, password]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      setMessage("Please enter an email and a password of at least 6 characters");
      return;
    }

    setLoading(true);
    setMessage("Creating Firebase account...");

    try {
      await signUpWithEmail(email.trim(), password, role);
      router.replace("/");
    } catch (error) {
      setMessage(getAuthErrorMessage(error));
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    setMessage("Creating account with Google...");

    try {
      await signUpWithGoogle(role);
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
            Create Admin Account
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
              placeholder="At least 6 characters"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#1a1c1e]" htmlFor="role">
              Portal role
            </label>
            <select
              id="role"
              value={role}
              onChange={(event) => setRole(event.target.value as "admin" | "operator" | "citizen")}
              className="w-full rounded border border-[#c5c6ca] px-3 py-2 text-sm"
            >
              <option value="admin">Admin</option>
              <option value="operator">Operator</option>
              <option value="citizen">Citizen</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="w-full rounded bg-[#b51a1e] px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <div className="mt-4">
          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={loading}
            className="w-full rounded border border-[#c5c6ca] bg-white px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#1a1c1e] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Please wait..." : "Sign up with Google"}
          </button>
        </div>

        <div className="mt-4 text-center text-sm">
          <Link href="/login" className="font-semibold text-[#1a1c1e] underline-offset-2 hover:underline">
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
