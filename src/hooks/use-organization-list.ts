// Cognito has no built-in organization concept. This stub mirrors the shape
// of Clerk's useOrganizationList return value so the rest of the codebase
// compiles without modification.

export const useOrganizationList = (_opts?: unknown) => ({
  userMemberships: { count: 0, data: [] as unknown[] },
});
