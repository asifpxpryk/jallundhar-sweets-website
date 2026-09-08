import AdminPanel from "@/app/admin/AdminPanel";
import AccountScreen from "@/components/AccountScreen";
import { isAdminSession } from "@/lib/adminAuth";
import { hasSupabaseSecret } from "@/lib/supabaseAdmin";
import { loadAllMenuItems } from "@/lib/loadMenu";
import { loadAdminOrders } from "@/app/admin/actions";

export const metadata = {
  title: "Account | Jallundhar Sweets & Bakers",
};

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const owner = await isAdminSession();
  if (owner) {
    const [items, orders] = await Promise.all([loadAllMenuItems(), loadAdminOrders()]);
    return (
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <AdminPanel items={items} orders={orders} needsSecret={!hasSupabaseSecret()} />
      </section>
    );
  }

  return <AccountScreen />;
}
