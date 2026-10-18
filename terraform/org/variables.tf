variable "github_org" {
  description = "Nama organisasi GitHub (placeholder: rempugwarga)"
  type        = string
  default     = "rempugwarga"
}

variable "github_token" {
  description = "Token admin organisasi (classic PAT dengan scope repo+admin:org). Disuntikkan via TF_VAR_github_token — JANGAN disimpan di repo."
  type        = string
  sensitive   = true
}

variable "enable_advanced_security" {
  description = "Aktifkan secret scanning + push protection (butuh public repo atau GitHub Advanced Security)"
  type        = bool
  default     = false
}

variable "manage_teams" {
  description = "Buat/perbarui tim GitHub dari repos.yaml. Matikan bila tim dikelola sistem lain."
  type        = bool
  default     = true
}
