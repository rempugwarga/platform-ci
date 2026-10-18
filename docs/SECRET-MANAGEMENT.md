# Kebijakan Secret Organisasi

Aturan tunggal: **tidak ada secret di dalam repository — titik.** Secret hanya
hidup di secret manager dan disuntikkan saat runtime/deploy.

## Klasifikasi & penyimpanan

| Jenis | Penyimpanan | Dipakai oleh |
| --- | --- | --- |
| Kredensial deploy (Keycloak admin, client secret) | GitHub Environment (`iam-dev/staging/prod`) | identity-platform apply |
| Token registry npm | **Tidak ada** — npm Trusted Publishing (OIDC) | design-system release |
| Token Terraform GitHub org | GitHub Environment `org-admin` | platform-ci terraform apply |
| `ORG_READ_TOKEN` (baca lintas repo, read-only) | GitHub secret organisasi | platform-ci workflow `org-consistency` |
| Rahasia aplikasi runtime | Secret manager aplikasi (Vault/cloud SM) | aplikasi masing-masing |

## Penegakan berlapis

1. **Pre-commit (opsional, direkomendasikan):** `gitleaks protect --staged`.
2. **CI:** job *Security Scan* (workflow reusable `reusable-security-scan.yml`)
   menjalankan gitleaks pada setiap PR dan push.
3. **Platform:** GitHub push protection (aktif via `terraform/org` untuk repo
   yang mendukung).
4. **Review manusia:** checklist PR menanyakan eksplisit "tidak ada secret baru".

## Yang dilarang

- `.env` bertisi nilai nyata (hanya `.env.example` yang boleh masuk).
- `*.tfvars` dengan kredensial (gunakan `TF_VAR_*` dari environment).
- Secret di commit message, nama branch, komentar kode, atau issue.
- Berbagi secret melalui kanal tidak resmi.

## Jika secret bocor

1. **Rotasi segera** di sumbernya (jangan hanya hapus commit — riwayat git tetap
   ada dan secret sudah terekspos).
2. Cabut akses terkait, audit penggunaan (Keycloak admin events / log aplikasi).
3. Perbaiki akar masalah, buka blameless postmortem, perbarui pola injeksi bila
   perlu.
