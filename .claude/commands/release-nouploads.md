# Release a new version of nouploads

Analyze all commits since the last git tag and prepare a release. A tag push triggers `.github/workflows/release.yml`, which publishes the public workspace packages (currently just `nouploads`, the CLI) to npm with provenance attestation, then creates the GitHub Release, then dispatches the deploy.

## Instructions

1. Run `git describe --tags --abbrev=0` to find the last release tag. If no tags exist, note this is the first release.
2. Run `git log <last_tag>..HEAD --pretty=format:"%h %s" --no-merges` to see all commits since then. If no tags, use `git log --pretty=format:"%h %s" --no-merges`.
3. Count the commits and summarize what changed, categorizing by:
   - **Added**: new tools, features, pages (from `feat:` commits)
   - **Fixed**: bug fixes (from `fix:` commits)
   - **Maintenance**: refactors, dependency updates, CI changes (from `chore:`, `ci:`, `refactor:`, `docs:`, `build:`, `test:`, `style:` commits)
4. Present to me:
   - Current version (read from root `package.json`)
   - Number of commits since last release
   - Categorized summary of changes
   - Your recommendation: `patch`, `minor`, or `major` (with reasoning)
5. Ask me to confirm the bump type.
6. Once I confirm, execute the release steps manually (do NOT run `scripts/release.sh` because it has an interactive prompt that won't work in Claude Code):
   a. Calculate the new version number.
   b. Bump every workspace `package.json` **and** the root `package.json` in lockstep:
      ```bash
      node scripts/bump-workspace-versions.mjs NEW_VERSION
      ```
      This keeps `nouploads`, `@nouploads/core`, `@nouploads/cli`, `@nouploads/backend-canvas`, `@nouploads/backend-sharp`, `@nouploads/web`, and the root monorepo on the same version string — which is what `pnpm -r publish` relies on.
   c. Build the changelog entry (categorized with ### Added / ### Fixed / ### Maintenance sections).
   d. Prepend the entry to `CHANGELOG.md` (after the `# Changelog` header, before previous entries). Keep entries user-facing — no test counts, internal refactors without user impact, or CI-only changes.
   e. Stage: `git add package.json apps/web/package.json packages/*/package.json CHANGELOG.md`.
   f. Commit: `git commit -m "chore: release vNEW_VERSION"`.
   g. Tag: `git tag vNEW_VERSION`.
   h. Push: `git push origin main && git push origin vNEW_VERSION`.
7. Confirm the release was pushed and share both links:
   - GitHub release: `https://github.com/nouploads/nouploads/releases/tag/vNEW_VERSION`
   - npm package (once the workflow finishes): `https://www.npmjs.com/package/nouploads/v/NEW_VERSION`

## What the workflow does after the tag lands

`release.yml` runs on every `v*` tag push:

1. Installs pnpm + Node 22 + workspace deps.
2. Builds every workspace.
3. Runs `pnpm -r publish --access public --no-git-checks` — publishes any workspace that (a) isn't `private: true` and (b) has a version not yet on npm. Today only `nouploads` (the CLI) is public; the rest stay private and are skipped automatically.
4. Creates the GitHub Release with the matching `CHANGELOG.md` section as the body.
5. Dispatches a `deploy` event to the downstream web-app deploy repo.

If the workflow is missing `NPM_TOKEN` the publish step no-ops cleanly and the rest of the release continues — useful for emergency patches where you only want the GitHub tag.

## Input

$ARGUMENTS — one of: `patch`, `minor`, `major`, or empty (you recommend based on commits)
