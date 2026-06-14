"use client";

import { useEffect, useState } from "react";
import BookCard from "./BookCard";
import BookModal from "./BookModal";
import type { Book } from "./types";

interface Props {
  showReadingProgress?: boolean;
}

export default function BookShelf({ showReadingProgress = false }: Props) {
  const [books, setBooks] = useState<Book[]>([]);
  const [selected, setSelected] = useState<Book | null>(null);

  useEffect(() => {
    fetch("/books.json")
      .then((r) => r.json())
      .then(setBooks)
      .catch(() => {});
  }, []);

  if (books.length === 0) return null;

  return (
    <section style={{ marginTop: "32px" }}>
      <h2
        style={{
          color: "var(--primary)",
          fontSize: "18px",
          fontWeight: 700,
          margin: "0 0 16px",
          lineHeight: 1.2,
        }}
      >
        Reading
      </h2>
      <div
        style={{
          display: "flex",
          gap: "16px",
          overflowX: "auto",
          paddingBottom: "12px",
          scrollbarWidth: "thin",
          scrollbarColor: "var(--tertiary) transparent",
        }}
      >
        {books.map((book) => (
          <BookCard
            key={book.chapter_id}
            book={book}
            onClick={() => setSelected(book)}
            showReadingProgress={showReadingProgress}
          />
        ))}
      </div>
      {selected && (
        <BookModal
          book={selected}
          onClose={() => setSelected(null)}
          showReadingProgress={showReadingProgress}
        />
      )}
    </section>
  );
}
