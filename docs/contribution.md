# TrustChain-5G Contribution & Quality Assurance Standards

We welcome contributions to the TrustChain-5G platform. To ensure platform security and high architectural reliability across enterprise telecommunication environments, all contributors must observe the workflows defined below.

---

## 1. Git Branching Strategy

We operate on a **Feature-Branch Workflow** directly anchored to milestone sprint targets:

- `main` / `master`: Production-ready release baseline. Highly stable; direct pushes are strictly prohibited.
- `develop`: Primary integration branch for active sprint engineering.
- `sprint-N/<feature-name>`: Dedicated feature branches for task implementation (e.g., `sprint-3/random-forest-classifier` or `sprint-5/bayesian-trust-engine`).

### Creating a Branch
```bash
git checkout -b sprint-1/ns3-radio-simulation
```

---

## 2. Code Review & Pull Request Protocol

Every code change must pass rigorous QA review before merging into `develop` or `main`:

1. **Automated Verification**: Your pull request must pass all PyTest backend integrity tests and Vite TypeScript builds with **zero errors and zero compilation warnings**.
2. **Commit Message Format**: Follow standard conventional commits:
   - `feat(ml): implement Random Forest inference evaluation endpoint`
   - `fix(ui): adjust responsive breakpoint on Network Status telemetry card`
   - `docs(readme): update environmental variable descriptions`
   - `test(trust): add unit test coverage for Bayesian decay formulas`
3. **Peer Review**: Require at least two senior engineering sign-offs verifying zero breaking coupling with existing components.

---

## 3. Coding Standards

### Backend (Python)
- Mandate Python 3.11+ type hinting across all function signatures and returns.
- Format all modules using **Black** and enforce linting via **Flake8 / Ruff**.
- Document classes and complex numerical functions using clean Google-style Python docstrings.
- Secure sensitive variables using environment injections (`core/config.py`); never commit secrets or plain-text database credentials.

### Frontend (TypeScript / React)
- Strict adherence to TypeScript type checking (`noImplicitAny: true`). Avoid using `any` types.
- Format code cleanly using **Prettier** and validate via **ESLint** rules.
- Design reusable visual elements as pure functional React components leveraging React hooks and Tailwind design tokens.
- Ensure all interactive elements remain accessible via keyboard navigation (e.g., proper ARIA attributes on modals and dialogs).

---

## 4. Running Verification Test Suites Before Submission
Before submitting a pull request, run local automated diagnostics:

```bash
# Backend Test Validation
cd backend
pytest -v

# Frontend Static Analysis & Production Build Test
cd frontend
npm run lint
npm run build
```
If both tests succeed without exceptions, your codebase is ready for enterprise integration review.
