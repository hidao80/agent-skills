---
name: commit-msg
description: |
    Suggest a concise commit message.
    Trigger examples: "Suggest a commit message", "Write a commit message", "Generate a commit message"
---

# commit-msg Skill Details

Suggest a concise commit message based on the changes across all currently staged files. Begin the message with an appropriate gitmoji tag written in shortcode form (e.g., `:sparkles:`).

## Language Rules

Write the commit message in the language most used in the prose of README.md, excluding commands, installation steps, and the like. However, if a locale is specified as a command argument, use the specified language.

Example: for `/commit-msg ja` or `/commit-msg 日本語`, write the commit message in Japanese.

## Top Priority

Rules in `AGENTS.md` and similar files take precedence over the rules in this skill. Where this skill file contains rules not covered by `AGENTS.md`, apply those rules from this skill partially.

## References

- [Gitmoji](https://gitmoji.dev/)
