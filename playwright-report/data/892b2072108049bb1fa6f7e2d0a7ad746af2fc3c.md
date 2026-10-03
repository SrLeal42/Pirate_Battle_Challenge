# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 03-gameplay.spec.ts >> 3. Início de partida, movimento, rotação, limites da arena e colisão com ilhas >> should respect arena boundaries
- Location: e2e\03-gameplay.spec.ts:59:5

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
        - generic: 1:50
    - button "Pause game" [ref=e8] [cursor=pointer]
  - status [ref=e9]: Match started. 120 seconds on the clock.
```