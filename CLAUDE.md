@AGENTS.md
@docs/project-context.md
@docs/development-guide.md

## Claude Code Notes

- Prefer the shared agent guidance from `AGENTS.md` as the primary source of project context.
- Use `CLAUDE.md` as the project-level memory file for Claude Code.
- Always answer in Ukrainian by default.
- Optimize for the smallest safe diff and ask first before substantial multi-file or architectural changes.
- Do not guess undocumented APIs, schemas, or library contracts when they can be verified from code, docs, or tools.
- Prefer verified documentation/tools as the source of truth for setup and configuration work.
- Preserve semantics, accessibility, SEO, and performance when changing public-facing UI.
- Keep instructions concise and aligned with the actual state of the repository.
