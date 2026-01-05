# Calculadora

Projeto simples de uma calculadora.

## Feature flags

This project supports feature flags via `config.json` at the project root. Example:

```json
{
  "features": {
    "claude_haiku_4_5": true
  }
}
```

When `claude_haiku_4_5` is `true`, the UI shows an indicator below the display and the app can enable special behavior tied to Claude Haiku 4.5.
