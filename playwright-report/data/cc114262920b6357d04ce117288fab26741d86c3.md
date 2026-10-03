# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 05-enemies.spec.ts >> 5. Comportamentos de Chaser e Shooter e intervalo de spawn >> enemies should spawn, move towards player, and attack/collide
- Location: e2e\05-enemies.spec.ts:24:5

# Error details

```
Tearing down "context" exceeded the test timeout of 30000ms.
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]:
    - dialog [active] [ref=e8]:
      - heading "Game Over" [level=1] [ref=e9]
      - generic [ref=e10]: Your ship was destroyed!
      - generic [ref=e11]:
        - generic [ref=e12]: Final Score
        - generic [ref=e13]: "0"
      - generic [ref=e14]:
        - term [ref=e15]: Time played
        - definition [ref=e16]: 0:23
        - term [ref=e17]: Reason
        - definition [ref=e18]: Ship destroyed
      - status [ref=e19]: Score saved to Leaderboard!
      - generic [ref=e20]:
        - button "Play Again" [ref=e21] [cursor=pointer]
        - button "Main Menu" [ref=e22] [cursor=pointer]
    - status [ref=e23]: "Match over. Your ship was destroyed. Final score: 0."
  - button "Network scenarios" [ref=e25] [cursor=pointer]: ⚙
```