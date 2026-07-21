#!/usr/bin/env bash
set -euo pipefail

IMAGE_REPOSITORY_FILE="${READLE_FRONTEND_IMAGE_REPOSITORY_FILE:-/etc/readle/frontend-image-repository}"
LIVE="readle-frontend"
CANDIDATE="readle-frontend-candidate"
NETWORK="readle-public"
EDGE="readle-nginx"
STATE_FILE="/var/lib/readle/frontend-deploy.env"
LOCK_FILE="/run/lock/readle-frontend-deploy.lock"
DEPLOY_LABEL="io.readle.frontend.image-ref"

log() { printf '%s\n' "$*" >&2; }
die() { log "error: $*"; exit 1; }

validate_sha() {
  [[ "$1" =~ ^[0-9a-f]{40}$ ]]
}

validate_image_repository() {
  [[ "$1" =~ ^ghcr[.]io/[a-z0-9][a-z0-9._-]*/[a-z0-9][a-z0-9._-]*$ ]]
}

load_image_prefix() {
  local prefix extra
  [[ -r "$IMAGE_REPOSITORY_FILE" ]] || return 1
  prefix="$(head -n 1 "$IMAGE_REPOSITORY_FILE")"
  extra="$(tail -n +2 "$IMAGE_REPOSITORY_FILE" | tr -d '[:space:]')"
  [[ -z "$extra" ]] || return 1
  validate_image_repository "$prefix" || return 1
  IMAGE_PREFIX="$prefix"
}

validate_image_ref() {
  [[ -n "${IMAGE_PREFIX:-}" && "$1" == "$IMAGE_PREFIX"@sha256:* ]] || return 1
  [[ "${1#"$IMAGE_PREFIX"@sha256:}" =~ ^[0-9a-f]{64}$ ]]
}

validate_image_id() {
  [[ "$1" =~ ^(sha256:)?[0-9a-f]{64}$ ]]
}

validate_optional_image_id() {
  [[ -z "$1" ]] || validate_image_id "$1"
}

validate_optional_deploy_ref() {
  [[ -z "$1" ]] || validate_image_ref "$1" || validate_image_id "$1"
}

save_state() {
  local state_dir temp
  state_dir="$(dirname "$STATE_FILE")"
  mkdir -p "$state_dir"
  temp="$(mktemp "$state_dir/.frontend-deploy.env.XXXXXX")" || return 1
  if ! {
    printf 'last_good_image=%s\n' "${last_good_image:-}"
    printf 'last_good_revision=%s\n' "${last_good_revision:-}"
    printf 'last_good_ref=%s\n' "${last_good_ref:-}"
    printf 'previous_image=%s\n' "${previous_image:-}"
    printf 'previous_revision=%s\n' "${previous_revision:-}"
    printf 'previous_ref=%s\n' "${previous_ref:-}"
    printf 'pending_rollback_image=%s\n' "${pending_rollback_image:-}"
    printf 'pending_rollback_revision=%s\n' "${pending_rollback_revision:-}"
    printf 'pending_rollback_ref=%s\n' "${pending_rollback_ref:-}"
  } > "$temp"; then
    rm -f "$temp"
    return 1
  fi
  chmod 600 "$temp" || { rm -f "$temp"; return 1; }
  mv -f "$temp" "$STATE_FILE"
}

