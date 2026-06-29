export interface NewsItem {
  title: string;
  link: string;
  summary: string;
  publishedAt: string | null;
  source: string;
  category: string;
}

export interface NewsFeed {
  generatedAt: string;
  sources: string[];
  count: number;
  items: NewsItem[];
}
