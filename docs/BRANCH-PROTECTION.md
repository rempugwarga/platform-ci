# Branch Protection & Kepemilikan (as code)

Branch protection organisasi dikelola di [`terraform/org/`](../terraform/org)
dari sumber tunggal [`repos.yaml`](../repos.yaml). Tidak ada pengaturan manual
yang perlu diingat — perubahan aturan = perubahan kode + review.

## Aturan yang diterapkan untuk setiap repo

| Aturan | Nilai | Alasan |
| --- | --- | --- |
| Pull request wajib | 1 approve + code owner | Perubahan tidak bisa masuk tanpa review pemilik |
| Code owner review | aktif (dari `repos.yaml.defaults`) | Kepemilikan ditegakkan mesin, bukan kesepakatan lisan |
| Review baru batal saat push baru | aktif | Approval tidak boleh "kadaluarsa" terhadap diff lain |
| Riwayat linear | aktif | Audit trail bersih, revert mudah |
| Force push & hapus branch | dilarang | Melindungi integritas riwayat |
| Required status checks | per repo (`required_checks`) | CI harus hijau sebelum merge |

Semua repo sudah mendeklarasikan `required_checks` yang mengunci gerbang
build/test, keamanan, dan (untuk `identity-platform`) integrasi realm. Repo
`high`/`critical` **wajib** memuat minimal satu check keamanan — ditegakkan
`tests/registry-policy.test.ts`.

## `required_checks` adalah kontrak nama job

Nilai di `required_checks` harus **sama persis** dengan `name:` job di workflow
repo tersebut. Untuk pemanggil workflow reusable, GitHub melaporkan nama job
**pemanggil** (bukan job di dalam reusable workflow).

Bila menambah/mengganti job di repo:

1. Buka PR dan biarkan CI berjalan sekali.
2. Catat nama check yang muncul (contoh: `Build & Test`).
3. Perbarui `required_checks` repo terkait di `repos.yaml`:

   ```yaml
   - name: design-system
     required_checks:
       - "Build, Typecheck & Test"
       - "Storybook Build"
       - "Security Scan"
       - "CodeQL (SAST)"
   ```

4. PR ke platform-ci → review Platform Engineering → `terraform apply`.

Menghapus required check yang sudah ada = melemahkan kontrol keamanan — harus
disetujui Platform Engineering dan dicatat di deskripsi PR.

## Validasi konsistensi lintas repo

`bun run check:consistency` memverifikasi bahwa artefak kepemilikan di tiap repo
selaras dengan `repos.yaml`:

- `.github/CODEOWNERS` setiap repo menyebut tim pemiliknya;
- `platform-docs/services.yaml` hanya menyebut repo/tim yang terdaftar;
- owner di `identity-platform/clients/*.json` terdaftar sebagai tim.

Dijalankan mingguan oleh workflow `org-consistency.yml` (butuh secret
`ORG_READ_TOKEN`, lihat [SECRET-MANAGEMENT.md](SECRET-MANAGEMENT.md)) dan bisa
dijalankan lokal dari root workspace polyrepo.

## Mengimpor repo/tim yang sudah ada

```sh
cd terraform/org
terraform import 'github_repository.repo["design-system"]' design-system
terraform import 'github_repository_ruleset.main["design-system"]' design-system:protect-default-branch
terraform import 'github_team.team["design-system-team"]' <team-id>
```

## Uji sebelum apply

- `bun run test` (platform-ci) memvalidasi registry: tim pemilik ada, nama unik,
  repo kritis memiliki CI.
- `terraform plan` pada `terraform/org` menampilkan perubahan settings yang akan
  diterapkan (review oleh Platform Engineering).
