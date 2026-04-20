---
name: deployment
description: "Deploy Thina CRM to Firebase App Hosting. Use when deploying, building for production, managing environment variables, tagging releases, running smoke tests, or rolling back. Covers pre-deploy checks, git tagging, and post-deploy verification."
argument-hint: "e.g. 'deploy v1.3.0' or 'rollback to v1.2.0'"
---
# Deployment Skill — Thina CRM

## When to Use
- Deploying a new version to production
- Running pre-deploy checks
- Managing environment variables or secrets
- Tagging a release
- Running post-deploy smoke tests
- Rolling back a failed deployment

## Architecture
- **Platform:** Firebase App Hosting (auto-deploy from GitHub on push to `master`)
- **Region:** africa-south1 (Johannesburg)
- **CI:** GitHub Actions (`.github/workflows/firebase-hosting.yml`) — test + build on push/PR
- **Config:** `apphosting.yaml` (runtime config), `firebase.json` (hosting + Firestore rules)

## Pre-Deploy Checklist

Run these in order before pushing to `master`:

### 1. Pause OneDrive Sync
**CRITICAL:** This workspace is in OneDrive. Pause sync first or `.next` cache corruption will break the build.

### 2. Run Linter
```bash
npm run lint
```
Fix all errors before proceeding.

### 3. Run Unit Tests
```bash
npm run test
```
All tests must pass. Current count: 91 Vitest tests.

### 4. Production Build
```bash
npm run build
```
Verify no build errors. Check for:
- Missing environment variables (build warnings)
- TypeScript errors
- Bundle size regressions

### 5. Version Bump
Update `package.json` version:
```json
"version": "1.X.0"
```
Follow semver:
- **Patch** (1.X.1): bug fixes
- **Minor** (1.X.0): new features
- **Major** (X.0.0): breaking changes

## Deploy Procedure

### Automatic Deploy (recommended)
Push to `master` triggers GitHub Actions → test → build → Firebase App Hosting deploys automatically.
```bash
git add -A
git commit -m "feat: description of changes"
git push origin master
```

### Git Tag
After successful deploy, create an annotated tag:
```bash
git tag -a v1.X.0 -m "v1.X.0 — Brief description of release"
git push origin v1.X.0
```

### Existing Tags
v0.1.0 → v0.2.0 → ... → v1.0.0 → v1.0.1 → v1.1.0 (17 tags total)

## Post-Deploy Verification

### 1. Smoke Test
```bash
npm run test:deploy
# Or with custom URL:
node scripts/test-deploy.mjs https://your-deployment-url
```
Checks: health endpoint, Firestore reachable, env vars configured, home page loads.

### 2. E2E Tests (optional but recommended)
```bash
npm run test:e2e
```
Runs 89 Playwright tests against the live deployment.

### 3. Manual Verification
- Log in with test account
- Check dashboard loads with data
- Verify a CRUD operation (create/edit a lead)
- Check Sentry for new errors

## Environment Variables

### Public (in `apphosting.yaml`)
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

### Secrets (Cloud Secret Manager, referenced in `apphosting.yaml`)
- `GEMINI_API_KEY` — Google AI for CMA research

### GitHub Secrets (for CI)
- `FIREBASE_SERVICE_ACCOUNT` — JSON key for firebase-admin
- All `NEXT_PUBLIC_*` variables above

## Rollback Procedure

### Option 1: Git Revert
```bash
git revert <commit-hash>
git push origin master
```
This triggers a new deployment with the revert.

### Option 2: Checkout Previous Tag
```bash
git checkout v1.X.0
# Create a fix branch from here if needed
```

### Option 3: Firebase Console
Firebase App Hosting keeps rollout history — roll back via Console > App Hosting.

## Runtime Config (`apphosting.yaml`)
```yaml
runConfig:
  minInstances: 0    # Scale to zero when idle (cost savings)
  maxInstances: 2    # Max concurrent instances
  memoryMiB: 512     # Memory per instance
```

## Update Spec Document
After every version release, update the specification document:
```bash
# Update VERSION constant in script, then:
node scripts/generate-spec.mjs
```
See repo memory `/memories/repo/thina-crm-spec-doc.md` for details.
