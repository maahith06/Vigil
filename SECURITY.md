# Security Policy

## Zero-Secret Architecture & Verification

The VIGIL repository has undergone an automated and manual security audit prior to publication to guarantee:

1. **Zero Hardcoded Secrets:** No API keys, access tokens, passwords, private certificates, or cloud service credentials exist within the codebase or Git history.
2. **Environment Variable Hygiene:** Only `.env.example` is committed, providing placeholder variables (`MY_GEMINI_API_KEY`, `MY_APP_URL`).
3. **Hardened Gitignore:** `.gitignore` blocks all variations of `.env`, `.env.*`, `*.pem`, `*.key`, `*.cert`, `build/`, `dist/`, and local test artifacts.
4. **Synthetic Data Only:** All telemetry, crew profiles, and sensor records represent synthetic aerospace medical simulation models; no protected health information (PHI) or personal data is stored.
5. **Offline Independence:** The core application and all 6 mission scenarios run entirely client-side without requiring external network connectivity or remote authentication.

---

## Reporting a Security Vulnerability

If you discover a security vulnerability or accidental exposure in this project:

1. **Do not open a public issue.**
2. Send an email with details of the vulnerability, steps to reproduce, and impact to the repository maintainer.
3. You will receive an acknowledgment within 48 hours.
4. Once validated, a fix will be published promptly in a new release.
