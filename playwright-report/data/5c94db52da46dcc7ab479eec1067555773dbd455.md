# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 01-options.spec.ts >> 1. Navegação, validação e persistência das opções >> should persist options after refresh
- Location: e2e\01-options.spec.ts:45:5

# Error details

```
Tearing down "context" exceeded the test timeout of 30000ms.
```

# Page snapshot

```yaml
- generic [ref=f1e3]:
  - generic [ref=f1e4]:
    - generic [ref=f1e8]:
      - heading "Options" [level=1] [ref=f1e9]
      - generic [ref=f1e10]:
        - generic [ref=f1e11]: Match Duration
        - generic [ref=f1e12]:
          - button [ref=f1e13] [cursor=pointer]:
            - img "-" [ref=f1e14]
          - generic [ref=f1e15]: 180s
          - button [ref=f1e16] [cursor=pointer]:
            - img "+" [ref=f1e17]
      - generic [ref=f1e18]:
        - generic [ref=f1e19]: Enemy Spawn
        - generic [ref=f1e20]:
          - button [ref=f1e21] [cursor=pointer]:
            - img "-" [ref=f1e22]
          - generic [ref=f1e23]: 1s
          - button [ref=f1e24] [cursor=pointer]:
            - img "+" [ref=f1e25]
      - button "Save & Close" [ref=f1e26] [cursor=pointer]
    - status [ref=f1e27]
  - button "Network scenarios" [ref=f1e29] [cursor=pointer]: ⚙
```