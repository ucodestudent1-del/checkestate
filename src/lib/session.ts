import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function getSession() {
  const session = await auth();
  return session;
}

export async function getCurrentUser() {
  const session = await auth();
  return session?.user as any;
}

export async function requireOrganization() {
  const session = await auth();
  const user = session?.user as any;
  if (!user) {
    throw new Error("Unauthorized");
  }
  if (!user.organizationId) {
    throw new Error("No organization associated with user");
  }
  
  // Verify user is actually a member of the organization
  const membership = await db.organizationMember.findFirst({
    where: {
      userId: user.id,
      organizationId: user.organizationId,
      isActive: true,
    },
  });
  
  if (!membership) {
    throw new Error("User is not a member of this organization");
  }
  
  return {
    userId: user.id,
    organizationId: user.organizationId,
    role: user.role,
    organizationRole: membership.role,
    isOrganizationOwner: membership.isOwner,
  };
}

export async function requireRole(allowedRoles: string[]) {
  const ctx = await requireOrganization();
  if (!allowedRoles.includes(ctx.organizationRole) && !allowedRoles.includes(ctx.role)) {
    throw new Error("Forbidden: insufficient role");
  }
  return ctx;
}

export function isSuperAdmin(user: any) {
  return user?.role === "SUPER_ADMIN";
}

export function canAccessOrganization(user: any, organizationId: string) {
  if (isSuperAdmin(user)) return true;
  return user.organizationId === organizationId;
}
