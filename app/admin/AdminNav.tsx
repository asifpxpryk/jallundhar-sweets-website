"use client";

import Link from "next/link";
import { logoutAdmin } from "./actions";

export default function AdminNav({
  active,
}: {
  active: "menu" | "categories";
}) {
  const tab =
    "rounded-xl px-3 py-2 text-sm font-medium";
  const on = `${tab} bg-maroon-700 text-white`;
  const off = `${tab} border border-gold-200 bg-white text-maroon-800`;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Link href="/account" className={active === "menu" ? on : off}>
          Manage menu
        </Link>
        <Link href="/account/categories" className={active === "categories" ? on : off}>
          Categories show / hide
        </Link>
      </div>
      <form action={logoutAdmin}>
        <button className="rounded-xl border border-gold-200 bg-white px-3 py-2 text-sm font-medium text-maroon-800">
          Logout
        </button>
      </form>
    </div>
  );
}
