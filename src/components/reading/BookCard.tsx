import type { Book } from './types';

function getAuthor(book: Book): string {
  if (book.authors && book.authors.length > 0) {
    const meaningful = book.authors.filter(a => !/^\d{4}(-\d{4})?$/.test(a));
    if (meaningful.length > 0) return [...meaningful].reverse().join(' ');
  }
  return book.series_name;
}

function cleanTitle(title: string): string {
  return title
    .replace(/_+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s*\(\d{4}\)\s*$/, '')
    .trim();
}

interface Props {
  book: Book;
  onClick: () => void;
  showReadingProgress?: boolean;
}

export default function BookCard({ book, onClick, showReadingProgress = false }: Props) {
  const author = getAuthor(book);
  const title = cleanTitle(book.title);

  return (
    <button
      onClick={onClick}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        textAlign: 'left',
        flexShrink: 0,
        width: '140px',
      }}
    >
      <div
        style={{
          position: 'relative',
          aspectRatio: '2 / 3',
          overflow: 'hidden',
          borderRadius: '6px',
          border: '1px solid var(--border)',
        }}
      >
        <img
          src={book.thumbnail}
          alt={title}
          loading="lazy"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            transition: 'transform 0.2s ease',
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLImageElement).style.transform = 'scale(1.04)')}
          onMouseLeave={e => ((e.currentTarget as HTMLImageElement).style.transform = 'scale(1)')}
        />
        {showReadingProgress && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: 'rgba(128,128,128,0.35)',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${book.progress_pct}%`,
                background: '#3b82f6',
              }}
            />
          </div>
        )}
      </div>
      <div style={{ marginTop: '8px' }}>
        <p
          style={{
            color: 'var(--primary)',
            fontSize: '13px',
            fontWeight: 500,
            lineHeight: 1.4,
            margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {title}
        </p>
        <p
          style={{
            color: 'var(--secondary)',
            fontSize: '12px',
            margin: '4px 0 0',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {author}
        </p>
      </div>
    </button>
  );
}
