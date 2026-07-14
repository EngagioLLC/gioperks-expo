export type PointsWallet = {
  current_balance: number;
  reserved_balance: number;
  available_balance: number;
  lifetime_earned: number;
  lifetime_spent: number;
  lifetime_expired: number;
  /** Daily earning fields (UTC). Optional for older API responses. */
  today_earned?: number;
  arcade_earned_today?: number;
  login_streak_earned_today?: number;
  daily_total_cap?: number;
  daily_arcade_cap?: number;
  daily_login_streak_cap?: number;
  arcade_remaining_today?: number;
  login_streak_remaining_today?: number;
  total_remaining_today?: number;
};

export type LoginStreakClaim = {
  points_awarded: number;
  current_streak: number;
  cycle_day: number;
  current_balance: number;
  available_balance: number;
  transaction_id: string;
};

export type ArcadeAward = {
  points_awarded: number;
  points_requested: number;
  capped: boolean;
  current_balance: number;
  available_balance: number;
  arcade_earned_today: number;
  arcade_remaining_today: number;
  total_remaining_today: number;
  transaction_id: string | null;
};
