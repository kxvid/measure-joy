export const MAX_REPAIR_PHOTOS = 3;
export const MAX_REPAIR_PHOTO_BYTES = 2_000_000;
export const MAX_REPAIR_PHOTOS_BYTES = 3_000_000;
// Leave room for multipart framing while staying below Vercel's request limit.
export const MAX_REPAIR_REQUEST_BYTES = 3_200_000;

export function repairPhotoSelectionError(photos: readonly Pick<File, "size" | "type">[]) {
  if (photos.length > MAX_REPAIR_PHOTOS) return "Choose up to 3 photos.";
  if (photos.some((photo) => !["image/jpeg", "image/png"].includes(photo.type)))
    return "Use JPG or PNG photos. Other file types are not supported.";
  if (photos.some((photo) => photo.size === 0 || photo.size > MAX_REPAIR_PHOTO_BYTES))
    return "Each photo must be between 1 byte and 2 MB.";
  if (photos.reduce((sum, photo) => sum + photo.size, 0) > MAX_REPAIR_PHOTOS_BYTES)
    return "Keep all photos together under 3 MB.";
  return null;
}

// Inspect actual bytes: a browser-supplied MIME type or extension is not proof.
export function repairPhotoType(bytes: Uint8Array): "image/jpeg" | "image/png" | null {
  if (bytes.length >= 45 &&
      [137, 80, 78, 71, 13, 10, 26, 10].every((value, i) => bytes[i] === value) &&
      bytes[8] === 0 && bytes[9] === 0 && bytes[10] === 0 && bytes[11] === 13 &&
      bytes[12] === 73 && bytes[13] === 72 && bytes[14] === 68 && bytes[15] === 82 &&
      bytes[bytes.length - 12] === 0 && bytes[bytes.length - 11] === 0 &&
      bytes[bytes.length - 10] === 0 && bytes[bytes.length - 9] === 0 &&
      bytes[bytes.length - 8] === 73 && bytes[bytes.length - 7] === 69 &&
      bytes[bytes.length - 6] === 78 && bytes[bytes.length - 5] === 68) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const width = view.getUint32(16), height = view.getUint32(20);
    if (width > 0 && height > 0 && width * height <= 40_000_000) return "image/png";
  }
  if (bytes.length >= 4 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 &&
      bytes[bytes.length - 2] === 255 && bytes[bytes.length - 1] === 217) {
    let offset = 2;
    while (offset + 3 < bytes.length) {
      if (bytes[offset] !== 255) return null;
      while (bytes[offset] === 255) offset++;
      const marker = bytes[offset++];
      if (marker === 218 || marker === 217) return null;
      const length = bytes[offset] * 256 + bytes[offset + 1];
      if (length < 2 || offset + length > bytes.length) return null;
      if ([192, 193, 194].includes(marker) && length >= 8) {
        const height = bytes[offset + 3] * 256 + bytes[offset + 4];
        const width = bytes[offset + 5] * 256 + bytes[offset + 6];
        return width > 0 && height > 0 && width * height <= 40_000_000 ? "image/jpeg" : null;
      }
      offset += length;
    }
  }
  return null;
}
