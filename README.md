# platform-ci

Pusat tata kelola CI/CD dan kepemilikan repositori organisasi **rempugwarga**.
Dikelola sebagai *platform product* oleh Platform Engineering — dikonsumsi tim
lain sebagai layanan (X-as-a-Service), tanpa perlu berkoordinasi manual.

> **Pemilik (owner):** Platform Engineering (`@rempugwarga/platform-engineering`)
> **Kontak:** `#platform-engineering`

## Isi

| Bagian | Fungsi |
| --- | --- |
| [`repos.yaml`](repos.yaml) | **Sumber kebenaran kepemilikan**: repo → tim, tipe, kritikalitas, CI, required checks |
| [`terraform/org/`](terraform/org) | Settings-as-code: pembuatan repo, tim GitHub, branch protection |
| [`.github/workflows/reusable-*.yml`](.github/workflows) | Workflow reusable: Node CI, Terraform CI, Security Scan |
| [`.github/workflows/org-consistency.yml`](.github/workflows/org-consistency.yml) | Validasi mingguan kontrak lintas repo (CODEOWNERS, katalog, client OIDC) |
| [`tests/`](tests) | Uji kebijakan registry (kepemilikan, required checks, tipe tim) |
| [`scripts/check-consistency.ts`](scripts/check-consistency.ts) | Pemeriksa konsistensi lintas repo terhadap `repos.yaml` |

## Cara pakai (tim aplikasi)

Di repo Anda, cukup memanggil workflow reusable — tidak perlu menyalin pipeline:

```yaml
name: CI
on:
  push: { branches: [main] }
  pull_request: { branches: [main] }

jobs:
  ci:
    uses: rempugwarga/platform-ci/.github/workflows/reusable-node-ci.yml@main
  security:
    uses: rempugwarga/platform-ci/.github/workflows/reusable-security-scan.yml@main
    with:
      run-iac-scan: false
```

Detail input/output: [docs/REUSABLE-WORKFLOWS.md](docs/REUSABLE-WORKFLOWS.md).

## Menambah repository baru

1. Tambahkan entri di [`repos.yaml`](repos.yaml) (nama, deskripsi, `team`,
   `type`, `criticality`, `ci`).
2. PR → CI memvalidasi registry (schema + kepemilikan).
3. Setelah merge: jalankan `terraform apply` pada `terraform/org` untuk membuat
   repo, tim, dan branch protection secara otomatis.

## Menjalankan lokal

```sh
bun install
bun run test              # validasi registry repos.yaml
bun run check:consistency # konsistensi CODEOWNERS/katalog/client dengan registry
bash scripts/validate-org-terraform.sh
```

## Dokumentasi

| Dokumen | Isi |
| --- | --- |
| [docs/REUSABLE-WORKFLOWS.md](docs/REUSABLE-WORKFLOWS.md) | Katalog workflow reusable + contoh |
| [docs/BRANCH-PROTECTION.md](docs/BRANCH-PROTECTION.md) | Aturan branch protection as code |
| [docs/SECRET-MANAGEMENT.md](docs/SECRET-MANAGEMENT.md) | Kebijakan secret organisasi (tanpa secret di repo) |
