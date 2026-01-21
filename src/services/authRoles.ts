import { UserData } from '@/src/lib/storage';

export const hasAdminRole = (user: UserData | null | undefined): boolean => {
  if (!user || !user.RoleMappings || !Array.isArray(user.RoleMappings)) {
    return false;
  }

  try {
    return user.RoleMappings.some((mapping: any) => {
      const role = mapping?.Role;
      const roleName = role?.RoleName ?? role?.roleName;
      const roleId = role?.RoleId ?? role?.roleId ?? mapping?.RoleId;

      return roleName === 'Admin' || roleId === 1;
    });
  } catch {
    return false;
  }
};




