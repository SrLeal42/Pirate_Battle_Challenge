# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 02-assets.spec.ts >> 2. Carregamento dos assets, falhas e nova tentativa >> should show loading, fail due to query param, and retry successfully
- Location: e2e\02-assets.spec.ts:5:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Failed to load assets')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('Failed to load assets') with timeout 5000ms
  - waiting for getByText('Failed to load assets')

```

```yaml
- img "Pirate Battle"
- text: Loading assets
- progressbar "Loading assets"
- status
- button "Network scenarios": ⚙
```

```
Tearing down "context" exceeded the test timeout of 30000ms.
```