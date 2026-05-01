// Cognito has no built-in organization concept. This stub mirrors the shape
// of Clerk's useOrganization return value so the rest of the codebase compiles
// without modification. organization and membership are always null at runtime.

type OrgMembership = {
  role: string;
  [key: string]: unknown;
};

type OrgData = {
  id: string;
  name: string;
  imageUrl: string;
};

type OrgResult = {
  organization: OrgData | null;
  membership: OrgMembership | null;
};

export const useOrganization = (): OrgResult => ({
  organization: null,
  membership: null,
});
