import type { UserRoleType, Permission } from '../types';

/**
 * Permission Matrix
 * Defines which permissions each role has
 */
export const ROLE_PERMISSIONS: Record<UserRoleType, Permission[]> = {
  viewer: [
    'read_dashboard',
    'read_evaluations',
    'read_children',
  ],
  staff: [
    'read_dashboard',
    'read_evaluations',
    'read_children',
    'create_evaluation',
  ],
  moderator: [
    'read_dashboard',
    'read_evaluations',
    'read_children',
    'create_evaluation',
    'update_evaluation',
    'approve_evaluation',
    'manage_children',
  ],
  admin: [
    'read_dashboard',
    'read_evaluations',
    'read_children',
    'create_evaluation',
    'update_evaluation',
    'delete_evaluation',
    'approve_evaluation',
    'manage_children',
    'manage_settings',
    'view_audit_logs',
  ],
  superadmin: [
    'read_dashboard',
    'read_evaluations',
    'read_children',
    'create_evaluation',
    'update_evaluation',
    'delete_evaluation',
    'approve_evaluation',
    'manage_children',
    'manage_settings',
    'manage_users',
    'view_audit_logs',
    'manage_backups',
  ],
};

/**
 * Role Display Information
 */
export const ROLE_INFO: Record<UserRoleType, { label: string; emoji: string; description: string; color: string }> = {
  viewer: {
    label: 'İzleyici',
    emoji: '👁️',
    description: 'Sadece görüntüleyebilir',
    color: 'gray',
  },
  staff: {
    label: 'Personel',
    emoji: '👤',
    description: 'Yeni değerlendirme yapabilir',
    color: 'blue',
  },
  moderator: {
    label: 'Moderatör',
    emoji: '⚖️',
    description: 'Değerlendirmeleri onaylayabilir',
    color: 'purple',
  },
  admin: {
    label: 'Yönetici',
    emoji: '🔑',
    description: 'Sistem ayarlarını yönetebilir',
    color: 'emerald',
  },
  superadmin: {
    label: 'Süper Yönetici',
    emoji: '👑',
    description: 'Tüm yetkiler',
    color: 'amber',
  },
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRoleType | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: UserRoleType | undefined, permissions: Permission[]): boolean {
  if (!role) return false;
  return permissions.some(p => hasPermission(role, p));
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role: UserRoleType | undefined, permissions: Permission[]): boolean {
  if (!role) return false;
  return permissions.every(p => hasPermission(role, p));
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: UserRoleType): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if role A can manage role B (for role assignment)
 * SuperAdmin can manage all roles
 * Admin can manage staff and moderator
 * Others cannot manage roles
 */
export function canManageRole(userRole: UserRoleType | undefined, targetRole: UserRoleType): boolean {
  if (!userRole) return false;

  if (userRole === 'superadmin') return true;
  if (userRole === 'admin' && ['staff', 'moderator', 'viewer'].includes(targetRole)) return true;

  return false;
}

/**
 * Get available roles that a user can assign
 */
export function getAssignableRoles(userRole: UserRoleType | undefined): UserRoleType[] {
  if (!userRole) return [];

  if (userRole === 'superadmin') {
    return ['viewer', 'staff', 'moderator', 'admin', 'superadmin'];
  }

  if (userRole === 'admin') {
    return ['viewer', 'staff', 'moderator'];
  }

  return [];
}

/**
 * Check if user is admin or higher
 */
export function isAdmin(role: UserRoleType | undefined): boolean {
  if (!role) return false;
  return ['admin', 'superadmin'].includes(role);
}

/**
 * Check if user is superadmin
 */
export function isSuperAdmin(role: UserRoleType | undefined): boolean {
  return role === 'superadmin';
}

/**
 * Get role hierarchy level (higher number = more permissions)
 */
export function getRoleLevel(role: UserRoleType): number {
  const levels: Record<UserRoleType, number> = {
    viewer: 1,
    staff: 2,
    moderator: 3,
    admin: 4,
    superadmin: 5,
  };
  return levels[role] || 0;
}

/**
 * Compare two roles (returns true if role1 has more permissions than role2)
 */
export function isHigherRole(role1: UserRoleType, role2: UserRoleType): boolean {
  return getRoleLevel(role1) > getRoleLevel(role2);
}
