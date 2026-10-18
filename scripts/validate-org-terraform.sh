#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> terraform fmt check"
terraform -chdir=terraform/org fmt -check -recursive

echo "==> terraform validate (org settings)"
terraform -chdir=terraform/org init -backend=false -input=false >/dev/null
terraform -chdir=terraform/org validate