load_state() {
  local line value
  local have_last_good_image=0
  local have_last_good_revision=0
  local have_last_good_ref=0
  local have_previous_image=0
  local have_previous_revision=0
  local have_previous_ref=0
  local have_pending_rollback_image=0
  local have_pending_rollback_revision=0
  local have_pending_rollback_ref=0

  last_good_image=""
  last_good_revision=""
  last_good_ref=""
  previous_image=""
  previous_revision=""
  previous_ref=""
  pending_rollback_image=""
  pending_rollback_revision=""
  pending_rollback_ref=""
  [[ ! -f "$STATE_FILE" ]] && return 0

  while IFS= read -r line || [[ -n "$line" ]]; do
    case "$line" in
      last_good_image=*)
        [[ "$have_last_good_image" == 0 ]] || return 1
        value="${line#last_good_image=}"
        validate_optional_image_id "$value" || return 1
        last_good_image="$value"
        have_last_good_image=1
        ;;
      last_good_revision=*)
        [[ "$have_last_good_revision" == 0 ]] || return 1
        value="${line#last_good_revision=}"
        [[ -z "$value" ]] || validate_sha "$value" || return 1
        last_good_revision="$value"
        have_last_good_revision=1
        ;;
      last_good_ref=*)
        [[ "$have_last_good_ref" == 0 ]] || return 1
        value="${line#last_good_ref=}"
        validate_optional_deploy_ref "$value" || return 1
        last_good_ref="$value"
        have_last_good_ref=1
        ;;
      previous_image=*)
        [[ "$have_previous_image" == 0 ]] || return 1
        value="${line#previous_image=}"
        validate_optional_image_id "$value" || return 1
        previous_image="$value"
        have_previous_image=1
        ;;
      previous_revision=*)
        [[ "$have_previous_revision" == 0 ]] || return 1
        value="${line#previous_revision=}"
        [[ -z "$value" ]] || validate_sha "$value" || return 1
        previous_revision="$value"
        have_previous_revision=1
        ;;
      previous_ref=*)
        [[ "$have_previous_ref" == 0 ]] || return 1
        value="${line#previous_ref=}"
        validate_optional_deploy_ref "$value" || return 1
        previous_ref="$value"
        have_previous_ref=1
        ;;
      pending_rollback_image=*)
        [[ "$have_pending_rollback_image" == 0 ]] || return 1
        value="${line#pending_rollback_image=}"
        validate_optional_image_id "$value" || return 1
        pending_rollback_image="$value"
        have_pending_rollback_image=1
        ;;
      pending_rollback_revision=*)
        [[ "$have_pending_rollback_revision" == 0 ]] || return 1
        value="${line#pending_rollback_revision=}"
        [[ -z "$value" ]] || validate_sha "$value" || return 1
        pending_rollback_revision="$value"
        have_pending_rollback_revision=1
        ;;
      pending_rollback_ref=*)
        [[ "$have_pending_rollback_ref" == 0 ]] || return 1
        value="${line#pending_rollback_ref=}"
        validate_optional_deploy_ref "$value" || return 1
        pending_rollback_ref="$value"
        have_pending_rollback_ref=1
        ;;
      *) return 1 ;;
    esac
  done < "$STATE_FILE"

  [[ "$have_previous_image$have_previous_revision$have_previous_ref" == "000" || \
    "$have_previous_image$have_previous_revision$have_previous_ref" == "111" ]] || return 1
  if [[ -n "$previous_image" || -n "$previous_revision" || -n "$previous_ref" ]]; then
    [[ -n "$previous_image" && -n "$previous_revision" && -n "$previous_ref" ]] || return 1
  fi
  [[ "$have_last_good_image" == 1 && "$have_last_good_revision" == 1 && "$have_last_good_ref" == 1 && \
    "$have_pending_rollback_image" == 1 && "$have_pending_rollback_revision" == 1 && "$have_pending_rollback_ref" == 1 ]]
}

podman_cmd() {
  9>&- podman "$@"
}

container_exists() {
  podman_cmd container exists "$1"
}

container_image_id() {
  podman_cmd inspect "$1" --format '{{.Image}}' 2>/dev/null || true
}

container_deploy_ref() {
  podman_cmd inspect "$1" --format "{{ index .Config.Labels \"$DEPLOY_LABEL\" }}" 2>/dev/null || true
}

image_exists() {
  podman_cmd image exists "$1"
}

image_revision() {
  podman_cmd image inspect "$1" --format '{{ index .Config.Labels "org.opencontainers.image.revision" }}'
}

container_revision() {
  local image
  image="$(container_image_id "$1")"
  [[ -n "$image" ]] || return 1
  image_revision "$image"
}

edge_smoke() {
  curl --max-time 5 -fsS http://127.0.0.1/ >/dev/null
}

edge_smoke_retry() {
  for _ in {1..5}; do
    edge_smoke && return 0
    sleep 1
  done
  return 1
}

live_requested_healthy() {
  local image_ref="$1"
  local expected_sha="$2"
  container_exists "$LIVE" || return 1
  [[ "$(container_deploy_ref "$LIVE")" == "$image_ref" ]] || return 1
  [[ "$(container_revision "$LIVE" 2>/dev/null || true)" == "$expected_sha" ]] || return 1
  edge_smoke
}

needs_pending_restore() {
  [[ -n "${pending_rollback_image:-}" ]] || return 1
  ! live_requested_healthy "$1" "$2"
}

