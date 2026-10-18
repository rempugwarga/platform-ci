# Kebijakan Keamanan — platform-ci

Repo ini mengendalikan CI/CD dan branch protection seluruh organisasi — perubahan
di sini berdampak lintas tim dan wajib direview Platform Engineering.

## Pelaporan

Hubungi `#platform-engineering` atau buat Security Advisory. Untuk masalah yang
memengaruhi semua repo (mis. bypass branch protection), tandai sebagai insiden.

## Praktik

1. gitleaks di setiap PR + actionlint untuk memastikan workflow tidak memuat
   pola berbahaya (mis. injeksi script).
2. Terraform org memakai `prevent_destroy` pada repo — kesalahan registry tidak
   pernah menghapus kode tim.
3. Semua secret yang dipakai workflow berasal dari GitHub Environment/secret
   organisasi; workflow reusable tidak mendefinisikan secret sendiri kecuali
   `GITLEAKS_LICENSE` (opsional).
4. Audit perubahan branch protection dilakukan melalui riwayat git `repos.yaml`
   + `terraform plan/apply` yang tercatat di Actions.
