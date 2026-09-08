import BackLink from "@/components/BackLink";
import OwnerLoginForm from "@/components/OwnerLoginForm";
import AdminPanel from "@/app/admin/AdminPanel";
import { isAdminPinConfigured, isAdminSession } from "@/lib/adminAuth";
import { hasSupabaseSecret } from "@/lib/supabaseAdmin";
import { loadAllMenuItems } from "@/lib/loadMenu";

export const metadata = {
  title: "Account | Jallundhar Sweets & Bakers",
};

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const owner = await isAdminSession();
  const items = owner ? await loadAllMenuItems() : [];

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex items-center gap-3">
        <h1 className="flex-1 font-display text-2xl font-bold text-maroon-800">Account</h1>
        <BackLink />
      </div>
      <p className="mt-2 text-sm text-maroon-700/70">
        Order ke liye call ya WhatsApp karein. Customer login zaroori nahi.
      </p>
      <div className="mt-6 space-y-3 rounded-2xl border border-gold-200 bg-white p-5">
        <p className="font-display font-semibold text-maroon-800">Jallundhar Sweets &amp; Bakers</p>
        <p className="text-sm text-maroon-700">Shahi Road, Rahim Yar Khan</p>
        <a href="tel:03001538440" className="block text-sm font-medium text-maroon-800">
          0300 153 8440
        </a>
        <a
          href="https://wa.me/923001538440"
          target="_blank"
          rel="noreferrer"
          className="inline-flex rounded-full bg-maroon-800 px-4 py-2 text-sm font-semibold text-white"
        >
          WhatsApp Order
        </a>
      </div>

      {owner ? (
        <div className="mt-8">
          <AdminPanel items={items} needsSecret={!hasSupabaseSecret()} />
        </div>
      ) : (
        <div className="mt-8 max-w-sm">
          {isAdminPinConfigured() ? (
            <OwnerLoginForm />
          ) : (
            <p className="rounded-2xl border border-gold-200 bg-white p-5 text-sm text-maroon-800">
              Owner login ke liye <code className="font-mono">ADMIN_PIN</code> .env.local mein set karo.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
