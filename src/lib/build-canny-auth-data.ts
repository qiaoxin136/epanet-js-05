import { CognitoAdminUser } from "./cognito-admin";

export type CannyUserData = {
  avatarURL: string;
  email: string | undefined;
  id: string;
  name: string;
};

export const buildCannyAuthData = (user: CognitoAdminUser): CannyUserData => {
  return {
    avatarURL: "",
    email: user.email,
    id: user.id,
    name: buildUserName(user),
  };
};

const buildUserName = (user: CognitoAdminUser): string => {
  const firstName = user.firstName?.trim();
  const lastName = user.lastName?.trim();

  if (firstName && lastName) {
    return `${firstName} ${lastName.charAt(0)}.`;
  }

  if (firstName) {
    return firstName;
  }

  return `epanet-js ${user.id.slice(0, 6)}`;
};
