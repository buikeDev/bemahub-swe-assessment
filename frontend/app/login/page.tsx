"use client";

import { useRef, useState, type FormEvent } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useAuthStore } from "@/lib/auth/authStore";
import type { LoginResponse } from "@/lib/types/api";

export default function LoginPage() {
  const signIn = useAuthStore((state) => state.signIn);
  const queryClient = useQueryClient();
  const router = useRouter();
  const submitting = useRef(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signedInName, setSignedInName] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setIsSubmitting(true);
    setError(null);
    setSignedInName(null);

    try {
      const { data } = await api.post<LoginResponse>("/auth/login", {
        email: email.trim(),
        password,
      });
      // Remove cached data from any previous account before storing this login.
      await queryClient.cancelQueries();
      queryClient.clear();
      signIn(data.token, data.user);
      setPassword("");
      setSignedInName(data.user.name);
      router.replace("/earnings");
    } catch (failure: unknown) {
      if (axios.isAxiosError(failure)) {
        if (!failure.response) {
          setError("Cannot reach the sign-in service. Check your connection and try again.");
        } else if (failure.response.status === 401) {
          setError("Email or password is incorrect.");
        } else if (failure.response.status === 403) {
          setError("You are not permitted to sign in.");
        } else {
          setError("Sign-in failed. Please try again.");
        }
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-md space-y-6">
      <h2 className="text-2xl font-semibold">Sign in</h2>
      {signedInName ? (
        <p role="status" className="rounded-md border border-green-200 bg-green-50 p-4 text-green-800">
          Signed in as {signedInName}.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-md border bg-white p-6" aria-busy={isSubmitting}>
          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm font-medium">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isSubmitting}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm font-medium">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isSubmitting}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </div>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-blue-700 px-4 py-2 font-medium text-white disabled:opacity-50"
          >
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      )}
    </section>
  );
}
