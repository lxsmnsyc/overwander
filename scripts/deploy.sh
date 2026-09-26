#!/usr/bin/env bash
# Runs on the server. Deploys the newest release tag and does nothing when it
# is already live, so cron can run it: that is how a release reaches a server
# that takes no inbound connections.
#
# `scripts/deploy.sh v1.2.3` deploys that tag and pins it, so cron leaves a
# rollback alone. `scripts/deploy.sh --unpin` goes back to following releases.
set -euo pipefail

# One block, so bash has read all of it before the checkout below rewrites this file
{
  cd "$(dirname "$0")/.."

  pin_file=".deploy-pin"
  case "${1:-}" in
    --unpin) rm -f "$pin_file" ;;
    "") ;;
    *) echo "$1" > "$pin_file" ;;
  esac

  git fetch --tags --quiet origin
  if [ -f "$pin_file" ]; then
    tag="$(cat "$pin_file")"
  else
    tag="$(git tag -l 'v*' --sort=-v:refname | head -n 1)"
  fi

  if [ -z "$tag" ]; then
    echo "No release tag to deploy" >&2
    exit 1
  fi

  # The last tag that went live, so an unchanged release is not rebuilt
  deployed_file=".deployed-tag"
  if [ -f "$deployed_file" ] && [ "$(cat "$deployed_file")" = "$tag" ]; then
    echo "$tag is already deployed"
    exit 0
  fi

  git -c advice.detachedHead=false checkout --quiet "$tag"

  # The build id ties open tabs to this build, so it is the commit, not the time
  BUILD_ID="$(git rev-parse HEAD)" docker compose up --build --detach --remove-orphans
  echo "$tag" > "$deployed_file"
  echo "Deployed $tag"
  exit 0
}
