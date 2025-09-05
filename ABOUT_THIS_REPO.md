# About This Repository

## 🌱 Garden Tour Development Project

This repository contains a static web application for interactive garden tours, featuring mapping, gamification, and offline capabilities.

## 🚨 Golden Rules for Contributors

### Before You Leave Any Environment
```bash
git add .
git commit -m "Descriptive message about your changes"
git push origin main
```

### Before You Start Work in Any Environment
```bash
git pull origin main
git status  # Verify clean working state
```

**Remember**: Always **push before you leave**, **pull before you start**

## 🔄 Multi-Environment Workflow

This project supports development in:
- **Replit** (online IDE with live preview)
- **VS Code** (local development)
- **GitHub** (direct web editing)

### Environment-Specific Commands

**In Replit:**
- Push: `gpush main`
- Pull: `gpull main`

**In VS Code/Local:**
- Push: `git push origin main`
- Pull: `git pull origin main`

## 📁 Project Structure

```
garden_tour/
├── index.html          # Main application entry
├── app.js             # Core application logic
├── style.css          # Application styling
├── manifest.json      # PWA configuration
├── service-worker.js  # Offline functionality
├── poi/               # Point of interest pages
├── icons/             # Application icons
├── observations.json  # Garden data
└── docs/              # Documentation files
```

## 🌿 Branching Strategy

### Feature Development
```bash
# Start new feature
git checkout main
git pull origin main
git checkout -b feature-name
git merge main

# Work and commit
git add -A
git commit -m "Feature: description"
git push origin feature-name

# Merge when complete
git checkout main
git pull origin main
git merge feature-name
git push origin main
```

### Quick Fixes
```bash
# Direct to main for small changes
git add .
git commit -m "Fix: description"
git push origin main
```

## 🔧 Development Setup

### Local Development
1. Clone repository
2. Open in your preferred IDE
3. Start local server for testing
4. Follow git workflow above

### Replit Development
1. Project auto-configures with `.replit` file
2. Server runs automatically on port 5000
3. Use `gpush`/`gpull` aliases for git operations

## 📋 File Management

### Always Commit ✅
- Source code (.html, .js, .css)
- Documentation (.md files)
- Configuration (manifest.json, .replit)
- Data files (observations.json)

### Never Commit ❌
- Cache files (.cache/)
- System files (.DS_Store)
- Temporary files (*.tmp, *.log)
- IDE settings (.vscode/, .idea/)

The `.gitignore` file handles most exclusions automatically.

## 🚑 Emergency Recovery

If git gets tangled:
```bash
# Reset to last good state
git reset --hard HEAD
git clean -fd

# Sync with GitHub
git fetch origin
git reset --hard origin/main
```

## 🎯 Project Goals

- **Simple**: Static HTML/JS for easy deployment
- **Robust**: Avoid file-locking issues
- **Portable**: Works in multiple development environments
- **Professional**: Proper git workflow and documentation

## 📞 Getting Help

- Check `SYNC_WORKFLOW.md` for detailed git commands
- Review `DEVELOPER_GUIDE.md` for technical details
- Consult `USER_GUIDE.md` for application features

---

**Remember the Golden Rule**: Always sync before switching environments! 🔄