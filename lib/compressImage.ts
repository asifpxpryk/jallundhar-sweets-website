export async function compressImage(file: File): Promise<File> {
  if (!file.size || !file.type.startsWith("image/")) return file;

  const bitmap = await createImageBitmap(file);
  const max = 1280;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.82)
  );
  if (!blob) return file;
  return new File([blob], "photo.jpg", { type: "image/jpeg" });
}

export async function withCompressedPhoto(formData: FormData) {
  const photo = formData.get("photo");
  if (!(photo instanceof File) || photo.size === 0) return formData;
  try {
    formData.set("photo", await compressImage(photo));
  } catch {
    // Keep the original file if the phone photo cannot be resized.
  }
  return formData;
}
