# Katalog Workflow Reusable

Semua workflow di `platform-ci/.github/workflows/reusable-*.yml` dapat dipanggil
repo lain dengan `uses: rempugwarga/platform-ci/.github/workflows/<file>@main`.
Setiap repo tetap memiliki CODEOWNERS dan branch protection sendiri — workflow
reusable hanya menyatukan *cara* build/test/scan.

## 1. `reusable-node-ci.yml`

Untuk repo Node/Bun (design-system, platform-docs, app-template, aplikasi lain).

| Input | Default | Keterangan |
| --- | --- | --- |
| `working-directory` | `.` | Direktori kerja |
| `bun-version` | `1.4.2` | Versi Bun (pin untuk reprodusibilitas) |
| `run-typecheck` | `true` | Jalankan `bun run typecheck` |
| `run-test` | `true` | Jalankan `bun run test` |
| `run-build` | `true` | Jalankan `bun run build` |
| `artifact-path` | `""` | Artefak hasil build yang diunggah |
| `artifact-name` | `build-output` | Nama artefak |

```yaml
jobs:
  ci:
    uses: rempugwarga/platform-ci/.github/workflows/reusable-node-ci.yml@main
    with:
      artifact-path: dist
```

## 2. `reusable-terraform-ci.yml`

Untuk repo IaC (identity-platform, org settings).

| Input | Default | Keterangan |
| --- | --- | --- |
| `terraform-directory` | `terraform` | Root direktori terraform |
| `validate-script` | `""` | Script `init -backend=false` + `validate` milik repo |
| `run-tflint` | `true` | Jalankan tflint |

```yaml
jobs:
  terraform:
    uses: rempugwarga/platform-ci/.github/workflows/reusable-terraform-ci.yml@main
    with:
      validate-script: scripts/validate-terraform.sh
```

## 3. `reusable-security-scan.yml`

Paket pemindaian standar: secret scanning (gitleaks), audit dependensi
(`bun audit`, blokir tingkat `critical`), dan scan IaC (trivy).

```yaml
jobs:
  security:
    uses: rempugwarga/platform-ci/.github/workflows/reusable-security-scan.yml@main
    with:
      run-iac-scan: true
      iac-directory: terraform
    secrets:
      GITLEAKS_LICENSE: ${{ secrets.GITLEAKS_LICENSE }}
```

## Menambah workflow reusable baru

1. Buat `reusable-<nama>.yml` dengan pemicu `workflow_call` (semua input
   didokumentasikan, default aman).
2. Uji lewat repo percontohan (mis. app-template) sebelum mengumumkan.
3. Perbarui dokumen ini + CHANGELOG platform-ci. Kontrak input adalah API —
   perubahan yang merusak wajib diumumkan ke semua konsumen.
