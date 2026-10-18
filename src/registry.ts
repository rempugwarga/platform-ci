import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import Ajv from 'ajv';

export interface RepositoryEntry {
  name: string;
  description: string;
  team: string;
  type: 'platform' | 'stream-aligned' | 'enabling';
  criticality: 'low' | 'medium' | 'high' | 'critical';
  ci: 'node' | 'terraform' | 'none';
  required_checks: string[];
}

export interface TeamEntry {
  slug: string;
  name: string;
  type: 'platform' | 'stream-aligned' | 'enabling';
  description: string;
}

export interface Registry {
  organization: string;
  defaults: { visibility: string; require_code_owner_review: boolean };
  teams: TeamEntry[];
  repositories: RepositoryEntry[];
}

export function loadRegistry(path = 'repos.yaml'): Registry {
  return parse(readFileSync(path, 'utf8')) as Registry;
}

export function loadSchema(path = 'repos.schema.json'): object {
  return JSON.parse(readFileSync(path, 'utf8')) as object;
}

export function createValidator(schema: object) {
  const ajv = new Ajv({ allErrors: true, strict: false });
  return ajv.compile(schema);
}
