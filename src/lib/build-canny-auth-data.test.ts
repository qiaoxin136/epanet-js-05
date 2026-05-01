import { expect, describe, it } from "vitest";
import { buildCannyAuthData } from "./build-canny-auth-data";
import { CognitoAdminUser } from "./cognito-admin";

const createMockUser = (overrides: Partial<CognitoAdminUser> = {}): CognitoAdminUser => {
  return {
    id: "2abcdefghijklmnopqrstuvwxyz",
    email: "test@example.com",
    firstName: null,
    lastName: null,
    userPlan: "free",
    trialActivatedAt: null,
    trialEndsAt: null,
    hasUsedTrial: false,
    ...overrides,
  };
};

describe("buildCannyAuthData", () => {
  it("uses firstName when only firstName provided", () => {
    const user = createMockUser({ firstName: "John" });
    const result = buildCannyAuthData(user);

    expect(result.name).toBe("John");
    expect(result.id).toBe(user.id);
    expect(result.email).toBe("test@example.com");
  });

  it("uses firstName and first letter of lastName when both provided", () => {
    const user = createMockUser({ firstName: "John", lastName: "Doe" });
    const result = buildCannyAuthData(user);

    expect(result.name).toBe("John D.");
  });

  it("handles multi-character lastName correctly", () => {
    const user = createMockUser({ firstName: "Jane", lastName: "Smith" });
    const result = buildCannyAuthData(user);

    expect(result.name).toBe("Jane S.");
  });

  it("uses fallback format when no firstName or lastName", () => {
    const user = createMockUser({ id: "2abcdefghijklmnopqrstuvwxyz" });
    const result = buildCannyAuthData(user);

    expect(result.name).toBe("epanet-js 2abcde");
  });

  it("trims whitespace from firstName", () => {
    const user = createMockUser({ firstName: "  John  " });
    const result = buildCannyAuthData(user);

    expect(result.name).toBe("John");
  });

  it("trims whitespace from lastName", () => {
    const user = createMockUser({ firstName: "John", lastName: "  Doe  " });
    const result = buildCannyAuthData(user);

    expect(result.name).toBe("John D.");
  });

  it("handles empty firstName as no firstName", () => {
    const user = createMockUser({
      firstName: "   ",
      lastName: "Doe",
      id: "2abcdefghijklmnopqrstuvwxyz",
    });
    const result = buildCannyAuthData(user);

    expect(result.name).toBe("epanet-js 2abcde");
  });

  it("handles empty lastName correctly", () => {
    const user = createMockUser({ firstName: "John", lastName: "   " });
    const result = buildCannyAuthData(user);

    expect(result.name).toBe("John");
  });
});
