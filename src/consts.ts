// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE_TITLE = "Drew's Blog";
export const SITE_DESCRIPTION = 'Welcome to my Blog!';

export const NAV: { href: string; label: string }[] = [
	{ href: '/', label: 'Home' },
	{ href: '/blog/', label: 'Posts' },
	{ href: '/about/', label: 'About' },
];

export const SOCIALS: { label: string; url: string }[] = [
	{ label: 'GitHub', url: 'https://github.com/0xPolar' },
	{ label: 'RSS', url: '/rss.xml' },
];
