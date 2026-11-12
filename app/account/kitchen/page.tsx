import { redirect } from "next/navigation";
import AdminKitchenEditor from "@/app/admin/AdminKitchenEditor";
import { isAdminSession } from "@/lib/adminAuth";
import { loadKitchenConfigUncached } from "@/lib/liveKitchenStore";

export const metadata = {
  title: "Live Kitchen | Jallundhar Sweets & Bakers",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AccountKitchenPage() {
  if (!(await isAdminSession())) redirect("/account");

  const config = await loadKitchenConfigUncached();
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <AdminKitchenEditor initial={config} />
    </section>
  );
}
