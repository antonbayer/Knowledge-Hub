# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly.

**Do not open a public issue.** Instead, send an email to the repository owner or use [GitHub's private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability).

You should receive a response within 48 hours.

## Scope

This project runs locally and executes shell commands (`git`, `mklink`, `ln -s`). User-supplied input (Git URLs, paths) is passed to these commands. While the tool is designed for local use, command injection via crafted URLs or paths is a relevant concern.
