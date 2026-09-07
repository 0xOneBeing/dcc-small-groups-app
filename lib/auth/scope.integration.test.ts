import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { buildFixtureHierarchy, cleanupFixtureHierarchy } from "@/test/fixtures";
import { resolveUserScope, scopeIncludesUnit, assertScopeIncludesUnit } from "./scope";

describe("scope isolation between sibling units (integration)", () => {
  let fixture: Awaited<ReturnType<typeof buildFixtureHierarchy>>;

  beforeAll(async () => {
    fixture = await buildFixtureHierarchy();
  });

  afterAll(async () => {
    await cleanupFixtureHierarchy(fixture.run);
    await prisma.$disconnect();
  });

  it("scopes Section Leader A to Section A's subtree only", async () => {
    const scope = await resolveUserScope(fixture.sectionLeaderA.id);

    expect(scope.subtreeUnitIds).toContain(fixture.sectionA.id);
    expect(scope.subtreeUnitIds).toContain(fixture.cellUnitA.id);

    expect(scope.subtreeUnitIds).not.toContain(fixture.sectionB.id);
    expect(scope.subtreeUnitIds).not.toContain(fixture.cellUnitB.id);
  });

  it("scopes Section Leader B to Section B's subtree only — the mirror image", async () => {
    const scope = await resolveUserScope(fixture.sectionLeaderB.id);

    expect(scope.subtreeUnitIds).toContain(fixture.sectionB.id);
    expect(scope.subtreeUnitIds).toContain(fixture.cellUnitB.id);

    expect(scope.subtreeUnitIds).not.toContain(fixture.sectionA.id);
    expect(scope.subtreeUnitIds).not.toContain(fixture.cellUnitA.id);
  });

  it("scopeIncludesUnit / assertScopeIncludesUnit enforce the same boundary a route handler relies on", async () => {
    const scopeA = await resolveUserScope(fixture.sectionLeaderA.id);

    expect(scopeIncludesUnit(scopeA, fixture.cellUnitA.id)).toBe(true);
    expect(scopeIncludesUnit(scopeA, fixture.cellUnitB.id)).toBe(false);

    expect(() => assertScopeIncludesUnit(scopeA, fixture.cellUnitA.id)).not.toThrow();
    expect(() => assertScopeIncludesUnit(scopeA, fixture.cellUnitB.id)).toThrow();
  });

  it("also isolates a Cell Leader to just their own cell, not their sibling's", async () => {
    const scope = await resolveUserScope(fixture.cellLeaderA.id);

    expect(scope.subtreeUnitIds).toContain(fixture.cellUnitA.id);
    expect(scope.subtreeUnitIds).not.toContain(fixture.cellUnitB.id);
    expect(scope.subtreeUnitIds).not.toContain(fixture.sectionB.id);
  });
});
