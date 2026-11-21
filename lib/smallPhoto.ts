/**
 * Small copies of product photos for lists. A photo in the shop's own photo bucket is served through
 * /api/small-photo/<file name>, which makes a copy this wide and lets the CDN keep it; any other photo
 * (a file in /public, a blob, a foreign address) is shown as it is.
 */

export const PHOTO_BUCKET_PATH = "/storage/v1/object/public/product-photos/";
export const SMALL_PHOTO_PATH = "/api/small-photo/";
/** Wide enough for a card on a phone at twice the pixel density. */
export const SMALL_PHOTO_WIDTH = 400;

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
  return name ? `${SMALL_PHOTO_PATH}${encodeURIComponent(name)}` : src;
}
