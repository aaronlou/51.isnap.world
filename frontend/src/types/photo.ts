export interface Photo {
  id: string;
  filename: string;
  score?: number;
  review?: string;
  url: string;
  thumbnail_url: string;
  uploaded_at: string;
  engine?: string;
  /** 是否为 Battle 模式上传（不收录到 Gallery） */
  is_battle?: boolean;
}

export interface ScoreResult {
  id: string;
  score: number;
  review: string;
  engine?: string;
  /** 是否达到画廊收录标准 */
  accepted?: boolean;
}

export interface BattleOpponent {
  opponent_url: string;
  opponent_title: string;
  opponent_photographer: string;
  opponent_photographer_link: string;
}

export interface BattleResult {
  user_photo_id: string;
  user_photo: Photo;
  user_score: number;
  user_review: string;
  opponent_photo_url: string;
  opponent_photo_title: string;
  opponent_photographer: string;
  opponent_photo_html_link: string;
  opponent_score: number;
  opponent_review: string;
  winner: string;
  comparison: string;
  engine: string;
}

export type Tab = 'upload' | 'gallery' | 'leaderboard' | 'battle';
