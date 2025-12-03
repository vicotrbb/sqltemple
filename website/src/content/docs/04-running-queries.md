---
title: Run, analyze, and optimize queries
description: Execute SQL, inspect plans, use AI to improve performance, and export results.
order: 4
---

## Execute queries

- **Run selection**: highlight SQL and press `Cmd+Enter` (macOS) / `Ctrl+Enter` (Windows/Linux).
- **Run file**: press the same shortcut with no selection.
- **Background execution** keeps the UI responsive while queries run.
- Results appear in a virtualized grid that stays smooth on large result sets.

## Explain and optimize

- Click **Explain** to render the execution plan tree with timing metrics and row counts.
- Click **AI Optimize** to get plan-aware recommendations (indexes, rewrites, filters) specific to your schema.

## Explore results

- Resize columns and adjust row height; scroll remains smooth on millions of rows.
- **Exports**: download CSV, JSON, or Excel directly from the results grid.

## Visualize relationships

- **Table topology (Mermaid)**: see foreign key relationships as a diagram.
- **Relationship discovery**: surface inferred links between tables.
- **Column statistics**: quick stats and data types on hover.

## History and tabs

- Every run is stored in **query history**; reopen past runs from the history panel.
- Tabs support renaming and reordering; close with `Cmd+W` / `Ctrl+W`.

## Performance tips

- Use **query limiting** to cap result size when exploring wide tables.
- Prefer **schema-scoped** queries for faster AI suggestions and plan clarity.
- Close unused tabs to reduce editor footprint.
