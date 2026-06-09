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
import { TEXT_ART_DEMOS } from "./text-art-demos.jsx";
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
// layout: "playground" — the first demo is a flagship playground, rendered
//         inline with a grid of the remaining demos below it.
//         "grid"       — all demos start as a tile grid; selecting one shows
//         it inline with back / prev / next navigation scoped to the package.
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
// Demo detail view — renders the selected demo with action buttons
// Includes prev/next navigation to page through demos in the same package.
// ═══════════════════════════════════════════════════════════════════════════

const DemoDetail = ({
  demo,
  onBack,
  onNavigate,
  prevDemo,
  nextDemo,
  actions,
  hideBack = false,
  hideNavigation = false,
}) => {
  const [headerSlot, setHeaderSlot] = useState(null);
  const registerHeaderSlot = useCallback((node) => setHeaderSlot(node), []);

  const handleCopy = () => {
    actions.copyTextToClipboard(demo.sourceCode);
    actions.addAlert({ type: "success", message: "Source code copied to clipboard." });
  };

  return (
    <Flex direction="column" gap="sm">
      {!hideBack && (
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
      {!hideNavigation && (
        <>
          <Divider />
          <Flex direction="row" justify="between" align="center">
            {prevDemo ? (
              <Button variant="transparent" onClick={() => onNavigate(prevDemo.id)}>
                {`< ${prevDemo.name}`}
              </Button>
            ) : (
              <Flex />
            )}
            {nextDemo ? (
              <Button variant="transparent" onClick={() => onNavigate(nextDemo.id)}>
                {`${nextDemo.name} >`}
              </Button>
            ) : (
              <Flex />
            )}
          </Flex>
        </>
      )}
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
// Package tab — one interaction model per layout, tabs always stay visible:
//
// "playground": the flagship demo renders inline, with the remaining demos in
// a grid below; picking one swaps it into the inline slot.
//
// "grid": the tile grid renders first; picking a demo shows it inline with a
// back-to-grid button and prev/next paging scoped to this package.
// ═══════════════════════════════════════════════════════════════════════════

const PackageTab = ({ demos, label, layout, actions }) => {
  const isPlayground = layout === "playground";
  const [activeId, setActiveId] = useState(isPlayground ? demos[0]?.id : null);

  const activeIndex = demos.findIndex((d) => d.id === activeId);
  const active = activeIndex >= 0 ? demos[activeIndex] : null;

  if (!active) {
    return <DemoGrid demos={demos} onSelect={setActiveId} />;
  }

  if (isPlayground) {
    const others = demos.filter((d) => d.id !== active.id);
    return (
      <Flex direction="column" gap="sm">
        {/* key forces a clean remount per demo so header-slot / internal state don't leak across swaps */}
        <DemoDetail
          key={active.id}
          demo={active}
          actions={actions}
          hideBack={true}
          hideNavigation={true}
        />
        {others.length > 0 && (
          <>
            <Divider />
            <Text format={{ fontWeight: "demibold" }}>{`More ${label} examples`}</Text>
            <DemoGrid demos={others} onSelect={setActiveId} />
          </>
        )}
      </Flex>
    );
  }

  return (
    <DemoDetail
      key={active.id}
      demo={active}
      onBack={() => setActiveId(null)}
      onNavigate={setActiveId}
      prevDemo={demos[activeIndex - 1] || null}
      nextDemo={demos[activeIndex + 1] || null}
      actions={actions}
    />
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
