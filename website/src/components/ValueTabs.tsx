import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

const tabs = [
  {
    key: "build",
    label: "Build",
    title: "Compose queries faster",
    body: "Monaco Editor, schema-aware completions, and AI prompts keep you moving without leaving the keyboard.",
  },
  {
    key: "run",
    label: "Run",
    title: "See results instantly",
    body: "Virtualized result grids handle millions of rows smoothly with exports to CSV, JSON, and Excel.",
  },
  {
    key: "optimize",
    label: "Optimize",
    title: "Fix slow queries with AI",
    body: "Execution plan visualizer plus AI optimization gives targeted fixes specific to your schema.",
  },
  {
    key: "chat",
    label: "Chat",
    title: "Chat with SQLTemple Agent",
    body: "Enter in a conversation with the SQLTemple Agent, optimize, run, understand, explore the database with a chat like experience.",
  },
];

export default function ValueTabs() {
  const [active, setActive] = useState("build");
  const current = tabs.find((t) => t.key === active)!;

  return (
    <Card className="p-6">
      <div className="flex flex-wrap gap-3 mb-6">
        {tabs.map((tab) => (
          <Button
            key={tab.key}
            variant={active === tab.key ? "default" : "secondary"}
            size="sm"
            onClick={() => setActive(tab.key)}
          >
            {tab.label}
          </Button>
        ))}
      </div>
      <Badge>{current.label}</Badge>
      <h3 className="mt-3 text-2xl font-semibold">{current.title}</h3>
      <p className="mt-2 text-muted leading-relaxed">{current.body}</p>
    </Card>
  );
}
