# Release a new version of nouploads

Analyze all commits since the last git tag and prepare a release.

## Instructions

1. Run `git describe --tags --abbrev=0` to find the last release tag. If no tags exist, note this is the first release.
2. Run `git log <last_tag>..HEAD --pretty=format:"%h %s" --no-merges` to see all commits since then. If no tags, use `git log --pretty=format:"%h %s" --no-merges`.
3. Count the commits and summarize what changed, categorizing by:
   - **Added**: new tools, features, pages (from `feat:` commits)
   - **Fixed**: bug fixes (from `fix:` commits)
   - **Maintenance**: refactors, dependency updates, CI changes (from `chore:`, `ci:`, `refactor:`, `docs:`, `build:`, `test:`, `style:` commits)
4. Present to me:
   - Current version
   - Number of commits since last release
   - Categorized summary of changes
   - Your recommendation: `patch`, `minor`, or `major` (with reasoning)
5. Ask me to confirm the bump type.
6. Once I confirm, execute the release steps manually (do NOT run `scripts/release.sh` because it has an interactive prompt that won't work in Claude Code):
   a. Calculate the new version number
   b. Update `"version"` in the root `package.json` using node:
      ```bash
      node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('package.json','utf8'));p.version='NEW_VERSION';fs.writeFileSync('package.json',JSON.stringify(p,null,2)+'\n')"
      ```
   c. Build the changelog entry (categorized with ### Added / ### Fixed / ### Maintenance sections)
   d. Prepend the changelog entry to `CHANGELOG.md` (after the `# Changelog` header, before previous entries)
   e. Stage: `git add package.json CHANGELOG.md`
   f. Commit: `git commit -m "chore: release vNEW_VERSION"`
   g. Tag: `git tag vNEW_VERSION`
   h. Push: `git push origin main && git push origin vNEW_VERSION`
7. Confirm the release was pushed and provide the link:
   `https://github.com/nouploads/nouploads/releases/tag/vNEW_VERSION`

## Input

$ARGUMENTS — one of: `patch`, `minor`, `major`, or empty (you recommend based on commits)