live_matches_rollback_healthy() {
  local image_id="$1"
  local revision="$2"
  local deploy_ref="${3:-$image_id}"
  [[ -n "$image_id" && -n "$revision" && -n "$deploy_ref" ]] || return 1
  container_exists "$LIVE" || return 1
  [[ "$(container_image_id "$LIVE")" == "$image_id" ]] || return 1
  [[ "$(container_deploy_ref "$LIVE")" == "$deploy_ref" ]] || return 1
  [[ "$(container_revision "$LIVE" 2>/dev/null || true)" == "$revision" ]] || return 1
  edge_smoke
}

remove_stale_candidate() {
  if container_exists "$CANDIDATE"; then
    log "removing stale candidate"
    podman_cmd rm -f "$CANDIDATE" >/dev/null
  fi
}

wait_healthy() {
  local name="$1"
  local status
  for _ in {1..30}; do
    status="$(podman_cmd inspect "$name" --format '{{.State.Healthcheck.Status}}' 2>/dev/null || true)"
    [[ "$status" == "healthy" ]] && return 0
    sleep 1
  done
  return 1
}

candidate_root_check() {
  podman_cmd exec "$CANDIDATE" wget -q -O /dev/null http://127.0.0.1:8080/
}

candidate_preflight() {
  wait_healthy "$CANDIDATE" || { podman_cmd rm -f "$CANDIDATE" >/dev/null; die "candidate did not become healthy"; }
  candidate_root_check || { podman_cmd rm -f "$CANDIDATE" >/dev/null; die "candidate root check failed"; }
}

run_candidate() {
  podman_cmd run -d --name "$CANDIDATE" --network "$NETWORK" --memory=192m "$1" >/dev/null
}

run_live() {
  local name="$1"
  local image="$2"
  local deploy_ref="$3"
  podman_cmd run -d --restart=always --name "$name" --network "$NETWORK" \
    --memory=192m --label "$DEPLOY_LABEL=$deploy_ref" "$image" >/dev/null
}

replace_live() {
  local image="$1"
  local deploy_ref="$2"
  if container_exists "$LIVE"; then
    podman_cmd rm -f "$LIVE" >/dev/null
  fi
  run_live "$LIVE" "$image" "$deploy_ref"
}

restart_edge() {
  podman_cmd restart "$EDGE" >/dev/null
}

clear_pending() {
  pending_rollback_image=""
  pending_rollback_revision=""
  pending_rollback_ref=""
}

promote_pending_rollback_to_previous() {
  previous_image="$pending_rollback_image"
  previous_revision="$pending_rollback_revision"
  previous_ref="$pending_rollback_ref"
}

promote_complete_pending_rollback_to_previous() {
  [[ -n "${pending_rollback_image:-}" && -n "${pending_rollback_revision:-}" && -n "${pending_rollback_ref:-}" ]] || return 0
  promote_pending_rollback_to_previous
}

restore_image() {
  local image="$1"
  local revision="$2"
  local deploy_ref="${3:-$image}"
  local restore_target="$image"
  [[ -n "$image" && -n "$revision" && -n "$deploy_ref" ]] || return 1
  if ! image_exists "$image"; then
    if ! validate_image_ref "$deploy_ref"; then
      log "saved rollback image is unavailable and has no immutable digest ref"
      return 1
    fi
    podman_cmd pull "$deploy_ref" >/dev/null || {
      log "failed to pull saved rollback image"
      return 1
    }
    restore_target="$deploy_ref"
  fi
  log "restoring $revision"
  replace_live "$restore_target" "$deploy_ref" || return 1
  restart_edge || return 1
  edge_smoke_retry || return 1
  last_good_image="$image"
  last_good_revision="$revision"
  last_good_ref="$deploy_ref"
  clear_pending
  save_state
}

