export interface Book {
  series_id: number;
  chapter_id: number;
  volume_id: number;
  library_id: number;
  title: string;
  series_name: string;
  authors?: string[];
  thumbnail: string;
  pages: number;
  pages_read: number;
  progress_pct: number;
  last_read_utc: string;
  release_date: string;
  language?: string;
}
