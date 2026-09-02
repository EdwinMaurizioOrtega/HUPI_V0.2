export function isImageDocument(fileName?: string, mimeType?: string) {
  return Boolean(mimeType?.startsWith('image/') || fileName?.match(/\.(png|jpe?g|webp|heic)$/i));
}
