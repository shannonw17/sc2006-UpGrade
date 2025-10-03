// app/(auth)/login/LoginForm.tsx
"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/(backend)/AccountController/login";

const initial: LoginState = {};

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initial);

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form action={formAction} className="w-full max-w-sm space-y-4 border p-6 rounded-lg">
        <h1 className="text-2xl font-semibold">Login</h1>

        {state?.error && (
          <p className="text-sm text-red-600" aria-live="polite">{state.error}</p>
        )}

        <label className="block">
          <div className="text-sm text-gray-600">Username or Email</div>
          <input name="identifier" required className="mt-1 w-full border rounded px-3 py-2" />
        </label>

        <label className="block">
          <div className="text-sm text-gray-600">Password</div>
          <input name="password" type="password" required className="mt-1 w-full border rounded px-3 py-2" />
        </label>

        <button type="submit" disabled={pending} className="w-full rounded bg-black text-white py-2 font-medium disabled:opacity-60">
          {pending ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}
