import { redirect } from "next/navigation";
import AdminCategoryVisibility from "@/app/admin/AdminCategoryVisibility";
import { isAdminSession } from "@/lib/adminAuth";
import { loadStoreVisibility } from "@/lib/storeVisibility";

export const metadata = {
  title: "Categories | Jallundhar Sweets & Bakers",
};

export const dynamic = "force-dynamic";

export default async function AccountCategoriesPage() {
  if (!(await isAdminSession())) {
    redirect("/account");
  }

  const visibility = await loadStoreVisibility();
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <AdminCategoryVisibility visibility={visibility} />
    </section>
  );
}
