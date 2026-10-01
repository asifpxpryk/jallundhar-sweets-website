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
  const punched = knockOutEdgeBlack(ctx, width, height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, punched ? "image/png" : "image/jpeg", punched ? undefined : 0.82)
  );
  if (!blob) return file;
  return punched
    ? new File([blob], "photo.png", { type: "image/png" })
    : new File([blob], "photo.jpg", { type: "image/jpeg" });
}

function knockOutEdgeBlack(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const image = ctx.getImageData(0, 0, width, height);
  const data = image.data;
  const seen = new Uint8Array(width * height);
  const stack = new Int32Array(width * height);
  let top = 0;

  const dark = (pixel: number) => {
    const index = pixel * 4;
    return data[index] < 36 && data[index + 1] < 36 && data[index + 2] < 36 && data[index + 3] > 0;
  };
  const push = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const pixel = y * width + x;
    if (seen[pixel] || !dark(pixel)) return;
    seen[pixel] = 1;
    stack[top] = pixel;
    top += 1;
  };

  for (let x = 0; x < width; x += 1) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    push(0, y);
    push(width - 1, y);
  }
  if (!top) return false;

  while (top) {
    top -= 1;
    const pixel = stack[top];
    const x = pixel % width;
    const y = (pixel - x) / width;
    data[pixel * 4 + 3] = 0;
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }

  ctx.putImageData(image, 0, 0);
  return true;
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
