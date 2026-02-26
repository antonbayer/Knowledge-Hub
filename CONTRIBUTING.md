# Contributing

Contributions are welcome! Here are the ground rules.

## Bugs & Feature Requests

Please create an [issue](../../issues) with:
- **Bug:** What happens? What should happen? Which OS / Node version?
- **Feature:** What's missing? Why would it be useful?

## Pull Requests

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes
4. Open a pull request

### Guidelines

- `vault.js` has zero external dependencies – please keep it that way
- Test before submitting: `node vault.js --help`, `node vault.js status`

## Local Setup

```bash
git clone <your-fork-url>
cd knowledge-vault
cp .env.example .env
# adjust .env
node vault.js status
```

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
