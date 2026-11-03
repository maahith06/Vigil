# Contributing to VIGIL

Thank you for your interest in contributing to **VIGIL** (Autonomous Astronaut Health Management & Decision Support System). We welcome contributions from engineers, aerospace medicine specialists, data scientists, and designers!

---

## Code of Conduct

We are committed to providing a welcoming, inclusive, and harassment-free environment for everyone. Please be respectful, constructive, and collaborative in all communications.

---

## How Can I Contribute?

- **Reporting Bugs:** File an issue detailing the bug, steps to reproduce, expected vs. observed behavior, and system environment.
- **Suggesting Enhancements:** Open an issue proposing new aerospace physiological scenarios, telemetry visualizations, or clinical decision protocols.
- **Code Contributions:** Submit pull requests for bug fixes, performance improvements, UI enhancements, or new automated tests.

---

## Development Setup

1. **Fork and Clone:**
   ```bash
   git clone https://github.com/your-username/vigil-astronaut-health.git
   cd vigil-astronaut-health
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Start the Local Development Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

4. **Run Unit Tests:**
   ```bash
   npm run test
   ```

5. **Typecheck & Lint:**
   ```bash
   npm run lint
   ```

---

## Pull Request Guidelines

1. **Branch Naming:**
   - `feature/your-feature-name`
   - `fix/your-bugfix`
   - `docs/your-doc-update`

2. **Commit Messages:**
   - Use clear, conventional commit messages:
     - `feat: add cardiovascular lower-body negative pressure calculation`
     - `fix: prevent premature PVT trial termination on keyup`
     - `docs: update NASA-STD-3001 reference table`

3. **Quality Standards:**
   - All TypeScript code must compile without errors (`npm run lint`).
   - Unit tests must pass (`npm run test`).
   - Ensure the application builds cleanly (`npm run build`).
   - **Zero Secrets:** Never commit real API keys, credentials, or private configuration files.

---

## Aerospace Clinical Modeling Guidelines

When contributing new scenarios or physiological calculations:
- Cite authoritative aerospace medicine literature (NASA Human Research Program, NASA-STD-3001, ESA/JAXA spaceflight medicine studies).
- Individualize baselines: deviations must be measured against personal cruise baselines, not arbitrary thresholds.
- Do not make false-healthy assumptions when telemetry is degraded or sensors are disconnected.
- Maintain the explainable decision-support philosophy: every alert must explain *what changed*, *why it matters*, and *what the crew should do next*.
