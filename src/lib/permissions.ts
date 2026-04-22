const ROLE_RANK = { officer: 1, executive: 2, admin: 3 } as const;

type Role = keyof typeof ROLE_RANK;

export function hasMinRole(userRole: string, required: Role): boolean {
  return (ROLE_RANK[userRole as Role] ?? 0) >= ROLE_RANK[required];
}
