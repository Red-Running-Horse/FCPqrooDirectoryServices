# Deploy to Hostinger over SSH (GitHub Actions)

The workflow `.github/workflows/deploy-hostinger.yml` builds the static export
(`npm run build`, which runs `next build --webpack` with `output: "export"`) on
GitHub's runners and copies the **contents of `out/`** into a Hostinger directory
over SSH. It bypasses Hostinger's Next.js WebApp builder, which completes the
Webpack build but then reports `ERROR: No output directory found after build`.

The workflow is **manual only** (`workflow_dispatch`). It never runs on push, so
nothing is deployed until you start a run yourself. Use the temporary staging
domain first; only point it at production once staging is verified.

## 1. Enable SSH on the Hostinger account

1. hPanel → Hosting → your plan → **Advanced → SSH Access** → turn SSH access on.
2. Note the **SSH IP/host**, **port** and **username** shown there.
3. Create a key pair locally (do not reuse a personal key):

   ```sh
   ssh-keygen -t ed25519 -f ~/.ssh/fcpqroo_deploy -C "github-actions deploy" -N ""
   ```

4. hPanel → SSH Access → **SSH keys** → import the contents of
   `~/.ssh/fcpqroo_deploy.pub`.
5. Verify the key works and capture the host key fingerprint:

   ```sh
   ssh -i ~/.ssh/fcpqroo_deploy -p <PORT> <USER>@<HOST> 'pwd; command -v rsync'
   ssh-keyscan -p <PORT> -H <HOST>
   ```

   The `ssh-keyscan` output is what goes into the known-hosts secret; the
   workflow uses `StrictHostKeyChecking=yes` and never accepts unknown hosts.

### Least-privilege notes

Hostinger shared hosting exposes a single SSH user per account, so a separate
deploy-only OS user is usually not possible. Limit the blast radius instead:

- Use a dedicated key that is only stored in this repository's secrets, and
  remove it from hPanel when it is no longer needed.
- Point `HOSTINGER_REMOTE_DIR` at one specific document root (the staging
  domain's `public_html`), never at `/home/<user>` or a shared parent.
- If the plan offers per-domain SSH/FTP users with a home directory restricted
  to the staging domain, prefer that user.

## 2. Configure GitHub secrets and variables

Repository → Settings → Secrets and variables → Actions.

| Kind | Name | Example / notes |
| --- | --- | --- |
| Secret | `HOSTINGER_SSH_HOST` | SSH host or IP from hPanel |
| Secret | `HOSTINGER_SSH_USER` | SSH username from hPanel (e.g. `u853557685`) |
| Secret | `HOSTINGER_SSH_PRIVATE_KEY` | Full contents of `~/.ssh/fcpqroo_deploy` (private key, including the BEGIN/END lines) |
| Secret | `HOSTINGER_SSH_KNOWN_HOSTS` | Output of `ssh-keyscan -p <PORT> -H <HOST>` |
| Variable | `HOSTINGER_SSH_PORT` | SSH port from hPanel (defaults to `22` when unset or empty) |
| Variable | `HOSTINGER_REMOTE_DIR` | Absolute target directory, e.g. `/home/u853557685/domains/staging.fcpqroo.mx/public_html` |

No credentials belong in source control; the workflow reads everything from
secrets/variables and deletes the private key and known-hosts file from the
runner when it finishes.

The workflow validates these values before connecting: the host may contain only
letters, digits, `.`, `-` and `:`; the user only letters, digits, `.`, `-` and
`_`; the port must be numeric; and the remote directory must be a single-line
absolute path without spaces, quotes, backslashes, `$` or backticks.

If any of the values above are unknown, leave them unset: the workflow fails
fast with a message naming the missing secret, variable or input.

## 3. Run a staging deployment

1. Actions → **Deploy static export to Hostinger** → **Run workflow**.
2. Optionally set the `remote_dir` input to override `HOSTINGER_REMOTE_DIR` for
   that run (useful for testing staging while the variable still points
   elsewhere). It must be an absolute path without spaces or shell
   metacharacters.
3. The run checks out the source, sets up Node.js 22 (npm cache when
   `package-lock.json` exists), installs with `npm ci` (falling back to
   `npm install` only if the lockfile is ever removed), runs `npm test` (skipped
   if the `test` script is ever removed), builds, asserts that `out/index.html`
   exists, and only then uploads.

Transfer method: the workflow checks whether `rsync` exists on the Hostinger
host and uses `rsync` over SSH if it does; otherwise it streams a tar archive
over SSH and extracts it into the target directory. Both copy the **contents**
of `out/`, not the `out/` directory itself, and both handle arbitrary filenames
without shell globbing.

`--delete` is intentionally **not** used, so unrelated files already in the
target directory (for example `.htaccess` or other apps) are left alone. The
trade-off is that files removed from a later build stay behind on the server;
delete them manually, or only enable `--delete` after confirming the target
directory contains nothing but this site.

## 4. Verify the staging site

- Open `https://staging.fcpqroo.mx/` — the homepage should render.
- Internal routes (for example a deliberate 404) should serve `404.html`.
- The map should draw roads and markers.
- In the browser devtools Network tab there should be no 404s for `/_next/*`.
- `https://staging.fcpqroo.mx/regional-highways.geojson` should return the
  GeoJSON file.

## 5. Production

Leave production (`fcpqroo.mx`) on the current manual upload until you approve
switching. When you do, either update `HOSTINGER_REMOTE_DIR` to the production
document root or pass it as the `remote_dir` input for a single run. Adding a
`push` trigger is a separate, deliberate change.
