---
title: Connect to PostgreSQL
description: Add your first database connection and browse schemas securely.
order: 2
---

1. Open SQLTemple and click **Connect** in the toolbar.
2. Fill in:
   - **Name**: Friendly label for this connection.
   - **Host**: e.g., `db.example.com`.
   - **Port**: `5432` by default.
   - **Database**: target database name.
   - **Username** / **Password**.
   - **SSL**: enable if your provider requires TLS.
3. Save. Credentials are stored locally with platform keychain support.
4. Use the **Schema Explorer** to expand databases, schemas, tables, and columns with lazy loading for large catalogs.

### Tips

- Keep separate saved connections for prod/stage/dev.
- If your host requires IP allowlists, confirm your current IP or VPN is permitted.
- Use SSL when connecting over public networks.
