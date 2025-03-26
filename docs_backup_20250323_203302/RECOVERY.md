# Code Recovery Plan

## Overview
This document outlines the strategy for recovering the codebase to a working state by:
1. Identifying the last known working commit
2. Creating a recovery branch
3. Systematically reapplying features and fixes

## Steps

### 1. Find Last Working Commit
```bash
# View the git history with descriptions
git log --oneline --graph --decorate

# Once you identify a potential working commit, you can check it out temporarily
git checkout <commit-hash>

# Test the application at this point to verify it works
```

### 2. Create Recovery Branch
```bash
# Create and switch to a new recovery branch from the working commit
git checkout -b recovery/<date>_restore <commit-hash>

# Push the branch to remote to preserve it
git push -u origin recovery/<date>_restore
```

### 3. Document Current State
Before proceeding, document what features and fixes need to be reapplied:

- [ ] List each feature/fix here
- [ ] Include relevant commit hashes where possible
- [ ] Note any dependencies between features

### 4. Selective Feature Reapplication
For each feature/fix:

1. Review the changes:
```bash
# View changes for a specific feature
git log -p <feature-commit-hash>

# Or if changes span multiple commits
git log -p <start-commit>..<end-commit>
```

2. Create a feature branch:
```bash
git checkout -b feature/<name> recovery/<date>_restore
```

3. Reapply changes:
   - Manually reimplement the feature
   - Use `git cherry-pick` if the changes are clean
   - Test thoroughly before moving forward

4. Merge back to recovery branch:
```bash
git checkout recovery/<date>_restore
git merge feature/<name>
```

### 5. Testing Protocol
After each feature reapplication:
- Run all tests
- Verify core functionality
- Check for regressions
- Document any issues encountered

### 6. Completion Checklist
- [ ] All critical features reapplied
- [ ] All tests passing
- [ ] Application running as expected
- [ ] Documentation updated
- [ ] New issues documented

## Notes
- Keep this document updated as you progress
- Document any lessons learned or patterns discovered
- Note any improvements made during the recovery process

## Current Situation Analysis

Based on the git history, here are potential stable points to consider:

1. `b9f371d` (v0.7.2) - Last tagged version
2. `7f89e83` (0.7.0) - Open world prototype documentation
3. `317401f` (v0.6.1) - Three.js implementation with known working features
4. `3fed74f` (0.6.0) - Demo version
5. `4c447c6` (0.5.0) - Working Python game version

### Recommended Recovery Point
The recommended recovery point is commit `317401f` (v0.6.1) because:
- It's a tagged release
- It has Three.js implementation working
- It predates the more experimental multiplayer and control system changes

### Features to Reapply
1. Input System Refactor (6f14499)
   - Centralized input system with constants
   - Priority: High
   - Dependencies: None

2. Drone Movement Controls (417a4f2)
   - Improved movement respecting orientation
   - Priority: High
   - Dependencies: Input System

3. Controls Display (9707528)
   - UI improvements for controls
   - Priority: Medium
   - Dependencies: Input System

## Recovery Progress
| Feature | Status | Notes |
|---------|--------|-------|
| Base Three.js Setup | Not Started | Start from v0.6.1 |
| Input System | Not Started | Reimplement from 6f14499 |
| Drone Controls | Not Started | Reimplement from 417a4f2 |
| Controls Display | Not Started | Reimplement from 9707528 | 