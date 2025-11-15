# Development Workflow

## Git Workflow

- Use feature branches for all development: `git checkout -b feature/feature-name`
- Commit frequently with descriptive messages
- Use conventional commit format: `type(scope): description`
  - Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`
- Create pull requests for code review before merging to main
- Tag releases: `git tag -a v1.0.0 -m "Release version 1.0.0"`

## Development Process

1. **Plan**: Reflect on 5-7 potential problem sources, distill to 1-2 core issues
2. **Validate**: Add logs to validate assumptions before implementing fixes
3. **Implement**: Write modular, interoperable code
4. **Iterate**: After iteration, tidy and refactor new code
5. **Test**: Ensure no duplicate ports, test in production-like environment (no mocks)

## Code Principles

- **Programmatic over hardcode**: Use configuration files, environment variables
- **Modular**: Create reusable, interoperable modules
- **Production-ready**: Assume production environment, avoid mocks/simulations
- **Simple**: Prefer direct, minimal complexity solutions

## Branch Strategy

- `main`: Production-ready code
- `develop`: Integration branch
- `feature/*`: Feature development
- `fix/*`: Bug fixes
- `refactor/*`: Code refactoring

## Testing

- Write tests for critical functionality
- Test against real Polkadot networks (Westend testnet)
- No mocking of blockchain interactions

## Deployment

- Use environment-specific configuration
- Ensure all ports are unique and documented
- Test deployment in staging before production

