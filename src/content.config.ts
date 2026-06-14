import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			// Transform string to Date object
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: z.optional(image()),
		}),
});

const projectLinks = z
	.object({
		repo: z.string().url().optional(),
		demo: z.string().url().optional(),
		docs: z.string().url().optional(),
	})
	.refine((links) => links.repo || links.demo, {
		message: 'Projects must include at least one repo or demo link.',
	});

const projects = defineCollection({
	loader: glob({ base: './src/content/projects', pattern: '**/*.{md,mdx}' }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			startedDate: z.coerce.date().optional(),
			completedDate: z.coerce.date().optional(),
			status: z.enum(['planned', 'in-progress', 'shipped', 'archived']),
			role: z.string(),
			stack: z.array(z.string()).min(1),
			featured: z.boolean(),
			heroImage: image(),
			screenshots: z
				.array(
					z.object({
						image: image(),
						alt: z.string().min(1),
						caption: z.string().optional(),
					}),
				)
				.min(1),
			links: projectLinks,
		}),
});

export const collections = { blog, projects };
