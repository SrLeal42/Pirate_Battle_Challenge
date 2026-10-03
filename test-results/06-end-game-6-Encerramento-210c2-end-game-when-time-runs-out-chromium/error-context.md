# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 06-end-game.spec.ts >> 6. Encerramento por tempo e por morte, interrupção da simulação e reinício limpo >> should end game when time runs out
- Location: e2e\06-end-game.spec.ts:22:5

# Error details

```
Test timeout of 30000ms exceeded while running "beforeEach" hook.
```

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
  - status [ref=e9]: Match started. 120 seconds on the clock.
```