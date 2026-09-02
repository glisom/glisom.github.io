import type { ImageMetadata } from 'astro';
import evidenceMap from '../../design-reference/vite-homepage/public/assets/evidence-map.png';

const localImages = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/**/*.{png,jpg,jpeg,webp,avif}',
  { eager: true },
);

const approvedEvidenceAliases: Readonly<Record<string, ImageMetadata>> = {
  'evidence/evidence-map.png': evidenceMap,
};

export function resolveLocalImage(src: string): ImageMetadata {
  const image =
    localImages[`/src/assets/${src}`]?.default ?? approvedEvidenceAliases[src];
  if (!image) {
    throw new Error(`Local image asset not found: ${src}`);
  }
  return image;
}
