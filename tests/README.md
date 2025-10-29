# Tests

This directory contains all test files for CatchMaster Delux.

## Structure

```
tests/
├── unit/                    # Unit tests
│   └── migration-mapping.test.js
├── integration/             # Integration tests
│   └── (coming soon)
└── e2e/                     # End-to-end tests
    └── (coming soon)
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Types

### Unit Tests
Test individual functions and modules in isolation.
- Located in `tests/unit/`
- Fast execution
- No external dependencies

### Integration Tests
Test how different parts of the system work together.
- Located in `tests/integration/`
- May require database or API connections

### End-to-End Tests
Test complete user workflows from start to finish.
- Located in `tests/e2e/`
- Simulate real user interactions

## Writing Tests

### Unit Test Example

```javascript
const { myFunction } = require('../../src/myModule');

describe('myFunction', () => {
  it('should return expected result', () => {
    const result = myFunction('input');
    expect(result).toBe('expected output');
  });

  it('should handle edge cases', () => {
    expect(() => myFunction(null)).toThrow();
  });
});
```

### Test Coverage Goals

- Unit tests: Aim for 80%+ coverage of business logic
- Integration tests: Cover all critical API endpoints
- E2E tests: Cover main user workflows

## Current Test Status

### Unit Tests ✅
- [x] Firebase to Payload mapping functions
- [ ] Upload service functions
- [ ] Utility functions

### Integration Tests 🚧
- [ ] Upload API endpoint
- [ ] Migration POC script
- [ ] Supabase failover

### E2E Tests 🚧
- [ ] User signup and login
- [ ] Game collection management
- [ ] Media upload flow
- [ ] Pokebox navigation

## Testing Dependencies

- **Jest**: Testing framework
- **Supertest**: HTTP assertion library (for API tests)
- **Playwright**: Browser automation (for E2E tests)

## Continuous Integration

Tests are automatically run on:
- Every push to feature branches
- Every pull request to main
- Scheduled nightly builds

See `.github/workflows/ci.yml` for CI configuration.
