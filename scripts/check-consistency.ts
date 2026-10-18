// Validasi konsistensi kontrak lintas repo terhadap sumber kebenaran repos.yaml.
//
// Pemeriksaan:
//   1. Setiap repo memiliki .github/CODEOWNERS yang menyebut tim pemiliknya.
//   2. platform-docs/services.yaml hanya menyebut tim & repo yang terdaftar.
//   3. identity-platform/clients/*.json hanya dimiliki tim yang terdaftar.
//
// Pemakaian:
//   bun scripts/check-consistency.ts                     # workspace default (..)
//   bun scripts/check-consistency.ts --workspace .org --strict
//
// `--strict` mewajibkan semua repo registry ada di workspace (dipakai di CI);
// tanpa flag, repo yang tidak tersedia dilewati dengan peringatan (pemakaian
// lokal saat hanya sebagian repo ter-checkout).

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import {
  checkCatalogServices,
  checkClientOwnership,
  checkCodeowners,
  type CatalogService,
  type ClientDocument,
  type Violation,
} from '../src/consistency';
import { loadRegistry } from '../src/registry';

const args = process.argv.slice(2);
const flag = (name: string): string | null => {
  const index = args.indexOf(name);
  return index >= 0 ? (args[index + 1] ?? null) : null;
};
const strict = args.includes('--strict');
const here = dirname(fileURLToPath(import.meta.url));
const workspace = resolve(flag('--workspace') ?? resolve(here, '..', '..'));
const registry = loadRegistry(resolve(here, '..', 'repos.yaml'));

const teamSlugs = registry.teams.map((team) => team.slug);
const repoNames = registry.repositories.map((repo) => repo.name);
const violations: Violation[] = [];
const skipped: string[] = [];

for (const repo of registry.repositories) {
  const repoDir = join(workspace, repo.name);
  if (!existsSync(repoDir)) {
    skipped.push(repo.name);
    continue;
  }
  const codeownersPath = join(repoDir, '.github', 'CODEOWNERS');
  const content = existsSync(codeownersPath)
    ? readFileSync(codeownersPath, 'utf8')
    : null;
  violations.push(
    ...checkCodeowners({
      repoName: repo.name,
      organization: registry.organization,
      teamSlug: repo.team,
      content,
    }),
  );
}

const servicesPath = join(workspace, 'platform-docs', 'services.yaml');
if (existsSync(servicesPath)) {
  const catalog = parse(readFileSync(servicesPath, 'utf8')) as {
    services: CatalogService[];
  };
  violations.push(
    ...checkCatalogServices({
      services: catalog.services,
      teamSlugs,
      repoNames,
      organization: registry.organization,
    }),
  );
} else {
  skipped.push('platform-docs/services.yaml');
}

const clientsDir = join(workspace, 'identity-platform', 'clients');
if (existsSync(clientsDir)) {
  const clients: ClientDocument[] = readdirSync(clientsDir)
    .filter((file) => file.endsWith('.json'))
    .map(
      (file) =>
        JSON.parse(
          readFileSync(join(clientsDir, file), 'utf8'),
        ) as ClientDocument,
    );
  violations.push(...checkClientOwnership({ clients, teamSlugs }));
} else {
  skipped.push('identity-platform/clients');
}

if (skipped.length > 0) {
  console.warn(`⚠ Dilewati (tidak ada di workspace): ${skipped.join(', ')}`);
}

if (strict && skipped.length > 0) {
  console.error(
    '✖ Mode strict: semua repo dalam registry wajib tersedia di workspace.',
  );
  process.exit(1);
}

if (violations.length > 0) {
  console.error(`✖ ${violations.length} pelanggaran konsistensi:`);
  for (const violation of violations) {
    console.error(`  - [${violation.scope}] ${violation.message}`);
  }
  process.exit(1);
}

const checked = registry.repositories.length - skipped.length;
console.log(`✔ Konsistensi lintas repo OK (${checked} repo diperiksa).`);
