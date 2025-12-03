---
title: Turn on AI assistance
description: Configure cloud or local AI providers for generation, explanations, and optimization.
order: 3
---

1. Click **⚙️ AI** in the toolbar.
2. Pick a **provider** and fill its settings (see below).
3. Choose a model.
4. Save. AI completions, explanations, and optimizations become available in the editor, results grid, and plan views.

### Where AI helps

- **Natural language → SQL**: describe intent, get a runnable query.
- **Explain query**: plain-language breakdown of selected SQL.
- **Optimize query**: plan-aware suggestions with indexes, rewrites, and filters tailored to your schema.
- **Completions**: context-aware SQL snippets as you type in Monaco.

### Good practices

- Avoid sending sensitive raw data in prompts; mask or limit context where possible.
- For large schemas, scope the prompt to a schema/table to improve relevance.
- Keep API keys private; rotate if you suspect exposure.

## Providers and settings

### OpenAI (cloud)

- **API key**: required (starts with `sk-`).
- **Common models**: `gpt-4o`, `gpt-4o-mini` (fast), `o1-preview`/`o1-mini` (deep reasoning), `gpt-4-turbo`, `gpt-3.5-turbo` variants.
- **Base URL**: default (api.openai.com) unless you use a compatible proxy.

### Claude (Anthropic, cloud)

- **API key**: required (starts with `sk-ant-`).
- **Models**: `claude-3-5-sonnet-20241022`, `claude-3-5-sonnet-20240620`, `claude-3-opus-20240229`, `claude-3-sonnet-20240229`, `claude-3-haiku-20240307`.
- **Notes**: Supports streaming, vision, and tool calling in the app’s provider.

### Ollama (local)

- **API key**: not required.
- **Base URL**: `http://localhost:11434` by default; change if you run Ollama remotely.
- **Models**: whatever you have pulled (`ollama list`). Pick by name (e.g., `llama3`, `qwen2.5`, `phi3` variants).
- Keep Ollama running so the app can fetch models and serve completions.

### LM Studio (local)

- **API key**: not required by default (you can set one if your server enforces it).
- **Base URL**: `http://localhost:1234` by default; matches LM Studio’s local server.
- **Models**: any model loaded in LM Studio; SQLTemple lists them via the `/v1/models` endpoint.

## Choosing the right model quickly

- **Fast drafting**: `gpt-4o-mini`, local 7B/8B models via Ollama/LM Studio.
- **Balanced quality**: `gpt-4o`, `claude-3-5-sonnet-20241022`.
- **Deep reasoning/optimization**: `o1-preview`, `claude-3-opus-20240229`.
- **Offline / data privacy**: Ollama or LM Studio with local models.
