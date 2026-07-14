export type RewardReservation = {
  reservation_id: string;
  reservation_code: string;
  reward_id: string;
  points_reserved: number;
  status: string;
  expires_at: string;
};

export type RewardReservationList = {
  items: RewardReservation[];
};
