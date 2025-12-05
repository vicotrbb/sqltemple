---
title: Plans, topology, and analysis
description: Visual tools to understand performance and relationships.
order: 7
---

## Execution plans

- Click **Explain** to render the plan tree with timing, rows, and cost.
- Nodes highlight hotspots; collapse/expand to simplify deep plans.
- Use **AI Optimize** to get index and rewrite suggestions that reference plan nodes.

## Table topology (Mermaid)

- Visualize foreign key relationships as a graph to spot joins and dependencies.
- Helpful when designing queries that span multiple tables.

## Relationship discovery

- SQLTemple can surface inferred relationships beyond explicit FKs; review and validate before relying on them.

## Column statistics

- Hover columns in the explorer or results to see data type and quick stats where available.

## Results analysis modal

- Summarizes result sets with AI-generated insights and patterns (when enabled).
