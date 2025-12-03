---
title: Troubleshooting
description: Fix common launch, connection, performance, and AI issues.
order: 6
---

## macOS cannot open the app

If macOS warns the app is from an unidentified developer, right-click the app and choose **Open**. Upcoming releases will be notarized.

## Connection fails

- Verify host/port and that your IP or VPN is allowlisted.
- Enable **SSL** if required by your provider.
- Check firewall rules or local proxies.

## AI responses are slow

- Use a lighter model: `gpt-4o-mini` (OpenAI) or `claude-3-5-sonnet-20241022` for balanced speed/quality; with local providers, try smaller models (7B/8B) in Ollama or LM Studio.
- Reduce prompt scope: focus on one schema/table.
- For cloud providers, confirm your API key has quota; for local providers, ensure the server is running and the model is loaded.

## Editor feels sluggish

- Close unused tabs.
- Limit result set size via query limiting.
- Turn off unneeded panels when focusing on the editor.

## Export issues

- Very large exports can be memory-heavy; filter or limit rows before exporting.

## Still stuck?

- Open an issue: `https://github.com/vicotrbb/sqltemple/issues`
- Email the maintainer: `victorbona@pm.me`
