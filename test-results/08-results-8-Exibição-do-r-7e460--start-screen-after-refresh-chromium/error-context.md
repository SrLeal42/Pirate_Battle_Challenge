# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 08-results.spec.ts >> 8. Exibição do resultado e sua persistência após refresh >> should show results and persist them in start screen after refresh
- Location: e2e\08-results.spec.ts:16:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Your ship was destroyed')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('Your ship was destroyed') with timeout 5000ms
  - waiting for getByText('Your ship was destroyed')

```

```yaml
- meter "Health"
- img "Score"
- text: "0"
- img "Time remaining"
- text: 2:00
- button "Pause game"
- status: Match started. 120 seconds on the clock.
```

```
Tearing down "context" exceeded the test timeout of 30000ms.
```