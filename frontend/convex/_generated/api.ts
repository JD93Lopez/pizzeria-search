/* eslint-disable */
/**
 * Convex API reference for the frontend (monorepo pattern).
 *
 * In a monorepo where the frontend and backend are separate packages,
 * Convex cannot auto-generate strongly-typed API references for the frontend
 * directly. Instead, we use `anyApi` as a type-safe-enough proxy that lets
 * `useQuery`, `useMutation`, and `useAction` resolve function references at
 * runtime via Convex's path-based routing.
 *
 * Type declarations live in backend/convex/_generated/api.d.ts.
 * The canonical generated file is only present in the backend package.
 *
 * @module
 */
import { anyApi, componentsGeneric } from "convex/server";

export const api = anyApi;
export const internal = anyApi;
export const components = componentsGeneric();
