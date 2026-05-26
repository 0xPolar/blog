'use client';

import { useEffect } from 'react';
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
  onClose: () => void;
  showReadingProgress?: boolean;
}

export default function BookModal({ book, onClose, showReadingProgress = false }: Props) {
  const author = getAuthor(book);
  const title = cleanTitle(book.title);
  const lastRead = new Date(book.last_read_utc).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const hasRelease = !book.release_date.startsWith('0001');
  const releaseYear = hasRelease ? new Date(book.release_date).getFullYear() : null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(2px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative',
          maxWidth: '440px',
          width: '100%',
          borderRadius: '10px',
          padding: '20px',
          display: 'flex',
          gap: '16px',
          background: 'var(--entry)',
          border: '1px solid var(--border)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: '10px',
            right: '14px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '20px',
            lineHeight: 1,
            color: 'var(--secondary)',
            padding: '2px 4px',
          }}
        >
          ×
        </button>

        <div
          style={{
            flexShrink: 0,
            width: '96px',
            aspectRatio: '2 / 3',
            borderRadius: '6px',
            overflow: 'hidden',
            border: '1px solid var(--border)',
          }}
        >
          <img
            src={book.thumbnail}
            alt={title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            style={{
              color: 'var(--primary)',
              fontSize: '15px',
              fontWeight: 600,
              lineHeight: 1.4,
              margin: '0 0 4px',
            }}
          >
            {title}
          </h3>
          <p style={{ color: 'var(--secondary)', fontSize: '13px', margin: '0 0 14px' }}>
            {author}
            {releaseYear && <span style={{ marginLeft: '6px', opacity: 0.7 }}>· {releaseYear}</span>}
          </p>

          {showReadingProgress && (
            <div style={{ marginBottom: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  color: 'var(--secondary)',
                  marginBottom: '5px',
                }}
              >
                <span>
                  {book.pages_read} of {book.pages} pages
                </span>
                <span>{Math.round(book.progress_pct)}%</span>
              </div>
              <div
                style={{
                  height: '5px',
                  borderRadius: '99px',
                  overflow: 'hidden',
                  background: 'var(--tertiary)',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${book.progress_pct}%`,
                    borderRadius: '99px',
                    background: '#3b82f6',
                  }}
                />
              </div>
            </div>
          )}

          <p style={{ color: 'var(--secondary)', fontSize: '12px', margin: 0 }}>
            Last read {lastRead}
          </p>
        </div>
      </div>
    </div>
  );
}
