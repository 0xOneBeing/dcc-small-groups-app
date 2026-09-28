// Single source for the class-merging helper. `cn` is the shadcn team's
// drop-in replacement for clsx + tailwind-merge, and is what the shadcn CLI
// generates imports for; re-exported here so `@/lib/utils` and `"cn"` are the
// same implementation.
export { cn } from "cn";
