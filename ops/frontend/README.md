# Frontend EC2 Deploy

GitHub Actions deploys only the immutable image digest produced by `publish-image`:

```text
ghcr.io/realdev-int2/int2-readle-team02-fe@sha256:<digest> <40-char-git-sha>
```

The host script verifies that digest's `org.opencontainers.image.revision` label equals the SHA before it replaces `readle-frontend`.

## Install

```bash
sudo install -d -m 0755 /usr/local/libexec/readle-frontend
sudo install -m 0755 ops/frontend/deploy-frontend.sh /usr/local/libexec/readle-frontend/deploy-frontend
```

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

## Manual Deploy Or Rollback

Deploy a pinned image:

```bash
sudo /usr/local/libexec/readle-frontend/deploy-frontend \
  ghcr.io/realdev-int2/int2-readle-team02-fe@sha256:<digest> \
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

Rollback uses `pending_rollback_image` automatically after a failed cutover. Those state image IDs are internal automatic-rollback data, not manual deploy inputs. For a manual rollback, choose an explicit prior GHCR digest and matching SHA from release or workflow history, then run the deploy command with that digest/SHA pair.

To disable production deploys, disable or delete the production deploy workflow/job in the GitHub UI.

## Concurrency And Downtime

The workflow serializes production deployments, but close `main` pushes can collapse to the latest pending run. It does not guarantee every commit deploys in order.

This is a single-container replacement. Expect short downtime while `readle-frontend` and `readle-nginx` restart.
