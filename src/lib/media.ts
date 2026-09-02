import type { ImageMetadata } from 'astro';

const localImages = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/**/*.{png,jpg,jpeg,webp,avif}',
  { eager: true },
);

export function resolveLocalImage(assetKey: string): ImageMetadata {
  const module = localImages[`/src/assets/${assetKey}`];
  if (!module) {
    throw new Error(`Local image asset not found: ${assetKey}`);
  }
  return module.default;
}
