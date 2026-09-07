import type { ImageMetadata } from 'astro';

const localImages = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/**/*.{png,jpg,jpeg,webp,avif}',
  { eager: true },
);

export function resolveLocalImage(src: string): ImageMetadata {
  const module = localImages[`/src/assets/${src}`];
  if (!module) {
    throw new Error(`Local image asset not found: ${src}`);
  }
  return module.default;
}
