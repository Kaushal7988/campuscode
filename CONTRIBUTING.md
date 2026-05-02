# Contributing to CampusCode

## Branch Strategy

```
main        ← stable, deployable
develop     ← integration branch
feature/*   ← new features (branch from develop)
fix/*       ← bug fixes
docs/*      ← documentation only
```

## Workflow

```bash
# 1. Create feature branch from develop
git checkout develop
git checkout -b feature/your-feature-name

# 2. Make your changes
# 3. Commit with clear message
git add .
git commit -m "feat: add leaderboard page"

# 4. Push and open PR to develop
git push origin feature/your-feature-name
```

## Commit Message Format

```
type: short description

Types: feat | fix | docs | style | refactor | test | chore
```

Examples:
- `feat: add voice recording to interview screen`
- `fix: correct timer not resetting on retry`
- `docs: update API endpoint table in README`

## Code Style

- **Python**: PEP 8, max line length 120
- **JavaScript/JSX**: single quotes, 2-space indent
- **No console.log** in committed code (use only for debugging)
- **No hardcoded secrets** — always use `.env`
