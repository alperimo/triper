# Git Setup for Triper Monorepo

## Repository Structure

This is a **monorepo** managed with **pnpm workspaces**. There is **ONE** git repository at the root that tracks all packages.

```
triper/                    ← Single .git directory here
├── .git/
├── .gitignore            ← Root gitignore (applies to all)
├── .gitattributes        ← Git settings (line endings, etc.)
├── pnpm-lock.yaml        ← Committed (for reproducible installs)
├── apps/
│   └── web/              ← No .git, no .gitignore here
└── packages/
    └── contracts/        ← No .git, no .gitignore here
```

## Why Single Git Repo?

### ✅ Benefits
- **Atomic commits** across frontend + contracts
- **Single version history** for the entire project
- **Easier coordination** when changing shared types
- **Simpler CI/CD** - one pipeline for everything
- **Better for hackathons** - submit one repo

### ❌ Avoid Multiple Repos
- Don't use git submodules (complex, error-prone)
- Don't have `.git` in subdirectories (creates conflicts)
- Don't have duplicate `.gitignore` files (root covers all)

## pnpm + Git Integration

### Lockfile Management

**ALWAYS commit `pnpm-lock.yaml`** to git:
```bash
git add pnpm-lock.yaml
```

This ensures:
- Reproducible installs across machines
- CI/CD gets exact same versions
- Team members install same dependencies

### Ignore Other Lockfiles

The `.gitignore` excludes:
- `package-lock.json` (npm)
- `yarn.lock` (yarn)

Only pnpm's lockfile is tracked.

### Node Modules

**NEVER commit `node_modules/`** - it's in `.gitignore`

When cloning the repo:
```bash
git clone <repo>
cd triper
pnpm install  # Recreates node_modules from lockfile
```

## Common Commands

### Initial Setup
```bash
# Clone and install
git clone <your-repo-url>
cd triper
pnpm install

# Start development
pnpm dev
```

### Daily Workflow
```bash
# Make changes to any package
# ...

# Stage all changes
git add .

# Commit with descriptive message
git commit -m "feat: add trip creation UI"

# Push to remote
git push
```

### Adding Dependencies
```bash
# Add to specific package
pnpm add --filter web some-package

# Add to contracts
pnpm add --filter contracts some-package

# Add to root (dev tools)
pnpm add -D -w prettier

# Git will track updated package.json and pnpm-lock.yaml
```

## Commit Message Convention

Use conventional commits for better changelog generation:

```bash
# Features
git commit -m "feat(web): add trip creation modal"
git commit -m "feat(contracts): implement MPC matching"

# Fixes
git commit -m "fix(web): wallet connection timeout"
git commit -m "fix(contracts): overflow in date calculation"

# Docs
git commit -m "docs: update README with deployment guide"

# Chores
git commit -m "chore: update dependencies"
git commit -m "chore(contracts): configure Anchor for devnet"

# Refactor
git commit -m "refactor(web): extract map logic to custom hook"
```

Format: `<type>(<scope>): <description>`

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting, semicolons, etc.
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance, deps, config

Scopes:
- `web`: Frontend (apps/web)
- `contracts`: Smart contracts (packages/contracts)
- `sdk`: SDK package
- `types`: Shared types
- (leave blank for root/multiple packages)

## Branching Strategy

For hackathon (simple):
```bash
main          # Stable, deployable code
└── dev       # Active development
    └── feature/trip-ui
    └── feature/arcium-integration
```

For production (later):
```bash
main          # Production
└── develop   # Integration branch
    └── feature/*
    └── fix/*
    └── chore/*
```

## .gitignore Highlights

### What's Tracked ✅
- Source code (`src/**/*.ts`, `*.rs`)
- Configuration (`package.json`, `Cargo.toml`, `Anchor.toml`)
- Documentation (`README.md`, `PROGRESS.md`)
- Lockfile (`pnpm-lock.yaml`)
- Environment templates (`.env.local.example`)

