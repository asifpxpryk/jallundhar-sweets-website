/**
 * Small copies of product photos for lists. A photo in the shop's own photo bucket is shown from
 * /small-photo/p/<file name>.webp. The build makes that copy and ships it as a plain file
 * (scripts/build-small-photos.mjs), so no server function runs for it. A photo added after the build
 * has no file yet: the image then asks /api/small-photo/<file name>, which makes the copy on request
 * (components/ProductImage.tsx). Any other photo (a file in /public, a blob, a foreign address) is
 * shown as it is.
 *
 * The files sit three folders deep on purpose: a two-part address with no file (/small-photo/x.webp)
 * would be answered by the /[section]/[aisle] page, a server render, instead of a plain 404.
 */

export const PHOTO_BUCKET_PATH = "/storage/v1/object/public/product-photos/";
export const SMALL_PHOTO_PATH = "/small-photo/p/";
export const SMALL_PHOTO_ROUTE = "/api/small-photo/";
/** Wide enough for a card on a phone at twice the pixel density. Keep scripts/build-small-photos.mjs equal. */
export const SMALL_PHOTO_WIDTH = 400;
export const SMALL_PHOTO_QUALITY = 72;

const FILE_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,199}$/;

/** A plain file name as the bucket holds it: no folders, nothing that could point elsewhere. */
export function isBucketFileName(name: string): boolean {
  return FILE_NAME.test(name) && !name.includes("..");
}

/** The file name of a photo kept in the product photo bucket, or null for any other address. */
export function bucketFileName(src: string | null | undefined): string | null {
  if (!src) return null;
  const at = src.indexOf(PHOTO_BUCKET_PATH);
  if (at < 0 || !/^https:\/\//.test(src)) return null;
  let name: string;
  try {
    name = decodeURIComponent(src.slice(at + PHOTO_BUCKET_PATH.length).split(/[?#]/)[0]);
  } catch {
    return null;
  }
  return isBucketFileName(name) ? name : null;
}

/** The address of the small copy of a bucket photo; any other photo keeps its own address. */
export function smallPhotoSrc(src: string): string {
  const name = bucketFileName(src);
  return name ? `${SMALL_PHOTO_PATH}${encodeURIComponent(name)}.webp` : src;
}

/** Where the small copy is made on request, for a bucket photo the build has not shipped as a file yet. */
export function smallPhotoRouteSrc(src: string): string {
  const name = bucketFileName(src);
  return name ? `${SMALL_PHOTO_ROUTE}${encodeURIComponent(name)}` : src;
}
