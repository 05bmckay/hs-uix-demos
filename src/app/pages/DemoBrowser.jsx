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
import { NEW_FEATURE_DEMOS } from "./new-feature-demos.jsx";
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
  ...NEW_FEATURE_DEMOS,
  ...ICON_DEMOS,
  ...UTILS_DEMOS,
  ...TEXT_ART_DEMOS,
  ...EXPERIMENTAL_DEMOS,
];

// ═══════════════════════════════════════════════════════════════════════════
// Package registry — one entry per tab, in display order.
//
// Every tab renders the same way: its first demo inline as the flagship hero,
// with the remaining demos in a tile grid below. Put each package's best
// playground/demo first in its *_DEMOS array.
//
// HOST CONSTRAINT: swapping the mounted demo in place inside <Tabs> crashes
// the host renderer ("There was a problem displaying this content" + trace
// id) — even when the replacement markup is identical to the hero's. Tab
// content must therefore stay structurally static for the lifetime of a
// Tabs mount. Demo selection works around this by remounting the entire
// <Tabs> tree (key on Tabs) so the new panel content arrives via a fresh
// mount — the same operation as the initial load. Don't reintroduce
// in-place demo swapping inside a mounted Tabs.
// ═══════════════════════════════════════════════════════════════════════════

const PACKAGES = [
  { id: "datatable", label: "DataTable" },
  { id: "form", label: "FormBuilder" },
  { id: "kanban", label: "Kanban" },
  { id: "crm-search", label: "CRM Search" },
  { id: "feed", label: "Feed" },
  { id: "calendar", label: "Calendar" },
  { id: "common", label: "Common Components" },
  { id: "new", label: "New Features" },
  { id: "utils", label: "Utils" },
  { id: "text-art", label: "Text Art" },
  { id: "experimental", label: "Experimental" },
];

// ═══════════════════════════════════════════════════════════════════════════
// Demo detail view — renders a demo with its action buttons.
//
// Inside a tab (hero) it gets only { demo, actions }. Full-page it also gets
// onBack.
// ═══════════════════════════════════════════════════════════════════════════

const DemoDetail = ({ demo, actions, onBack }) => {
  const [headerSlot, setHeaderSlot] = useState(null);
  const registerHeaderSlot = useCallback((node) => setHeaderSlot(node), []);

  const handleCopy = () => {
    actions.copyTextToClipboard(demo.sourceCode);
    actions.addAlert({ type: "success", message: "Source code copied to clipboard." });
  };

  return (
    <Flex direction="column" gap="sm">
      {onBack && (
        <Button variant="transparent" onClick={onBack}>
          {'< Back to demos'}
        </Button>
      )}
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
// Demo + siblings — the one layout used everywhere: a demo rendered inline
// with the rest of its package's demos in a grid below. By default the demo
// is the package's flagship hero; when a demo is selected it takes the slot
// and gains a back button. Tile clicks bubble up via onSelect, which
// remounts the Tabs tree with the new selection (see HOST CONSTRAINT).
// ═══════════════════════════════════════════════════════════════════════════

const DemoWithSiblings = ({ demo, demos, label, actions, onSelect, onBack }) => {
  const others = demos.filter((d) => d.id !== demo.id);
  return (
    <Flex direction="column" gap="sm">
      {/* key forces a clean remount per demo so header-slot / internal state don't leak across swaps */}
      <DemoDetail key={demo.id} demo={demo} actions={actions} onBack={onBack} />
      {others.length > 0 && (
        <>
          <Divider />
          <Text format={{ fontWeight: "demibold" }}>{`More ${label} examples`}</Text>
          <DemoGrid demos={others} onSelect={onSelect} />
        </>
      )}
    </Flex>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// DemoBrowser — the main gallery component
// One tab per PACKAGES entry. Selecting a demo renders it inside its own
// tab's panel (replacing the hero) so the tab bar never disappears. The key
// on <Tabs> remounts the whole tree on every selection change: in-place
// panel swaps inside a mounted <Tabs> crash the host (see HOST CONSTRAINT
// above), but a fresh Tabs mount with different panel content is the same
// operation as the initial load, which is safe.
// ═══════════════════════════════════════════════════════════════════════════

export const DemoBrowser = ({ actions }) => {
  const [activeTab, setActiveTab] = useState(PACKAGES[0].id);
  const [selectedDemoId, setSelectedDemoId] = useState(null);

  const selected = selectedDemoId
    ? ALL_DEMOS.find((d) => d.id === selectedDemoId)
    : null;

  const handleSelect = (demoId) => {
    const demo = ALL_DEMOS.find((d) => d.id === demoId);
    if (demo) setActiveTab(demo.package);
    setSelectedDemoId(demoId);
  };

  return (
    <Flex direction="column" gap="sm">
      <Tabs
        key={selectedDemoId || "browse"}
        selected={activeTab}
        onSelectedChange={setActiveTab}
      >
        {PACKAGES.map(({ id, label }) => {
          const demos = ALL_DEMOS.filter((d) => d.package === id);
          if (demos.length === 0) return null;
          const isSelectedTab = selected ? selected.package === id : false;
          return (
            <Tab key={id} tabId={id} title={label}>
              <DemoWithSiblings
                demo={isSelectedTab ? selected : demos[0]}
                demos={demos}
                label={label}
                actions={actions}
                onSelect={handleSelect}
                onBack={
                  isSelectedTab ? () => setSelectedDemoId(null) : undefined
                }
              />
            </Tab>
          );
        })}
      </Tabs>
    </Flex>
  );
};
