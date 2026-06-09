import React, { useCallback, useState } from "react";
import {
  Box,
  Button,
  Divider,
  Flex,
  Heading,
  Tab,
  Tabs,
  Text,
  Tile,
} from "@hubspot/ui-extensions";
import { DemoHeaderContext } from "./playground.jsx";
import { CALENDAR_DEMOS } from "./calendar-demos.jsx";
import { COMMON_COMPONENTS_DEMOS } from "./common-components-demos.jsx";
import { CRM_SEARCH_DEMOS } from "./crm-search-demos.jsx";
import { DATATABLE_DEMOS } from "./datatable-demos.jsx";
import { EXPERIMENTAL_DEMOS } from "./experimental-demos.jsx";
import { FEED_DEMOS } from "./feed-demos.jsx";
import { FORM_DEMOS } from "./form-demos.jsx";
import { ICON_DEMOS } from "./icon-demos.jsx";
import { KANBAN_DEMOS } from "./kanban-demos.jsx";
import { TEXT_ART_DEMOS } from "./text-art/index.jsx";
import { UTILS_DEMOS } from "./utils-demos.jsx";

const ALL_DEMOS = [
  ...DATATABLE_DEMOS,
  ...FORM_DEMOS,
  ...KANBAN_DEMOS,
  ...CRM_SEARCH_DEMOS,
  ...FEED_DEMOS,
  ...CALENDAR_DEMOS,
  ...COMMON_COMPONENTS_DEMOS,
  ...ICON_DEMOS,
  ...UTILS_DEMOS,
  ...TEXT_ART_DEMOS,
  ...EXPERIMENTAL_DEMOS,
];

// ═══════════════════════════════════════════════════════════════════════════
// Package registry — one entry per tab, in display order.
//
// layout: "playground" — the first demo is a flagship playground and starts
//         selected, rendered inline with the remaining demos in a grid below.
//         "grid"       — the tab opens on the tile grid; selecting a demo
//         renders it inline the same way.
// ═══════════════════════════════════════════════════════════════════════════

const PACKAGES = [
  { id: "datatable", label: "DataTable", layout: "playground" },
  { id: "form", label: "FormBuilder", layout: "playground" },
  { id: "kanban", label: "Kanban", layout: "playground" },
  { id: "crm-search", label: "CRM Search", layout: "playground" },
  { id: "feed", label: "Feed", layout: "playground" },
  { id: "calendar", label: "Calendar", layout: "playground" },
  { id: "common", label: "Common Components", layout: "grid" },
  { id: "utils", label: "Utils", layout: "grid" },
  { id: "text-art", label: "Text Art", layout: "grid" },
  { id: "experimental", label: "Experimental", layout: "grid" },
];

// ═══════════════════════════════════════════════════════════════════════════
// Demo detail view — renders the selected demo with action buttons.
//
// Always renders inline inside its tab. (An earlier revision added a back
// button and a prev/next footer here; rendering those inside <Tabs> crashed
// the host renderer, so all paging happens through the demo grid instead.)
// ═══════════════════════════════════════════════════════════════════════════

const DemoDetail = ({ demo, actions }) => {
  const [headerSlot, setHeaderSlot] = useState(null);
  const registerHeaderSlot = useCallback((node) => setHeaderSlot(node), []);

  const handleCopy = () => {
    actions.copyTextToClipboard(demo.sourceCode);
    actions.addAlert({ type: "success", message: "Source code copied to clipboard." });
  };

  return (
    <Flex direction="column" gap="sm">
      <Flex direction="row" gap="sm" align="center">
        <Box flex={3}>
          <Flex direction="column" gap="flush">
            <Heading>{demo.name}</Heading>
            <Text>{demo.description}</Text>
          </Flex>
        </Box>
        <Box flex={1}>
          <Flex direction="row" gap="xs" justify="end">
            {headerSlot}
            <Button
              variant="secondary"
              href={{ url: demo.githubUrl, external: true }}
            >
              View code
            </Button>
            {actions && (
              <Button variant="secondary" onClick={handleCopy}>
                Copy code
              </Button>
            )}
          </Flex>
        </Box>
      </Flex>
      <Divider />
      <DemoHeaderContext.Provider value={registerHeaderSlot}>
        <demo.Component actions={actions} />
      </DemoHeaderContext.Provider>
    </Flex>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Demo tile grid — shows clickable tiles for each demo in a package group
// ═══════════════════════════════════════════════════════════════════════════

const DemoGrid = ({ demos, onSelect }) => (
  <Flex direction="column" gap="sm">
    {demos.map((demo) => (
      <Tile key={demo.id}>
        <Flex direction="row" justify="between" align="center" gap="sm">
          <Flex direction="column" gap="flush">
            <Text format={{ fontWeight: "demibold" }}>{demo.name}</Text>
            <Text variant="microcopy">{demo.description}</Text>
          </Flex>
          <Button variant="secondary" onClick={() => onSelect(demo.id)}>
            View
          </Button>
        </Flex>
      </Tile>
    ))}
  </Flex>
);

// ═══════════════════════════════════════════════════════════════════════════
// Package tab — one interaction model everywhere, tabs always stay visible:
// the selected demo renders inline with the remaining demos in a grid below,
// and picking one swaps it into the inline slot. The layout flag only decides
// whether the first demo starts selected ("playground" tabs lead with their
// flagship) or the tab opens on the grid ("grid" tabs).
// ═══════════════════════════════════════════════════════════════════════════

const PackageTab = ({ demos, label, layout, actions }) => {
  const [activeId, setActiveId] = useState(
    layout === "playground" ? demos[0]?.id : null
  );
  const active = demos.find((d) => d.id === activeId) || null;

  if (!active) {
    return <DemoGrid demos={demos} onSelect={setActiveId} />;
  }

  const others = demos.filter((d) => d.id !== active.id);
  return (
    <Flex direction="column" gap="sm">
      {/* key forces a clean remount per demo so header-slot / internal state don't leak across swaps */}
      <DemoDetail key={active.id} demo={active} actions={actions} />
      {others.length > 0 && (
        <>
          <Divider />
          <Text format={{ fontWeight: "demibold" }}>{`More ${label} examples`}</Text>
          <DemoGrid demos={others} onSelect={setActiveId} />
        </>
      )}
    </Flex>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// DemoBrowser — the main gallery component
// One tab per PACKAGES entry; all selection state lives inside the tab.
// ═══════════════════════════════════════════════════════════════════════════

export const DemoBrowser = ({ actions }) => {
  const [activeTab, setActiveTab] = useState(PACKAGES[0].id);

  return (
    <Flex direction="column" gap="sm">
      <Tabs selected={activeTab} onSelectedChange={setActiveTab}>
        {PACKAGES.map(({ id, label, layout }) => {
          const demos = ALL_DEMOS.filter((d) => d.package === id);
          if (demos.length === 0) return null;
          return (
            <Tab key={id} tabId={id} title={label}>
              <PackageTab
                demos={demos}
                label={label}
                layout={layout}
                actions={actions}
              />
            </Tab>
          );
        })}
      </Tabs>
    </Flex>
  );
};
