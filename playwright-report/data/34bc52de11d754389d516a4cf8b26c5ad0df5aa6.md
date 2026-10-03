# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 07-pause.spec.ts >> 7. Pausa, perda de foco e retomada sem avanço indevido do cronômetro >> should pause when pressing Esc or losing focus and resume manually
- Location: e2e\07-pause.spec.ts:18:5

# Error details

```
Tearing down "context" exceeded the test timeout of 30000ms.
```

# Page snapshot

```yaml
- generic [ref=e4]:
  - generic:
    - generic:
      - meter "Health":
        - generic [aria-hidden]: 100 / 100
    - generic:
      - generic:
        - img "Score"
        - generic: "0"
      - generic:
        - img "Time remaining"
        - generic: 2:00
    - button "Pause game" [ref=e8] [cursor=pointer]
  - status [ref=e9]: Game resumed.
```