export interface Photo {
  id: string;
  filename: string;
  score?: number;
  review?: string;
  url: string;
  uploaded_at: string;
  engine?: string;
}

export interface ScoreResult {
  id: string;
  score: number;
  review: string;
  engine?: string;
}

export type Tab = 'upload' | 'gallery' | 'leaderboard';
