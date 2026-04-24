# Reference Repos

This folder contains cloned upstream repositories used as local reference material while planning and implementing AgentOrg integrations.

## Cloned Repos

- `InsForge/` from `https://github.com/InsForge/InsForge`
- `insforge-skills/` from `https://github.com/InsForge/insforge-skills`
- `cgstart/` from `https://github.com/chainguardianbb/cgstart`
- `tinyfish-skills/` from `https://github.com/tinyfish-io/skills`

## Usage Rules

- Treat these repos as read-only references.
- Do not commit secrets, local auth files, generated credentials, or vendor build outputs.
- Refresh intentionally with `git -C references/<repo> pull` when docs need updating.
- Project-specific decisions belong in `docs/`, not inside cloned reference repos.

## Current Notes

- InsForge has both SDK and CLI guidance. Use `npx @insforge/cli` for backend infrastructure and `@insforge/sdk` for app code.
- TinyFish requires `TINYFISH_API_KEY` for web-agent calls. The tunneling skill only requires SSH.
- Chainguard containers can be tested without auth; Chainguard Libraries are free for individual developers but require free account setup and a pull token.
- Ghost CLI is installed locally and can create/fork/discard Postgres databases after login or `GHOST_API_KEY` setup.
