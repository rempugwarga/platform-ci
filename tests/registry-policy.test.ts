import { describe, expect, it } from '@rstest/core';
import { createValidator, loadRegistry, loadSchema } from '../src/registry';

const registry = loadRegistry();
const validate = createValidator(loadSchema());

describe('registry repos.yaml — schema', () => {
  it('valid terhadap repos.schema.json', () => {
    const valid = validate(registry);
    expect(validate.errors ?? []).toEqual([]);
    expect(valid).toBe(true);
  });
});

describe('registry repos.yaml — kepemilikan', () => {
  it('setiap repository memiliki tim pemilik yang terdaftar', () => {
    const slugs = registry.teams.map((team) => team.slug);
    for (const repo of registry.repositories) {
      expect(slugs).toContain(repo.team);
    }
  });

  it('nama repository unik', () => {
    const names = registry.repositories.map((repo) => repo.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('slug tim unik', () => {
    const slugs = registry.teams.map((team) => team.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('repository platform dimiliki tim bertipe platform', () => {
    const teamBySlug = new Map(registry.teams.map((team) => [team.slug, team]));
    for (const repo of registry.repositories) {
      if (repo.type === 'platform') {
        expect(teamBySlug.get(repo.team)?.type).toBe('platform');
      }
    }
  });

  it('repository stream-aligned dimiliki tim bertipe stream-aligned', () => {
    const teamBySlug = new Map(registry.teams.map((team) => [team.slug, team]));
    for (const repo of registry.repositories) {
      if (repo.type === 'stream-aligned') {
        expect(teamBySlug.get(repo.team)?.type).toBe('stream-aligned');
      }
    }
  });

  it('komponen kritis wajib memiliki deskripsi dan CI', () => {
    for (const repo of registry.repositories) {
      if (repo.criticality === 'critical') {
        expect(repo.ci).not.toBe('none');
        expect(repo.description.length).toBeGreaterThanOrEqual(10);
      }
    }
  });
});

describe('registry repos.yaml — penegakan CI (branch protection)', () => {
  it('setiap repo dengan pipeline mendeklarasikan minimal satu required check', () => {
    for (const repo of registry.repositories) {
      if (repo.ci !== 'none') {
        expect(repo.required_checks.length).toBeGreaterThan(0);
      }
    }
  });

  it('nama required check tidak memiliki spasi berlebih di tepi', () => {
    for (const repo of registry.repositories) {
      for (const check of repo.required_checks) {
        expect(check).toBe(check.trim());
        expect(check.length).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it('repo high/critical mengunci minimal satu check keamanan', () => {
    for (const repo of registry.repositories) {
      if (repo.criticality === 'critical' || repo.criticality === 'high') {
        const hasSecurity = repo.required_checks.some((check) =>
          /security|secret|scan|codeql/i.test(check),
        );
        expect(hasSecurity).toBe(true);
      }
    }
  });

  it('setiap tim memiliki tipe yang eksplisit (Team Topologies)', () => {
    for (const team of registry.teams) {
      expect(['platform', 'stream-aligned', 'enabling']).toContain(team.type);
    }
  });

  it('tim platform wajib memiliki minimal satu repository', () => {
    const ownerSlugs = new Set(registry.repositories.map((repo) => repo.team));
    for (const team of registry.teams) {
      if (team.type === 'platform') {
        expect(ownerSlugs.has(team.slug)).toBe(true);
      }
    }
  });
});
