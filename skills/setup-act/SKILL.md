---
name: setup-act
description: |
  Analyze the repository's GitHub Actions workflows and generate/update the optimal local `act` (nektos/act) configuration for them — runner image mapping, Docker socket handling, secret scaffolding, and task runner shortcuts. Language-agnostic. Use when the user asks to "set up act", "make act work locally", or "run GitHub Actions locally", or after adding/changing `.github/workflows/*.yml`.
  Trigger examples: "Set up act", "Make act work locally", "Run GitHub Actions locally"
---

# Details

Goal: make every workflow in this repository run correctly under `act`, with minimal container weight, without hand-tuning `.actrc` per repository.

## 1. Inventory the Workflows

- List all `.github/workflows/*.yml` (or `.yaml`).
- For each job, record: the `runs-on` value, every `uses:` action, whether it invokes Docker (`docker build`, `docker run`, `services:` blocks, `uses: docker://...`), and references to `${{ secrets.* }}` / `${{ env.* }}`.
- Watch for existing `if: ${{ env.ACT }}` conditions — these are existing act-specific accommodations, so keep them.

## 2. Choose Runner Images

Map each distinct `runs-on` value to a `catthehacker/ubuntu` image tag with the `-P` flag:

- `ubuntu-latest`, `ubuntu-24.04`, `ubuntu-slim`, etc. → `catthehacker/ubuntu:act-24.04` (or the matching Ubuntu version). Use the `-slim` tag only when the workflow needs nothing beyond Node/bash — most workflows that use `setup-*` actions (bun, biome, node) may need to install themselves, so they require the full `act-24.04` tag.
- If a job only runs `docker build`/`docker run` and installs no tooling of its own, `act-24.04` is fine. Do not downgrade to `micro` unless the user explicitly instructs you to, you run the job, and you confirm it still passes.
- Self-hosted or non-Ubuntu `runs-on` values need a manual note in the output — act cannot emulate them, so flag them rather than guessing an image.

## 3. Handle Docker-in-Docker Jobs

If any job builds or runs a Docker image:

- Check whether that job already has an `if: ${{ env.ACT }}` step that installs `docker.io` (or equivalent) — if not, match the pattern of a similar step in another workflow in the repository if one exists; otherwise add a new minimal step.
- `.actrc` needs a working Docker socket. On Windows with Docker Desktop, `--container-daemon-socket -` (automatic) usually works. With Podman machine, use `--container-daemon-socket npipe:////./pipe/<machine-name>`. On Linux/macOS, the default `/var/run/docker.sock` needs no override — add `--container-daemon-socket` only if the default cannot be resolved.

## 4. Scaffold Secrets/Environment Variables as Needed

If any workflow references `${{ secrets.X }}`:

- Do not create `.secrets` itself. Instead, create `.secrets.example` with each required key set to an empty/placeholder value, and add `.secrets` to `.gitignore` if it is not already there.
- Add `--secret-file .secrets` to `.actrc` only if `.secrets` is expected to exist locally. Otherwise, leave it to the user to pass `-s KEY=value` on each run.

## 5. Create `.actrc`

Write one `-P runner=image` line for each distinct `runs-on` value found in step 1, plus the daemon socket line from step 3 if needed. Do not add flags for concerns that do not exist in the workflows (no `--secret-file` if no secrets are used, no extra `-P` entries for unused runners).

## 6. Add Task Runner Shortcuts (language-agnostic — any project with package.json/Makefile/justfile/composer.json/pyproject.toml, etc.)

For each job name, add a convenience script equivalent to `act -j <job-name>`, following the conventions of the task runner already used in the repository (`npm`/`bun` scripts, `Makefile` targets, etc.). Also add a plain `act` script that lists jobs (`act -l`) or runs all jobs, matching the existing naming. If no task runner exists, do not create a new one; report that you skipped this step.

## 7. Verification

Run the following `act` commands in order only if the user explicitly instructs you to, and report failures rather than silently fixing them by guesswork. Without an instruction, do not run them; just present the commands:

```
act -l
act -n                      # dry run, all jobs
act -j <job> --dryrun       # per job, if the -n output is too long
```

For jobs that depend on Docker, a dry run cannot detect daemon socket problems — tell the user so, and only if explicitly instructed, actually run the job (`act -j <job>`) and confirm it reaches the Docker step.

## Output

Report the following: the `.actrc` diff, new `.secrets.example`/`.gitignore` entries, workflow diffs (if changed in step 3), task runner shortcut diffs, and the results of the verification commands (or, if not run, a note saying so along with the commands presented). Flag any `runs-on` that `act` cannot emulate (rather than silently skipping it).
