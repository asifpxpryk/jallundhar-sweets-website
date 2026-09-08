"use client";

import { useFormState, useFormStatus } from "react-dom";
import { loginAdmin } from "@/app/admin/actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-maroon-700 px-4 py-3 font-semibold text-white hover:bg-maroon-800 disabled:opacity-60"
    >
      {pending ? "Checking..." : "Login"}
    </button>
  );
}

export default function OwnerLoginForm() {
  const [state, action] = useFormState(loginAdmin, { error: "" });

  return (
    <form action={action} className="rounded-2xl border border-gold-200 bg-white p-5 shadow-sm">
      <h2 className="font-display text-lg font-bold text-maroon-800">Owner login</h2>
      <p className="mt-1 text-sm text-maroon-700/70">Menu edit karne ke liye PIN daalo.</p>
      <label className="mt-4 block text-sm font-medium text-maroon-800">
        PIN
        <input
          name="pin"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          required
          className="mt-1 w-full rounded-xl border border-gold-200 px-3 py-2.5 outline-none focus:border-maroon-500"
        />
      </label>
      {state?.error ? <p className="mt-3 text-sm text-red-700">{state.error}</p> : null}
      <div className="mt-4">
        <Submit />
      </div>
    </form>
  );
}
