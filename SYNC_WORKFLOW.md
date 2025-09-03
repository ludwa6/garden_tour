# Garden Tour - GitHub ↔ Replit Sync Workflow

## Overview
This document outlines the bidirectional sync workflow between GitHub and Replit for the Garden Tour project.

## Setup Status ✅
- **Local Replit**: Clean `.replit` configuration file
- **GitHub main**: Synchronized with Replit state
- **Conflicts**: Resolved (removed problematic `replit.nix`)
- **Sync**: Bidirectional workflow working

## Feature Branch Workflow (Recommended)

### 1. Starting New Feature Work
```bash
# Switch to main and update it
git checkout main
gpull main

# Create/switch to feature branch
git checkout -b feature-name  # or git checkout existing-branch

# Merge latest main into your branch
git merge main
```

### 2. Working on Feature
```bash
# Make your changes, then:
git add -A
git commit -m "Meaningful commit message"
gpush feature-name
```

### 3. Merge Back to Main (when feature complete)
```bash
git checkout main
gpull main
git merge feature-name
gpush main

# Optional: delete feature branch
git branch -d feature-name
```

## Simple Workflow (for quick fixes)

### Direct to Main
```bash
# Make changes directly on main
git add .
git commit -m "Quick fix: description"
gpush main
```

### Pull Updates from GitHub
```bash
gpull main
git status
```

### Testing the Workflow
Run these commands to verify sync is working:
```bash
# Test pull (should show "Already up-to-date")
git pull https://github.com/ludwa6/garden_tour.git main

# Check clean status
git status
```

## File Management

### Keep These Files ✅
- `.replit` - Working configuration for Replit environment
- All project files (HTML, JS, CSS, etc.)
- Documentation files (*.md)

### Automatically Ignored 🚫
- `.cache/` - Replit cache files
- `replit.nix` - Auto-generated Nix configuration
- `.DS_Store` - macOS system files
- Temporary files and IDE configurations

## Troubleshooting

### If Sync Fails
1. Check for untracked files: `git status`
2. If cache files appear: `git clean -fd`
3. Force alignment if needed: `git push --force https://github.com/ludwa6/garden_tour.git main`

### Recovery Commands
```bash
# Clean working directory
git clean -fd

# Reset to last good state
git reset --hard HEAD

# Force sync with GitHub
git pull --force https://github.com/ludwa6/garden_tour.git main
```

## Branch Strategy
- **main**: Production-ready code, synced with GitHub Pages
- **replit-dev**: Development work in Replit
- Merge replit-dev → main when features are complete

## Notes
- Replit automatically serves the site on port 5000
- GitHub Pages deployment target for production
- Static HTML/JS project - no build step required
- Force push is safe when you own the repository

---
**Last Updated**: September 3, 2025  
**Status**: Workflow tested and working ✅