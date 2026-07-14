export type UserStreak = {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  week_days: string[];
  week_active: boolean[];
};
