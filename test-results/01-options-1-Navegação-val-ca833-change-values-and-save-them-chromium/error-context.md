# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 01-options.spec.ts >> 1. Navegação, validação e persistência das opções >> should open options, change values and save them
- Location: e2e\01-options.spec.ts:10:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Tearing down "context" exceeded the test timeout of 30000ms.
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]:
    - generic [ref=e8]:
      - img "Pirate Battle" [ref=e9]
      - generic [ref=e10]:
        - generic [ref=e11]:
          - generic [ref=e12]: Captain's Name
          - textbox "Captain's Name" [active] [ref=e13]:
            - /placeholder: Type your name...
        - generic [ref=e14]:
          - button "Play" [ref=e15] [cursor=pointer]
          - button "Options" [ref=e16] [cursor=pointer]
      - generic [ref=e17]:
        - button "Controls" [ref=e18] [cursor=pointer]
        - button "Ranking" [ref=e19] [cursor=pointer]
        - button "History" [ref=e20] [cursor=pointer]
    - status [ref=e21]
  - button "Network scenarios" [ref=e23] [cursor=pointer]: ⚙
```