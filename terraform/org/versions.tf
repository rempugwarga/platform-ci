terraform {
  required_version = ">= 1.9.0"

  required_providers {
    github = {
      source  = "integrations/github"
      version = "~> 6.0"
    }
  }

  # Untuk production, gunakan remote backend terenkripsi + locking (state
  # berisi konfigurasi organisasi, bukan secret aplikasi).
  backend "local" {}
}
