import { redirect } from "next/navigation";
import AdminBannerPlacement from "@/app/admin/AdminBannerPlacement";
import { isAdminSession } from "@/lib/adminAuth";
import { bannerOptions, bannerPageOptions } from "@/lib/bannerCatalog";
import { loadStoreVisibility } from "@/lib/storeVisibility";
import { DEFAULT_SHOP_EXTERIOR_TEXT } from "@/lib/shopExteriorBanner";

export const metadata = { title: "Banners | Jallundhar Sweets & Bakers" };
export const dynamic = "force-dynamic";

export default async function AccountBannersPage() {
  if (!(await isAdminSession())) redirect("/account");

  const visibility = await loadStoreVisibility();
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <AdminBannerPlacement
        banners={bannerOptions(visibility)}
        pageOptions={bannerPageOptions(visibility)}
        bannerPages={visibility.bannerPages}
        shopExteriorText={visibility.shopExteriorText ?? DEFAULT_SHOP_EXTERIOR_TEXT}
      />
    </section>
  );
}
