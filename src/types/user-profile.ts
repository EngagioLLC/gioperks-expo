export type UserProfile = {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  auth_provider: string | null;
  role: string;
  created_at: string;
  updated_at: string;
};
