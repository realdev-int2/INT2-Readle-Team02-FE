# Frontend EC2 Deploy

GitHub Actions deploys only the immutable image digest produced by `publish-image`:

```text
ghcr.io/<owner>/<repository>@sha256:<digest> <40-char-git-sha>
```

The host script verifies that digest's `org.opencontainers.image.revision` label equals the SHA, starts `readle-frontend-candidate` for non-routing preflight, then replaces the single live `readle-frontend`.

## Install

```bash
sudo install -d -m 0755 /usr/local/libexec/readle-frontend
sudo install -m 0755 ops/frontend/deploy-frontend.sh /usr/local/libexec/readle-frontend/deploy-frontend
sudo install -d -m 0755 /etc/readle
printf '%s\n' 'ghcr.io/realdev-int2/int2-readle-team02-fe' | \
  sudo tee /etc/readle/frontend-image-repository >/dev/null
sudo chmod 0644 /etc/readle/frontend-image-repository
```

`/etc/readle/frontend-image-repository` is the host allowlist. On repository transfer, replace its one line with the new `ghcr.io/<owner>/<repository>` value before enabling deployment. The script does not accept image repositories outside this file.

Create a dedicated deploy user/key and allow only this command through sudo. Keep the GHCR pull credential on EC2:

```bash
printf '%s' "$GHCR_PULL_TOKEN" | sudo podman login ghcr.io -u "$GHCR_USERNAME" --password-stdin
```

Do not store GHCR credentials in GitHub.

## GitHub Environment

Production environment secrets:

```text
EC2_SSH_PRIVATE_KEY
EC2_KNOWN_HOSTS
```

Production environment variables:

```text
EC2_HOST
EC2_USER
```

Before enabling deploys, prove a GitHub-hosted runner can SSH to the pinned host with that key. If it cannot, deployment is blocked; this plan does not change security groups, firewall rules, networks, or backend services.

## Host Preflight

```bash
sudo podman network exists readle-public
sudo podman container exists readle-nginx
sudo curl --max-time 5 -fsS http://127.0.0.1/
```

Edge Nginx must proxy `/` to `readle-frontend:8080` on `readle-public`.

## State

`/var/lib/readle/frontend-deploy.env` records deployment state:

- `last_good_image`, `last_good_revision`, `last_good_ref`: current last-good live frontend state.
- `previous_image`, `previous_revision`, `previous_ref`: durable previous frontend state for manual rollback.
- `pending_rollback_image`, `pending_rollback_revision`, `pending_rollback_ref`: automatic cutover rollback state only. The deploy script sets it immediately before live replacement and clears it after success or rollback.

Do not use `pending_rollback_*` as manual deploy input.

## Manual Deploy Or Rollback

Deploy a pinned image:

```bash
sudo /usr/local/libexec/readle-frontend/deploy-frontend \
  ghcr.io/<owner>/<repository>@sha256:<digest> \
  <40-char-git-sha>
```

Inspect state:

```bash
sudo cat /var/lib/readle/frontend-deploy.env
sudo podman ps --filter name=readle-frontend
sudo podman logs --tail=200 readle-frontend
sudo podman logs --tail=200 readle-nginx
sudo curl --max-time 5 -fsS http://127.0.0.1/
```

Automatic rollback uses `pending_rollback_*` only during a failed cutover. For manual rollback, use `previous_ref` and `previous_revision` only when `previous_ref` is a GHCR immutable digest. If it is a local image ID, obtain the matching digest and SHA from release or workflow history.

To disable production deploys, disable or delete the production deploy workflow/job in the GitHub UI.

## Concurrency And Downtime

The workflow serializes production deployments, but close `main` pushes can collapse to the latest pending run. It does not guarantee every commit deploys in order.

This is a non-routing candidate preflight followed by single-live replacement. Both candidate and live frontend containers use a 192 MB memory limit. Expect short downtime while `readle-frontend` and `readle-nginx` restart.