self_test() {
  local good_sha good_digest good_image_id raw_good_image_id lock_probe original_repository_file original_state repository_file run_log state_file

  (
    lock_probe="$(mktemp)"
    trap 'status=$?; exec 9>&-; unset -f podman; rm -f "$lock_probe"; exit "$status"' EXIT
    exec 9>"$lock_probe"
    podman() {
      if { : >&9; } 2>/dev/null; then
        return 1
      fi
      return 0
    }
    podman_cmd self-test
  )

  original_repository_file="$IMAGE_REPOSITORY_FILE"
  repository_file="$(mktemp)"
  printf '%s\n' 'ghcr.io/example-org/int2-readle-team02-fe' > "$repository_file"
  IMAGE_REPOSITORY_FILE="$repository_file"
  load_image_prefix
  good_sha="0123456789abcdef0123456789abcdef01234567"
  good_digest="${IMAGE_PREFIX}@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
  good_image_id="sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
  raw_good_image_id="${good_image_id#sha256:}"

  validate_sha "$good_sha"
  ! validate_sha "0123"
  validate_image_ref "$good_digest"
  ! validate_image_ref "ghcr.io/other/int2-readle-team02-fe@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
  ! validate_image_ref "${IMAGE_PREFIX}:main"

  original_state="$STATE_FILE"
  state_file="$(mktemp)"
  STATE_FILE="$state_file"
  printf '%s\n' \
    "last_good_image=$raw_good_image_id" \
    "last_good_revision=$good_sha" \
    "last_good_ref=$good_digest" \
    'pending_rollback_image=' \
    'pending_rollback_revision=' \
    'pending_rollback_ref=' > "$STATE_FILE"
  load_state
  [[ "$last_good_image" == "$raw_good_image_id" ]]
  [[ -z "$previous_image" && -z "$previous_revision" && -z "$previous_ref" ]]
  printf '%s\n' \
    "last_good_image=$good_image_id" \
    "last_good_revision=$good_sha" \
    "last_good_ref=$good_digest" \
    "previous_image=$raw_good_image_id" \
    "previous_revision=$good_sha" \
    "previous_ref=$good_digest" \
    'pending_rollback_image=' \
    'pending_rollback_revision=' \
    'pending_rollback_ref=' > "$STATE_FILE"
  load_state
  [[ "$previous_image" == "$raw_good_image_id" && "$previous_revision" == "$good_sha" && "$previous_ref" == "$good_digest" ]]
  printf '%s\n' \
    "last_good_image=$good_image_id" \
    "last_good_revision=$good_sha" \
    "last_good_ref=$good_digest" \
    "previous_image=$raw_good_image_id" \
    'previous_revision=' \
    'previous_ref=' \
    'pending_rollback_image=' \
    'pending_rollback_revision=' \
    'pending_rollback_ref=' > "$STATE_FILE"
  ! load_state
  printf '%s\n' \
    "last_good_image=$good_image_id" \
    "last_good_revision=$good_sha" \
    "last_good_ref=$good_digest" \
    "previous_image=$raw_good_image_id" \
    'pending_rollback_image=' \
    'pending_rollback_revision=' \
    'pending_rollback_ref=' > "$STATE_FILE"
  ! load_state
  last_good_image="sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc"
  last_good_revision="1111111111111111111111111111111111111111"
  last_good_ref="${IMAGE_PREFIX}@sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc"
  pending_rollback_image="$good_image_id"
  pending_rollback_revision="$good_sha"
  pending_rollback_ref="$good_digest"
  promote_pending_rollback_to_previous
  last_good_image="$raw_good_image_id"
  last_good_revision="$good_sha"
  last_good_ref="$good_digest"
  clear_pending
  save_state
  grep -qx "previous_image=$good_image_id" "$STATE_FILE"
  grep -qx "previous_revision=$good_sha" "$STATE_FILE"
  grep -qx "previous_ref=$good_digest" "$STATE_FILE"
  previous_image="sha256:dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd"
  previous_revision="2222222222222222222222222222222222222222"
  previous_ref="${IMAGE_PREFIX}@sha256:dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd"
  pending_rollback_image="sha256:eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
  pending_rollback_revision="3333333333333333333333333333333333333333"
  pending_rollback_ref="${IMAGE_PREFIX}@sha256:eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
  promote_complete_pending_rollback_to_previous
  clear_pending
  [[ "$previous_image" == "sha256:eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" ]]
  [[ "$previous_revision" == "3333333333333333333333333333333333333333" ]]
  [[ "$previous_ref" == "${IMAGE_PREFIX}@sha256:eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" ]]
  previous_image="sha256:dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd"
  previous_revision="2222222222222222222222222222222222222222"
  previous_ref="${IMAGE_PREFIX}@sha256:dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd"
  pending_rollback_image=""
  pending_rollback_revision=""
  pending_rollback_ref=""
  promote_complete_pending_rollback_to_previous
  clear_pending
  [[ "$previous_image" == "sha256:dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd" ]]
  [[ "$previous_revision" == "2222222222222222222222222222222222222222" ]]
  [[ "$previous_ref" == "${IMAGE_PREFIX}@sha256:dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd" ]]
  rm -f "$state_file"
  STATE_FILE="$original_state"

  pending_rollback_image="old"
  live_requested_healthy() { [[ "${SELFTEST_LIVE_HEALTHY:-0}" == "1" && "$1" == "$good_digest" ]]; }
  SELFTEST_LIVE_HEALTHY=1
  ! needs_pending_restore "$good_digest" "$good_sha"
  needs_pending_restore "${IMAGE_PREFIX}@sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" "$good_sha"
  SELFTEST_LIVE_HEALTHY=0
  needs_pending_restore "$good_digest" "$good_sha"

  replace_live() { [[ "${SELFTEST_REPLACE_OK:-1}" == "1" ]]; }
  restart_edge() { [[ "${SELFTEST_RESTART_OK:-1}" == "1" ]]; }
  edge_smoke_retry() { [[ "${SELFTEST_SMOKE_OK:-1}" == "1" ]]; }
  save_state() { :; }
  image_exists() { return 0; }

  SELFTEST_REPLACE_OK=0 SELFTEST_RESTART_OK=1 SELFTEST_SMOKE_OK=1
  ! restore_image "sha256:old" "$good_sha"
  SELFTEST_REPLACE_OK=1 SELFTEST_RESTART_OK=0 SELFTEST_SMOKE_OK=1
  ! restore_image "sha256:old" "$good_sha"
  SELFTEST_REPLACE_OK=1 SELFTEST_RESTART_OK=1 SELFTEST_SMOKE_OK=0
  ! restore_image "sha256:old" "$good_sha"
  SELFTEST_REPLACE_OK=1 SELFTEST_RESTART_OK=1 SELFTEST_SMOKE_OK=1
  replace_live() { [[ "$1" == "sha256:old" && "$2" == "$good_digest" ]]; }
  restore_image "sha256:old" "$good_sha" "$good_digest"

  container_exists() { return 0; }
  container_image_id() { printf '%s\n' "sha256:old"; }
  container_revision() { printf '%s\n' "$good_sha"; }
  container_deploy_ref() { printf '%s\n' "${SELFTEST_LIVE_REF:-}"; }
  edge_smoke() { return 0; }
  SELFTEST_LIVE_REF="$good_digest"
  live_matches_rollback_healthy "sha256:old" "$good_sha" "$good_digest"
  SELFTEST_LIVE_REF="${IMAGE_PREFIX}@sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
  ! live_matches_rollback_healthy "sha256:old" "$good_sha" "$good_digest"

  original_state="$STATE_FILE"
  state_file="$(mktemp)"
  STATE_FILE="$state_file"
  printf '%s\n' \
    "last_good_image=$raw_good_image_id" \
    "last_good_revision=$good_sha" \
    "last_good_ref=$good_digest" \
    'pending_rollback_image=' \
    'pending_rollback_revision=' \
    'pending_rollback_ref=' > "$STATE_FILE"
  load_state
  [[ "$last_good_image" == "$raw_good_image_id" ]]
  printf '%s\n' \
    'last_good_image=not-an-image' \
    "last_good_revision=$good_sha" \
    "last_good_ref=$good_digest" \
    'pending_rollback_image=' \
    'pending_rollback_revision=' \
    'pending_rollback_ref=' > "$STATE_FILE"
  ! load_state
  printf '%s\n' \
    "last_good_image=$good_image_id" \
    "last_good_revision=$good_sha" \
    "last_good_ref=$good_digest" \
    'pending_rollback_image=' \
    'pending_rollback_revision=' \
    'pending_rollback_ref=' \
    'unexpected=value' > "$STATE_FILE"
  ! load_state
  rm -f "$state_file"
  STATE_FILE="$original_state"

  image_exists() { return 1; }
  podman_cmd() {
    [[ "$1" == "image" && "$2" == "exists" ]] && return 1
    [[ "$1" == "pull" && "$2" == "$good_digest" ]] || return 1
    SELFTEST_PULLED="$2"
  }
  replace_live() { [[ "$1" == "$good_digest" && "$2" == "$good_digest" ]]; }
  previous_image="$good_image_id"
  previous_revision="$good_sha"
  previous_ref="$good_digest"
  SELFTEST_PULLED=""
  restore_image "$good_image_id" "$good_sha" "$good_digest"
  [[ "$SELFTEST_PULLED" == "$good_digest" ]]
  [[ "$previous_image" == "$good_image_id" && "$previous_revision" == "$good_sha" && "$previous_ref" == "$good_digest" ]]

  run_log="$(mktemp)"
  podman_cmd() {
    [[ "$1" == "run" ]] || return 1
    printf '%s\n' "$*" >> "$run_log"
  }
  run_candidate "$good_digest"
  run_live "$LIVE" "$good_digest" "$good_digest"
  grep -q -- "--name $CANDIDATE .* --memory=192m " "$run_log"
  grep -q -- "--name $LIVE .* --memory=192m " "$run_log"
  rm -f "$run_log"

  run_log="$(mktemp)"
  podman_cmd() {
    [[ "$1" == "rm" && "$2" == "-f" && "$3" == "$CANDIDATE" ]] || return 1
    printf '%s\n' "$*" >> "$run_log"
  }
  wait_healthy() { return 1; }
  candidate_root_check() { return 0; }
  ! ( candidate_preflight )
  grep -qx "rm -f $CANDIDATE" "$run_log"
  : > "$run_log"
  wait_healthy() { return 0; }
  candidate_root_check() { return 1; }
  ! ( candidate_preflight )
  grep -qx "rm -f $CANDIDATE" "$run_log"
  : > "$run_log"
  candidate_root_check() { return 0; }
  candidate_preflight
  [[ ! -s "$run_log" ]]
  rm -f "$run_log"

  rm -f "$repository_file"
  unset IMAGE_PREFIX
  IMAGE_REPOSITORY_FILE="$original_repository_file"
  log "self-test passed"
}

