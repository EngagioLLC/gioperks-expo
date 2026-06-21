import type { UserProfile } from '@/types/user-profile';

export function getDisplayName(
  email: string | undefined,
  metadata: Record<string, unknown> | undefined,
  apiDisplayName: string | null | undefined,
): string {
  if (apiDisplayName?.trim()) {
    const first = apiDisplayName.trim().split(' ')[0];
    return first ?? apiDisplayName.trim();
  }
  const fullName = metadata?.full_name ?? metadata?.name;
  if (typeof fullName === 'string' && fullName.trim()) {
    return fullName.trim().split(' ')[0] ?? fullName.trim();
  }
  if (email) {
    const local = email.split('@')[0] ?? 'there';
    return local.charAt(0).toUpperCase() + local.slice(1);
  }
  return 'Player';
}

export function getFullDisplayName(
  email: string | undefined,
  metadata: Record<string, unknown> | undefined,
  profile: UserProfile | null | undefined,
): string {
  if (profile?.display_name?.trim()) {
    return profile.display_name.trim();
  }
  const fullName = metadata?.full_name ?? metadata?.name;
  if (typeof fullName === 'string' && fullName.trim()) {
    return fullName.trim();
  }
  if (email) {
    const local = email.split('@')[0] ?? 'Player';
    return local
      .split(/[._-]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
  return 'Player';
}

export function getAvatarUrl(
  profile: UserProfile | null | undefined,
  metadata: Record<string, unknown> | undefined,
): string | null {
  if (profile?.avatar_url?.trim()) {
    return profile.avatar_url.trim();
  }
  const fromMeta = metadata?.avatar_url ?? metadata?.picture;
  if (typeof fromMeta === 'string' && fromMeta.trim()) {
    return fromMeta.trim();
  }
  return null;
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  if (parts.length === 1) {
    return parts[0]!.charAt(0).toUpperCase();
  }
  return `${parts[0]!.charAt(0)}${parts[parts.length - 1]!.charAt(0)}`.toUpperCase();
}
