provider "github" {
  owner = var.github_org
  token = var.github_token
}

locals {
  registry = yamldecode(file("${path.module}/../../repos.yaml"))
  teams    = { for team in local.registry.teams : team.slug => team }
  repos    = { for repo in local.registry.repositories : repo.name => repo }
}

# ---------------------------------------------------------------------------
# Tim: unit kepemilikan. Setiap repository memiliki tepat satu tim pemilik.
# ---------------------------------------------------------------------------
resource "github_team" "team" {
  for_each = var.manage_teams ? local.teams : {}

  name        = each.value.slug
  description = each.value.description
  privacy     = "closed"
}

# ---------------------------------------------------------------------------
# Repository: dibuat/dikelola dari registry (repos.yaml).
# Repo yang sudah ada harus diimpor: terraform import github_repository.repo["<name>"] <name>
# ---------------------------------------------------------------------------
resource "github_repository" "repo" {
  for_each = local.repos

  name        = each.value.name
  description = each.value.description
  visibility  = local.registry.defaults.visibility

  has_issues   = true
  has_wiki     = false
  has_projects = false

  vulnerability_alerts = true

  dynamic "security_and_analysis" {
    for_each = var.enable_advanced_security ? [1] : []
    content {
      advanced_security {
        status = "enabled"
      }
      secret_scanning {
        status = "enabled"
      }
      secret_scanning_push_protection {
        status = "enabled"
      }
    }
  }

  lifecycle {
    # Repo berisi kode — jangan pernah terhapus karena kesalahan registry.
    prevent_destroy = true
  }
}

# ---------------------------------------------------------------------------
# Branch protection as code: PR + code owner review wajib, riwayat linear,
# tidak ada force push / penghapusan branch default.
# ---------------------------------------------------------------------------
resource "github_repository_ruleset" "main" {
  for_each = local.repos

  name        = "protect-default-branch"
  repository  = github_repository.repo[each.key].name
  target      = "branch"
  enforcement = "active"

  conditions {
    ref_name {
      include = ["~DEFAULT_BRANCH"]
      exclude = []
    }
  }

  rules {
    deletion                = true
    non_fast_forward        = true
    required_linear_history = true

    pull_request {
      required_approving_review_count = 1
      dismiss_stale_reviews_on_push   = true
      require_code_owner_review       = local.registry.defaults.require_code_owner_review
      require_last_push_approval      = true
    }

    dynamic "required_status_checks" {
      for_each = length(each.value.required_checks) > 0 ? [1] : []
      content {
        strict_required_status_checks_policy = true

        dynamic "required_check" {
          for_each = each.value.required_checks
          content {
            context = required_check.value
          }
        }
      }
    }
  }
}