### What's Ignored ❌
- Dependencies (`node_modules/`, `target/`)
- Build outputs (`.next/`, `dist/`)
- Environment secrets (`.env.local`)
- IDE settings (`.vscode/` except approved files)
- Logs (`*.log`)
- OS files (`.DS_Store`)

## GitHub Setup (when ready)

```bash
# Create repo on GitHub
# Then connect:
git remote add origin https://github.com/yourusername/triper.git
git branch -M main
git push -u origin main

# For private repo (recommended for hackathon):
# Create as private on GitHub

# For public repo:
# Create as public (good for portfolio after hackathon)
```

## Useful Git Commands

### Check Status
```bash
git status                    # See changed files
git diff                      # See changes
git log --oneline            # View commit history
```

### Undo Changes
```bash
git restore <file>           # Discard changes to file
git restore .                # Discard all changes
git reset --soft HEAD~1      # Undo last commit (keep changes)
git reset --hard HEAD~1      # Undo last commit (delete changes)
```

### View History
```bash
git log --oneline --graph    # Pretty commit tree
git log --all --decorate     # All branches
git blame <file>             # See who changed what
```

### Clean Up
```bash
git clean -fd                # Remove untracked files
git gc                       # Garbage collection (cleanup)
```

## Monorepo Benefits with Git

1. **Atomic Changes**: Change frontend + contracts in one commit
   ```bash
   git commit -m "feat: implement matching - update contract + UI"
   ```

2. **Easy Review**: See all related changes together
   ```bash
   git diff HEAD~1  # Shows changes across all packages
   ```

3. **Simplified CI/CD**: One workflow for everything
   ```yaml
   # .github/workflows/ci.yml
   - run: pnpm install
   - run: pnpm build    # Builds all packages
   - run: pnpm test     # Tests all packages
   ```

4. **Better Refactoring**: Move code between packages easily
   ```bash
   git mv apps/web/src/lib/encryption.ts packages/sdk/src/
   ```

## Integration with pnpm

### How pnpm Handles Git

pnpm respects `.gitignore` when:
- Creating `node_modules/`
- Generating `pnpm-lock.yaml`
- Running scripts

### Workspace Dependencies

When you use workspace dependencies:
```json
{
  "dependencies": {
    "@triper/types": "workspace:*"
  }
}
```

Git tracks:
- The reference in `package.json`
- Changes to the linked package
- Updated `pnpm-lock.yaml`

## Troubleshooting

### Problem: "pnpm-lock.yaml has conflicts"

After merge conflicts:
```bash
# Option 1: Accept theirs
git checkout --theirs pnpm-lock.yaml
pnpm install

# Option 2: Regenerate
rm pnpm-lock.yaml
pnpm install

# Then commit
git add pnpm-lock.yaml
git commit -m "chore: regenerate pnpm-lock after merge"
```

### Problem: "node_modules taking up space"

```bash
# Clean all node_modules
pnpm clean     # If you have this script

# Or manually
rm -rf node_modules apps/*/node_modules packages/*/node_modules

# Reinstall
pnpm install
```

### Problem: "Git is slow with large files"

Add to `.gitattributes`:
```
*.so filter=lfs diff=lfs merge=lfs -text
*.wasm filter=lfs diff=lfs merge=lfs -text
```

Requires Git LFS:
```bash
brew install git-lfs
git lfs install
```

## Pre-commit Hooks (Optional)

Add quality checks before commits:

```bash
# Install husky
pnpm add -D -w husky lint-staged

# Initialize
npx husky init
```

Create `.husky/pre-commit`:
```bash
#!/bin/sh
pnpm lint
pnpm test
```

## Summary

✅ **Single git repo** at root  
✅ **pnpm-lock.yaml** committed  
✅ **node_modules/** ignored  
✅ **Conventional commits** recommended  
✅ **Atomic changes** across packages  
✅ **Simple workflow** for hackathon  

---

**Last Updated**: October 11, 2025  
**Maintained By**: Triper Team
