# Graph Report - tu-llave-proyecto  (2026-09-18)

## Corpus Check
- Corpus is ~2,856 words - fits in a single context window. You may not need a graph.

## Summary
- 119 nodes · 117 edges · 15 communities (14 shown, 1 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.82)
- Token cost: 226,397 input · 0 output

## Community Hubs (Navigation)
- TS App Compiler Options
- TS Node Compiler Options
- Package Manifest & Dependencies
- React App Entry Point
- Dev Dependencies & Tooling
- Social Icon Sprite
- Vite React Template Docs
- Oxlint Rules Config
- Graphify Knowledge Graph Docs
- NPM Scripts
- Favicon & Brand Palette
- Hero Illustration
- React Logo
- Vite Logo
- TS Project References

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 18 edges
2. `compilerOptions` - 15 edges
3. `icons.svg (SVG icon sprite)` - 7 edges
4. `React + TypeScript + Vite template` - 6 edges
5. `scripts` - 5 edges
6. `index.html (Vite entry page)` - 4 edges
7. `rules` - 3 edges
8. `react` - 3 edges
9. `graphify knowledge graph (graphify-out)` - 3 edges
10. `graphify query/path/explain workflow` - 3 edges

## Surprising Connections (you probably didn't know these)
- `index.html (Vite entry page)` --conceptually_related_to--> `React + TypeScript + Vite template`  [INFERRED]
  index.html → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Vite React app bootstrap (index.html, #root, main.tsx)** — index_html_entry_page, index_root_div, src_main [INFERRED 0.85]
- **graphify codebase navigation flow** — claude_graphify_query_workflow, claude_graphify_wiki_index, claude_graph_report [EXTRACTED 1.00]
- **Social platform brand icons in sprite** — public_icons_bluesky_icon, public_icons_discord_icon, public_icons_github_icon, public_icons_x_icon [INFERRED 0.85]

## Communities (15 total, 1 thin omitted)

### Community 0 - "TS App Compiler Options"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 1 - "TS Node Compiler Options"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 2 - "Package Manifest & Dependencies"
Cohesion: 0.13
Nodes (14): dependencies, react, react-dom, name, private, type, version, oxlint (+6 more)

### Community 3 - "React App Entry Point"
Cohesion: 0.21
Nodes (10): favicon.svg, index.html (Vite entry page), #root mount point, react, react-dom, App(), src_assets_hero, src_assets_react (+2 more)

### Community 4 - "Dev Dependencies & Tooling"
Cohesion: 0.25
Nodes (8): devDependencies, oxlint, @types/node, @types/react, @types/react-dom, typescript, vite, @vitejs/plugin-react

### Community 5 - "Social Icon Sprite"
Cohesion: 0.29
Nodes (8): icons.svg (SVG icon sprite), bluesky-icon symbol, discord-icon symbol, documentation-icon symbol, github-icon symbol, social-icon symbol, SVG symbol sprite pattern, x-icon symbol

### Community 6 - "Vite React Template Docs"
Cohesion: 0.33
Nodes (7): Hot Module Replacement (HMR), Oxlint configuration (.oxlintrc.json), Type-aware lint rules (oxlint-tsgolint), React Compiler, React + TypeScript + Vite template, @vitejs/plugin-react (Oxc), @vitejs/plugin-react-swc (SWC)

### Community 7 - "Oxlint Rules Config"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 8 - "Graphify Knowledge Graph Docs"
Cohesion: 0.50
Nodes (5): GRAPH_REPORT.md, graphify knowledge graph (graphify-out), graphify query/path/explain workflow, graphify update after code changes, graphify-out wiki index

### Community 9 - "NPM Scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, preview

### Community 10 - "Favicon & Brand Palette"
Cohesion: 1.00
Nodes (3): favicon.svg (purple lightning-bolt site icon), Brand palette: violet #863bff, light lavender #ede6ff, cyan #47bfff, Purple bolt-shaped logo with blurred gradient glow

### Community 11 - "Hero Illustration"
Cohesion: 0.67
Nodes (3): Hero Image (isometric layered platform), Isometric layered stack illustration, Purple gradient accent styling

### Community 12 - "React Logo"
Cohesion: 0.67
Nodes (3): Atom with three elliptical orbits in cyan (#00D8FF), React (UI library), React Logo (react.svg)

### Community 13 - "Vite Logo"
Cohesion: 0.67
Nodes (3): Dark-mode adaptive parentheses (prefers-color-scheme), Vite build tool branding, Vite Logo (vite.svg)

## Knowledge Gaps
- **75 isolated node(s):** `$schema`, `plugins`, `react/rules-of-hooks`, `react/only-export-components`, `name` (+70 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 82 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `index.html (Vite entry page)` connect `React App Entry Point` to `Vite React Template Docs`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Why does `react` connect `React App Entry Point` to `Package Manifest & Dependencies`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Dev Dependencies & Tooling` to `Package Manifest & Dependencies`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **What connects `$schema`, `plugins`, `react/rules-of-hooks` to the rest of the system?**
  _75 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `TS App Compiler Options` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `TS Node Compiler Options` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._
- **Should `Package Manifest & Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._