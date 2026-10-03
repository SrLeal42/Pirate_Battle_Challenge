# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 09-navigation.spec.ts >> 9. Abandono da partida, navegação repetida entre telas e controles de toque >> should be able to abandon match, navigate menus repeatedly and start again
- Location: e2e\09-navigation.spec.ts:12:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Tearing down "context" exceeded the test timeout of 30000ms.
```

# Page snapshot

```yaml
- generic [ref=f1e3]:
  - generic [ref=f1e4]:
    - generic [ref=f1e8]:
      - img "Pirate Battle" [ref=f1e9]
      - generic [ref=f1e10]:
        - generic [ref=f1e11]:
          - generic [ref=f1e12]: Captain's Name
          - textbox "Captain's Name" [active] [ref=f1e13]:
            - /placeholder: Type your name...
            - text: Quitter
        - generic [ref=f1e14]:
          - button "Play" [ref=f1e15] [cursor=pointer]
          - button "Options" [ref=f1e16] [cursor=pointer]
      - generic [ref=f1e17]:
        - button "Controls" [ref=f1e18] [cursor=pointer]
        - button "Ranking" [ref=f1e19] [cursor=pointer]
        - button "History" [ref=f1e20] [cursor=pointer]
    - status [ref=f1e21]
  - button "Network scenarios" [ref=f1e23] [cursor=pointer]: ⚙
```