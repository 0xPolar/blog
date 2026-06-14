import type { ImageMetadata } from 'astro';

const projectImages = import.meta.glob<{ default: ImageMetadata }>(
	'../assets/projects/*.{png,jpg,jpeg,webp,avif}',
	{ eager: true },
);

const imageByName = new Map(
	Object.entries(projectImages).map(([path, image]) => [
		path.split('/').at(-1),
		image.default,
	]),
);

export function resolveProjectImage(imageName: string): ImageMetadata {
	const image = imageByName.get(imageName);

	if (!image) {
		throw new Error(`Unknown project image: ${imageName}`);
	}

	return image;
}
