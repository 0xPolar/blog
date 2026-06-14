function escapeHtml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;');
}

function slugify(value: string): string {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, '')
		.trim()
		.replace(/\s+/g, '-');
}

function renderInline(value: string): string {
	return value
		.split('`')
		.map((part, index) =>
			index % 2 === 0 ? escapeHtml(part) : `<code>${escapeHtml(part)}</code>`,
		)
		.join('');
}

export function renderProjectMarkdown(markdown: string): string {
	const lines = markdown.replace(/\r\n/g, '\n').trim().split('\n');
	const html: string[] = [];
	let paragraph: string[] = [];
	let inList = false;

	const closeParagraph = () => {
		if (paragraph.length === 0) return;
		html.push(`<p>${renderInline(paragraph.join(' '))}</p>`);
		paragraph = [];
	};

	const closeList = () => {
		if (!inList) return;
		html.push('</ul>');
		inList = false;
	};

	for (const line of lines) {
		const trimmed = line.trim();

		if (!trimmed) {
			closeParagraph();
			closeList();
			continue;
		}

		if (trimmed.startsWith('## ')) {
			closeParagraph();
			closeList();
			const text = trimmed.slice(3);
			html.push(`<h2 id="${slugify(text)}">${renderInline(text)}</h2>`);
			continue;
		}

		if (trimmed.startsWith('- ')) {
			closeParagraph();
			if (!inList) {
				html.push('<ul>');
				inList = true;
			}
			html.push(`<li>${renderInline(trimmed.slice(2))}</li>`);
			continue;
		}

		closeList();
		paragraph.push(trimmed);
	}

	closeParagraph();
	closeList();

	return html.join('\n');
}
