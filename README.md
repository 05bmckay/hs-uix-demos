# hs-uix Component Demos

An interactive showcase app for [**hs-uix**](https://github.com/05bmckay/hs-uix) — a family of higher-level components for the HubSpot UI Extensions platform. The app installs as a private HubSpot app and renders a browsable gallery of live, customizable demos: each one runs the real component, links to its source, and lets you copy the example code straight to your clipboard.

Built on the HubSpot UI Extensions (`@hubspot/ui-extensions`) framework and deployed with the HubSpot CLI (`hs`).

## What's inside

The app's home page (`/app/pages/Home.jsx`) renders a `DemoBrowser` with one tab per package. Component tabs lead with a flagship, fully interactive playground and a grid of smaller, focused examples below it; catalog-style tabs (Common Components, Utils, Text Art, Experimental) start as a tile grid, and selecting a demo opens it inline with back / prev / next navigation scoped to that tab.

| Tab | Component(s) | What it demonstrates |
| --- | --- | --- |
| **DataTable** | `DataTable` | Search, filters, sorting, grouping, footer totals, inline & row editing, selection, bulk actions |
| **FormBuilder** | `FormBuilder` | Declarative form schemas, validation, field types, layout |
| **Kanban** | `Kanban` | Draggable columns/cards and board state |
| **CRM Search** | CRM search components | Querying and rendering CRM object results |
| **Feed** | `Feed` | Activity/feed layouts and item variants |
| **Calendar** | `Calendar` | Calendar views and date interactions |
| **Common Components** | shared building blocks + icon set | Reusable primitives used across the library, plus the icon catalog |
| **Utils** | helpers | Formatting and utility helpers |
| **Text Art** | text-art components | ASCII/text-art rendering helpers |
| **Experimental** | `@hubspot/ui-extensions/experimental` + escape hatches | Prop labs, CRM hooks, Pages API probes, host-component render probes, and outbound `hubspot.fetch` tests |

Every demo exposes three actions in its header: **View code** (opens the component source on GitHub), **Copy code** (copies the example snippet), and — for playgrounds — a **Customize** drawer with live prop controls.

## Prerequisites

- A **HubSpot account** with developer/UI-Extensions access (a [developer test account](https://developers.hubspot.com/docs/platform/create-a-developer-test-account) works well).
- **Node.js** 18+ and npm.
- The **HubSpot CLI** installed and authenticated:
  ```bash
  npm install -g @hubspot/cli
  hs init        # authenticate against your portal
  ```

## Getting started

```bash
git clone https://github.com/05bmckay/hs-uix-demos.git
cd hs-uix-demos

# install the page-bundle dependencies (hs-uix + ui-extensions)
npm install --prefix src/app/pages

# start local development against your authenticated portal
hs project dev
```

`hs project dev` builds the project, uploads it to your account, and opens a live-reloading session. To publish a build instead, run `hs project upload`.

Once installed, open the app in your HubSpot portal — its home page hosts the demo browser.

## Project structure

```
hs-uix-demos/
├── hsproject.json              # HubSpot project config (name, srcDir, platformVersion)
└── src/
    └── app/
        ├── app-hsmeta.json      # App definition: auth, scopes, permitted URLs
        └── pages/
            ├── home-hsmeta.json # Page entrypoint config (location: home)
            ├── Home.jsx         # Page root → renders DemoBrowser
            ├── DemoBrowser.jsx  # Tabbed gallery driven by a PACKAGES registry
            ├── playground.jsx   # Shared header-slot context + useCustomizePanel drawer scaffold
            ├── data.jsx         # Shared sample CRM-like data + formatters
            ├── *-demos.jsx      # One file per package, each exporting an *_DEMOS array
            └── package.json     # Page bundle deps (hs-uix, @hubspot/ui-extensions)
```

### How a demo is defined

Each `*-demos.jsx` file exports an array of demo objects consumed by `DemoBrowser`:

```jsx
export const DATATABLE_DEMOS = [
  {
    id: "dt-playground",
    name: "Interactive Table Playground",
    description: "Storybook-style table preview with presets and live controls.",
    package: "datatable",
    Component: TablePlaygroundDemo,
    githubUrl: "https://github.com/05bmckay/hs-uix/tree/main/packages/datatable",
    sourceCode: `import { DataTable } from "hs-uix/datatable";`,
  },
  // ...
];
```

`DemoBrowser` aggregates every package's array into `ALL_DEMOS` and renders one tab per entry in its `PACKAGES` registry, which maps each `package` value to a tab label and a layout. `layout: "playground"` renders the first demo inline as the flagship with the rest in a grid below; `layout: "grid"` starts with the grid and opens the selected demo inline with package-scoped navigation. Playground demos register their **Customize** drawer through `useCustomizePanel` in `playground.jsx`. The escape-hatch demos (`escape-hatch-demos.jsx`) have no tab of their own — they're merged into the Experimental tab's array.

## Configuration notes

App-level settings live in `src/app/app-hsmeta.json`:

- **Distribution** is `private`.
- **Scopes** requested: `oauth`, plus read access to contacts, companies, and deals.
- **Permitted URLs** (`permittedUrls`) allow-list the outbound `fetch` and `iframe` hosts used by the Experimental tab. If you add demos that call new external hosts, list them here or HubSpot will block the request.

The platform version is pinned in `hsproject.json` (`platformVersion`). `hs-uix` is pulled from npm at build time.

## License

[MIT](./LICENSE) © Carter McKay
