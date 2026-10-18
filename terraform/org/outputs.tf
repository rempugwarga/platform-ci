output "managed_repositories" {
  value = sort(keys(local.repos))
}

output "managed_teams" {
  value = sort(keys(local.teams))
}

output "ownership" {
  description = "Peta repository -> tim pemilik (untuk audit & dokumen)"
  value = {
    for name, repo in local.repos : name => repo.team
  }
}
