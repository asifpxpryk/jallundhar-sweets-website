import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { bucketFileName, isBucketFileName, smallPhotoRouteSrc, smallPhotoSrc } from "@/lib/smallPhoto";

const BUCKET = "https://shop.supabase.co/storage/v1/object/public/product-photos/";

describe("small copies of product photos", () => {
  test("a bucket photo is shown from its small copy", () => {
    assert.equal(smallPhotoSrc(`${BUCKET}pos-prd-cp-782-1795295402231.webp`), "/small-photo/p/pos-prd-cp-782-1795295402231.webp.webp");
    assert.equal(smallPhotoSrc(`${BUCKET}fb-12.jpg?v=3`), "/small-photo/p/fb-12.jpg.webp");
    assert.equal(smallPhotoRouteSrc(`${BUCKET}fb-12.jpg?v=3`), "/api/small-photo/fb-12.jpg");
  });

  test("any other photo keeps its own address", () => {
    const others = [
      "/products/4736.webp",
      "",
      "blob:https://x/1",
      "https://elsewhere.example/a.jpg",
      `${BUCKET}folder/a.webp`,
      `${BUCKET}..%2Fsecret`,
      "http://shop.supabase.co/storage/v1/object/public/product-photos/a.webp",
    ];
    for (const src of others) {
      assert.equal(smallPhotoSrc(src), src, src);
      assert.equal(smallPhotoRouteSrc(src), src, src);
    }
    assert.equal(bucketFileName(null), null);
    assert.equal(bucketFileName(`${BUCKET}%E0%A4%A`), null);
  });

  test("only a plain file name is taken", () => {
    assert.equal(isBucketFileName("pos-wm-4736-1795199324374.webp"), true);
    for (const bad of ["", "a/b.webp", "..", "a..b", ".hidden", "a b.webp", "a%2Fb", "x".repeat(201)]) {
      assert.equal(isBucketFileName(bad), false, bad);
    }
  });
});
