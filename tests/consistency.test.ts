import { describe, expect, it } from '@rstest/core';
import {
  checkCatalogServices,
  checkClientOwnership,
  checkCodeowners,
} from '../src/consistency';

describe('konsistensi — CODEOWNERS ↔ registry', () => {
  it('melaporkan bila CODEOWNERS tidak ditemukan', () => {
    const violations = checkCodeowners({
      repoName: 'design-system',
      organization: 'rempugwarga',
      teamSlug: 'design-system-team',
      content: null,
    });
    expect(violations).toHaveLength(1);
    expect(violations[0].scope).toBe('design-system/.github/CODEOWNERS');
  });

  it('melaporkan bila CODEOWNERS tidak menyebut tim pemilik', () => {
    const violations = checkCodeowners({
      repoName: 'design-system',
      organization: 'rempugwarga',
      teamSlug: 'design-system-team',
      content: '* @rempugwarga/platform-engineering\n',
    });
    expect(violations).toHaveLength(1);
    expect(violations[0].message).toContain('@rempugwarga/design-system-team');
  });

  it('lolos bila CODEOWNERS menyebut tim pemilik', () => {
    const violations = checkCodeowners({
      repoName: 'design-system',
      organization: 'rempugwarga',
      teamSlug: 'design-system-team',
      content: '* @rempugwarga/design-system-team @rempugwarga/platform-engineering\n',
    });
    expect(violations).toEqual([]);
  });
});

describe('konsistensi — services.yaml ↔ registry', () => {
  const base = {
    teamSlugs: ['platform-engineering', 'identity-platform'],
    repoNames: ['identity-platform', 'platform-docs'],
    organization: 'rempugwarga',
  };

  it('melaporkan owner yang tidak terdaftar', () => {
    const violations = checkCatalogServices({
      ...base,
      services: [
        {
          name: 'identity-platform',
          owner: 'tim-hantu',
          repository: 'https://github.com/rempugwarga/identity-platform',
        },
      ],
    });
    expect(violations.some((v) => v.message.includes('tim-hantu'))).toBe(true);
  });

  it('melaporkan layanan yang tidak memiliki repo di registry', () => {
    const violations = checkCatalogServices({
      ...base,
      services: [
        {
          name: 'layanan-misterius',
          owner: 'platform-engineering',
          repository: 'https://github.com/rempugwarga/layanan-misterius',
        },
      ],
    });
    expect(violations.some((v) => v.message.includes('tidak ada repo'))).toBe(
      true,
    );
  });

  it('melaporkan URL repository yang tidak sesuai organisasi', () => {
    const violations = checkCatalogServices({
      ...base,
      services: [
        {
          name: 'identity-platform',
          owner: 'identity-platform',
          repository: 'https://github.com/org-lain/identity-platform',
        },
      ],
    });
    expect(violations.some((v) => v.message.includes('repository harus'))).toBe(
      true,
    );
  });

  it('lolos untuk katalog yang konsisten', () => {
    const violations = checkCatalogServices({
      ...base,
      services: [
        {
          name: 'identity-platform',
          owner: 'identity-platform',
          repository: 'https://github.com/rempugwarga/identity-platform',
        },
        {
          name: 'platform-docs',
          owner: 'platform-engineering',
          repository: 'https://github.com/rempugwarga/platform-docs',
        },
      ],
    });
    expect(violations).toEqual([]);
  });
});

describe('konsistensi — client OIDC ↔ registry', () => {
  it('melaporkan client dengan owner di luar registry', () => {
    const violations = checkClientOwnership({
      clients: [{ clientId: 'app-hantu', owner: 'tim-hantu' }],
      teamSlugs: ['identity-platform'],
    });
    expect(violations).toHaveLength(1);
    expect(violations[0].message).toContain('app-hantu');
  });

  it('lolos bila semua owner terdaftar', () => {
    const violations = checkClientOwnership({
      clients: [{ clientId: 'web-dashboard', owner: 'team-web-dashboard' }],
      teamSlugs: ['team-web-dashboard'],
    });
    expect(violations).toEqual([]);
  });
});
