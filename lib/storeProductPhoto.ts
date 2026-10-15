import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

const BUCKET = "product-photos";
/** Browser/CDN cache lifetime for product photos (24 hours). File names are unique per upload. */
const PHOTO_CACHE_SECONDS = "86400";

function photoFromForm(formData: FormData): File | null {
  const photo = formData.get("photo");
  if (!(photo instanceof File) || photo.size === 0) return null;
  return photo;
}

export async function storeProductPhoto(
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  const file = photoFromForm(formData);
  if (!file) return {};

  if (file.size > 8 * 1024 * 1024) {
    return { error: "Photo must be under 8MB." };
  }
  const type = file.type || "image/jpeg";
  if (!type.startsWith("image/")) {
    return { error: "Please upload a photo." };
  }

  const supabase = createSupabaseAdmin();
  await supabase.storage.createBucket(BUCKET, { public: true });
  await supabase.storage.updateBucket(BUCKET, { public: true });

  const ext = type.includes("png") ? "png" : type.includes("webp") ? "webp" : "jpg";
  const newPath = () => `${Date.now()}-${crypto.randomUUID()}.${ext}`;
  let path = newPath();
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: type,
    cacheControl: PHOTO_CACHE_SECONDS,
    upsert: false,
  });

  if (error) {
    if (/already exists|duplicate/i.test(error.message)) {
      // Never overwrite an existing photo: retry once under a fresh unique name.
      path = newPath();
      const retry = await supabase.storage.from(BUCKET).upload(path, buffer, {
        contentType: type,
        cacheControl: PHOTO_CACHE_SECONDS,
        upsert: false,
      });
      if (retry.error) return { error: retry.error.message };
    } else if (/bucket/i.test(error.message) && /not found|not exist/i.test(error.message)) {
      return {
        error:
          "Photo bucket is missing. Run data/product-photos.sql in the Supabase SQL Editor, then try again.",
      };
    } else {
      return { error: error.message };
    }
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
}
