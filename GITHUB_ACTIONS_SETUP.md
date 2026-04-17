# GitHub Actions CI/CD Setup for PDV Pocket

This document explains the GitHub Actions workflows configured for PDV Pocket.

## Workflows

### 1. Audit Workflow (`.github/workflows/audit.yml`)

**Triggers**: Push to `main`/`develop`, Pull Requests, Manual dispatch

**Jobs**:
- **Audit**: Runs TypeScript check, unit tests, and project audit
- **Lint**: Runs ESLint and format checks
- **Build**: Builds the project (only if audit and lint pass)

**Features**:
- ✅ Automated project audit using mobile-app-audit-fix skill
- ✅ TypeScript compilation check
- ✅ Unit tests execution
- ✅ Linting and code quality checks
- ✅ Automatic PR comments with results
- ✅ Build artifact upload
- ✅ Fails build if critical issues found

**PR Comment Example**:
```
## ❌ Mobile App Audit Report

**Summary:**
- Issues: 2
- Warnings: 1
- Passed: 15

**Details:**
[Full audit report...]
```

### 2. Test Workflow (`.github/workflows/test.yml`)

**Triggers**: Push to `main`/`develop`, Pull Requests, Manual dispatch

**Jobs**:
- **Test**: Runs unit tests and generates coverage report

**Features**:
- ✅ Comprehensive unit test execution
- ✅ Coverage report generation
- ✅ Automatic PR comments with coverage metrics
- ✅ Test results artifact upload

**PR Comment Example**:
```
## 📊 Test Coverage Report

| Metric | Coverage |
|--------|----------|
| Lines | 85% |
| Statements | 85% |
| Functions | 80% |
| Branches | 75% |
```

## Setup Instructions

### Step 1: Push to GitHub

The workflows are already configured in `.github/workflows/`. Just push to GitHub:

```bash
git add .github/workflows/
git commit -m "Add GitHub Actions CI/CD workflows"
git push origin main
```

### Step 2: Enable GitHub Actions

1. Go to your repository on GitHub
2. Click **Settings** → **Actions** → **General**
3. Ensure "Actions permissions" is set to "Allow all actions and reusable workflows"

### Step 3: Verify Workflows

1. Go to **Actions** tab in your repository
2. You should see "Mobile App Audit & Quality Check" and "Tests & Coverage" workflows
3. Click on a workflow to see details

### Step 4: Configure Branch Protection (Optional)

To require workflows to pass before merging:

1. Go to **Settings** → **Branches**
2. Click **Add rule** under "Branch protection rules"
3. Set branch name pattern: `main` or `develop`
4. Enable "Require status checks to pass before merging"
5. Select the workflows:
   - "Project Audit"
   - "Unit Tests"
   - "Linting"
   - "Build"

## Customization

### Change Trigger Branches

Edit `.github/workflows/audit.yml` and `.github/workflows/test.yml`:

```yaml
on:
  push:
    branches: [main, develop, staging]  # Add more branches
  pull_request:
    branches: [main, develop, staging]
```

### Change Node Version

Edit the `Setup Node.js` step:

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '22'  # Change version here
```

### Adjust Failure Threshold

Edit the "Fail if critical issues" step in `audit.yml`:

```yaml
- name: Fail if critical issues
  run: |
    ISSUES=${{ steps.parse.outputs.issues }}
    if [ "$ISSUES" -gt 5 ]; then  # Allow up to 5 issues
      exit 1
    fi
```

### Add Slack Notifications

Add to `audit.yml`:

```yaml
- name: Notify Slack on failure
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK }}
    payload: |
      {
        "text": "PDV Pocket audit failed!",
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "*Mobile App Audit Failed*\n${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"
            }
          }
        ]
      }
```

Then add secret in GitHub:
1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `SLACK_WEBHOOK`
4. Value: Your Slack webhook URL

### Add Email Notifications

Add to `audit.yml`:

```yaml
- name: Send email on failure
  if: failure()
  uses: dawidd6/action-send-mail@v3
  with:
    server_address: ${{ secrets.EMAIL_SERVER }}
    server_port: ${{ secrets.EMAIL_PORT }}
    username: ${{ secrets.EMAIL_USERNAME }}
    password: ${{ secrets.EMAIL_PASSWORD }}
    subject: "❌ PDV Pocket Audit Failed"
    to: team@example.com
    from: ci@example.com
    body: |
      Audit failed for commit: ${{ github.sha }}
      View details: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
```

## Troubleshooting

### Workflow not running

**Cause**: Workflows not enabled or branch protection not configured

**Fix**:
1. Check **Actions** tab → verify workflows are listed
2. Go to **Settings** → **Actions** → **General**
3. Ensure "Actions permissions" is enabled

### Audit script not found

**Cause**: URL to audit_project.py is incorrect

**Fix**: Update URL in `audit.yml`:
```yaml
curl -fsSL -o .audit/audit_project.py \
  https://raw.githubusercontent.com/your-org/skills/main/mobile-app-audit-fix/scripts/audit_project.py
```

### PR comments not appearing

**Cause**: GitHub token permissions insufficient

**Fix**: Check workflow permissions in **Settings** → **Actions** → **General** → **Workflow permissions**
- Ensure "Read and write permissions" is selected

### Build fails unexpectedly

**Cause**: Dependencies or environment issue

**Fix**:
1. Check workflow logs in **Actions** tab
2. Look for error messages in the failed step
3. Try running locally: `pnpm install && pnpm check && pnpm test`

## Monitoring & Metrics

### View Workflow Runs

1. Go to **Actions** tab
2. Click on a workflow name
3. See all runs with status (✅ passed, ❌ failed)

### View Artifacts

1. Click on a workflow run
2. Scroll to "Artifacts" section
3. Download audit reports, test results, or build artifacts

### View Logs

1. Click on a workflow run
2. Click on a job (e.g., "Project Audit")
3. View detailed logs for each step

## Best Practices

### 1. Keep Workflows Updated

Periodically update action versions:
```bash
# Check for updates
git log --oneline .github/workflows/
```

### 2. Monitor Trends

Track audit results over time:
- Check **Actions** → **Workflows** → **Audit** → **Insights**
- Look for patterns in failures

### 3. Iterate on Thresholds

Start lenient, gradually tighten:
- Week 1: Allow 10 issues
- Week 2: Allow 5 issues
- Week 3+: No issues allowed

### 4. Document Decisions

Add comments in workflows for important decisions:
```yaml
# Allow warnings but fail on critical issues
# This gives developers time to fix gradually
if [ "$ISSUES" -gt 0 ]; then exit 1; fi
```

### 5. Test Locally First

Before pushing, test locally:
```bash
pnpm check
pnpm test
pnpm lint
python .audit/audit_project.py .
```

## Next Steps

1. **Push workflows**: `git push origin main`
2. **Monitor first run**: Check **Actions** tab
3. **Configure notifications**: Add Slack/email alerts
4. **Set branch protection**: Require workflows to pass
5. **Iterate**: Adjust thresholds based on results

## Support

For issues or questions:
1. Check workflow logs in **Actions** tab
2. Review this guide's troubleshooting section
3. Consult GitHub Actions documentation: https://docs.github.com/en/actions
