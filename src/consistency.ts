export interface Violation {
  scope: string;
  message: string;
}

export interface CatalogService {
  name: string;
  owner: string;
  repository: string;
}

export interface ClientDocument {
  clientId: string;
  owner: string;
}

export function checkCodeowners(params: {
  repoName: string;
  organization: string;
  teamSlug: string;
  content: string | null;
}): Violation[] {
  const scope = `${params.repoName}/.github/CODEOWNERS`;
  if (params.content === null) {
    return [
      {
        scope,
        message: `CODEOWNERS tidak ditemukan — repo wajib mendeklarasikan kepemilikan tim ${params.teamSlug}`,
      },
    ];
  }
  const handle = `@${params.organization}/${params.teamSlug}`;
  if (!params.content.includes(handle)) {
    return [
      {
        scope,
        message: `CODEOWNERS tidak menyebut tim pemilik ${handle}`,
      },
    ];
  }
  return [];
}

export function checkCatalogServices(params: {
  services: CatalogService[];
  teamSlugs: string[];
  repoNames: string[];
  organization: string;
}): Violation[] {
  const scope = 'platform-docs/services.yaml';
  const violations: Violation[] = [];
  for (const service of params.services) {
    if (!params.teamSlugs.includes(service.owner)) {
      violations.push({
        scope,
        message: `layanan "${service.name}": owner "${service.owner}" tidak terdaftar di repos.yaml`,
      });
    }
    if (!params.repoNames.includes(service.name)) {
      violations.push({
        scope,
        message: `layanan "${service.name}": tidak ada repo dengan nama tersebut di repos.yaml`,
      });
    }
    const expected = `https://github.com/${params.organization}/${service.name}`;
    if (service.repository !== expected) {
      violations.push({
        scope,
        message: `layanan "${service.name}": repository harus ${expected}`,
      });
    }
  }
  return violations;
}

export function checkClientOwnership(params: {
  clients: ClientDocument[];
  teamSlugs: string[];
}): Violation[] {
  const scope = 'identity-platform/clients';
  const violations: Violation[] = [];
  for (const client of params.clients) {
    if (!params.teamSlugs.includes(client.owner)) {
      violations.push({
        scope,
        message: `client "${client.clientId}": owner "${client.owner}" tidak terdaftar di repos.yaml`,
      });
    }
  }
  return violations;
}
