/** Fallback daily GioPoints cap when wallet payload is unavailable. */
export const DAILY_EARNING_CAP = 250;
export const DAILY_ARCADE_CAP = 200;
export const DAILY_LOGIN_STREAK_CAP = 50;

export type MockGame = {
  id: string;
  title: string;
  genre: string;
  color: string;
};

export type MockReward = {
  id: string;
  title: string;
  merchant: string;
  pointsCost: number;
  category: 'discounts' | 'products' | 'experiences';
  color: string;
};

export const DASHBOARD_MOCK = {
  points: 2450,
  featuredGames: [
    { id: '1', title: 'Fruit Blast', genre: 'Puzzle', color: '#FF6B6B' },
    { id: '2', title: 'Space Runner', genre: 'Arcade', color: '#4ECDC4' },
    { id: '3', title: 'Trivia Masters', genre: 'Trivia', color: '#9B59B6' },
  ],
  nearbyOffers: [
    {
      id: '1',
      title: '10% OFF Any Drink',
      merchant: 'Coffee Corner',
      color: '#8B4513',
    },
  ],
  badgesEarned: 12,
} as const;

export const GAMES_MOCK: MockGame[] = [
  { id: '1', title: 'Fruit Blast', genre: 'Puzzle', color: '#FF6B6B' },
  { id: '2', title: 'Space Runner', genre: 'Arcade', color: '#4ECDC4' },
  { id: '3', title: 'Trivia Masters', genre: 'Trivia', color: '#9B59B6' },
  { id: '4', title: 'Bubble Pop', genre: 'Casual', color: '#3498DB' },
  { id: '5', title: 'Word Connect', genre: 'Word', color: '#E67E22' },
];

export const REWARDS_MOCK: MockReward[] = [
  {
    id: '1',
    title: '10% OFF Any Drink',
    merchant: 'Coffee Corner',
    pointsCost: 1000,
    category: 'discounts',
    color: '#8B4513',
  },
  {
    id: '2',
    title: 'Free Fries',
    merchant: 'Burger Barn',
    pointsCost: 1500,
    category: 'products',
    color: '#D35400',
  },
  {
    id: '3',
    title: 'Movie Ticket',
    merchant: 'Cineplex',
    pointsCost: 3000,
    category: 'experiences',
    color: '#8E44AD',
  },
  {
    id: '4',
    title: '20% OFF Entree',
    merchant: 'Pasta Palace',
    pointsCost: 2000,
    category: 'discounts',
    color: '#C0392B',
  },
];

export const FRUIT_BLAST_MOCK = {
  score: 12540,
  moves: 18,
  points: 150,
  level: 12,
  levelProgress: 0.65,
  starsEarned: 2,
  grid: [
    ['🍇', '🍊', '🍎', '🍇', '🍊', '🍎'],
    ['🍎', '🍇', '🍊', '🍎', '🍇', '🍊'],
    ['🍊', '🍎', '🍇', '🍊', '🍎', '🍇'],
    ['🍇', '🍊', '🍎', '🍇', '🍊', '🍎'],
    ['🍎', '🍇', '🍊', '🍎', '🍇', '🍊'],
    ['🍊', '🍎', '🍇', '🍊', '🍎', '🍇'],
    ['🍇', '🍊', '🍎', '🍇', '🍊', '🍎'],
    ['🍎', '🍇', '🍊', '🍎', '🍇', '🍊'],
  ] as const,
};
