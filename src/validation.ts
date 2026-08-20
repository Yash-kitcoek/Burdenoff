import { GraphQLError } from "graphql";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function requireNonEmpty(value: string, field: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw badInput(`${field} must not be empty`);
  }
  return trimmed;
}

export function requireSlug(slug: string): string {
  if (!slugPattern.test(slug)) {
    throw badInput("slug must use lowercase letters, numbers, and single hyphens");
  }
  return slug;
}

export function requireTake(take: number): number {
  if (!Number.isInteger(take) || take < 1 || take > 100) {
    throw badInput("take must be an integer between 1 and 100");
  }
  return take;
}

export function badInput(message: string): GraphQLError {
  return new GraphQLError(message, { extensions: { code: "BAD_USER_INPUT" } });
}

export function notFound(resource: string): GraphQLError {
  return new GraphQLError(`${resource} was not found`, { extensions: { code: "NOT_FOUND" } });
}