main() {
  [[ "${1:-}" != "--self-test" ]] || { self_test; return; }

  load_image_prefix || die "missing or invalid image repository file: $IMAGE_REPOSITORY_FILE"

  local image_ref="${1:-}"
  local expected_sha="${2:-}"

  validate_image_ref "$image_ref" || die "image must be ${IMAGE_PREFIX}@sha256:<64 lowercase hex>"
  validate_sha "$expected_sha" || die "expected SHA must be 40 lowercase hex characters"

  exec 9>"$LOCK_FILE"
  flock -w 120 -x 9 || die "timed out waiting 120 seconds for deployment lock"

  load_state || die "failed to load deployment state"
  remove_stale_candidate

  if live_requested_healthy "$image_ref" "$expected_sha"; then
    log "requested revision already live and healthy"
    last_good_image="$(container_image_id "$LIVE")"
    last_good_revision="$expected_sha"
    last_good_ref="$(container_deploy_ref "$LIVE")"
    promote_complete_pending_rollback_to_previous
    clear_pending
    save_state
    return
  fi

  if live_matches_rollback_healthy "${pending_rollback_image:-}" "${pending_rollback_revision:-}" "${pending_rollback_ref:-}"; then
    log "pending rollback already live and healthy"
    last_good_image="$pending_rollback_image"
    last_good_revision="$pending_rollback_revision"
    last_good_ref="${pending_rollback_ref:-$pending_rollback_image}"
    clear_pending
    save_state
  elif needs_pending_restore "$image_ref" "$expected_sha"; then
    restore_image "$pending_rollback_image" "$pending_rollback_revision" "${pending_rollback_ref:-$pending_rollback_image}" || die "pending rollback failed"
  fi

  podman_cmd pull "$image_ref" >/dev/null
  [[ "$(image_revision "$image_ref")" == "$expected_sha" ]] || die "image revision label does not match expected SHA"

  run_candidate "$image_ref"
  candidate_preflight

  pending_rollback_image="$(container_image_id "$LIVE")"
  pending_rollback_revision="$(container_revision "$LIVE" 2>/dev/null || true)"
  pending_rollback_ref="$(container_deploy_ref "$LIVE")"
  [[ -n "$pending_rollback_ref" ]] || pending_rollback_ref="$pending_rollback_image"
  save_state

  podman_cmd rm -f "$CANDIDATE" >/dev/null
  if ! replace_live "$image_ref" "$image_ref"; then
    if restore_image "$pending_rollback_image" "$pending_rollback_revision" "$pending_rollback_ref"; then
      die "failed to start live frontend; rollback succeeded"
    fi
    die "failed to start live frontend; rollback failed"
  fi
  if ! restart_edge || ! edge_smoke_retry; then
    restore_image "$pending_rollback_image" "$pending_rollback_revision" "$pending_rollback_ref" || die "post-cutover failed and rollback failed"
    die "post-cutover failed; rolled back"
  fi

  promote_pending_rollback_to_previous
  last_good_image="$(container_image_id "$LIVE")"
  last_good_revision="$expected_sha"
  last_good_ref="$image_ref"
  clear_pending
  save_state
  log "deployed $expected_sha"
}

main "$@"
