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
// Every tab renders the same way: its first demo inline as the flagship hero,
// with the remaining demos in a tile grid below. Put each package's best
// playground/demo first in its *_DEMOS array.
//
// HOST CONSTRAINT: swapping the mounted demo in place inside <Tabs> crashes
// the host renderer ("There was a problem displaying this content" + trace
// id) — even when the replacement markup is identical to the hero's. Tab
// content must therefore stay structurally static after mount; clicking a
// tile opens the demo full-page (Tabs unmount), which is the long-proven
// path. Don't reintroduce in-tab demo swapping.
// ═══════════════════════════════════════════════════════════════════════════

const PACKAGES = [
  { id: "datatable", label: "DataTable" },
  { id: "form", label: "FormBuilder" },
  { id: "kanban", label: "Kanban" },
  { id: "crm-search", label: "CRM Search" },
  { id: "feed", label: "Feed" },
  { id: "calendar", label: "Calendar" },
  { id: "common", label: "Common Components" },
  { id: "utils", label: "Utils" },
  { id: "text-art", label: "Text Art" },
  { id: "experimental", label: "Experimental" },
];

// ═══════════════════════════════════════════════════════════════════════════
// Demo detail view — renders a demo with its action buttons.
//
// Inside a tab (hero) it gets only { demo, actions }. Full-page it also gets
// onBack / onNavigate / prevDemo / nextDemo for package-scoped paging.
// ═══════════════════════════════════════════════════════════════════════════

const DemoDetail = ({ demo, actions, onBack, onNavigate, prevDemo, nextDemo }) => {
  const [headerSlot, setHeaderSlot] = useState(null);
  const registerHeaderSlot = useCallback((node) => setHeaderSlot(node), []);

  const handleCopy = () => {
    actions.copyTextToClipboard(demo.sourceCode);
    actions.addAlert({ type: "success", message: "Source code copied to clipboard." });
  };

  const showNav = Boolean(onNavigate && (prevDemo || nextDemo));

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
      {showNav && (
        <>
          <Divider />
          <Flex
            direction="row"
            justify={prevDemo && nextDemo ? "between" : prevDemo ? "start" : "end"}
            align="center"
          >
            {prevDemo && (
              <Button variant="transparent" onClick={() => onNavigate(prevDemo.id)}>
                {`< ${prevDemo.name}`}
              </Button>
            )}
            {nextDemo && (
              <Button variant="transparent" onClick={() => onNavigate(nextDemo.id)}>
                {`${nextDemo.name} >`}
              </Button>
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
// Package tab — structurally static (see HOST CONSTRAINT above): the flagship
// hero renders inline and never changes; tile clicks bubble up via onSelect
// and open full-page.
// ═══════════════════════════════════════════════════════════════════════════

const PackageTab = ({ demos, label, actions, onSelect }) => {
  const [hero, ...others] = demos;
  return (
    <Flex direction="column" gap="sm">
      <DemoDetail demo={hero} actions={actions} />
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
// One tab per PACKAGES entry; selecting a demo from any grid swaps the whole
// browser for a full-page DemoDetail with back + package-scoped prev/next.
// ═══════════════════════════════════════════════════════════════════════════

export const DemoBrowser = ({ actions }) => {
  const [activeTab, setActiveTab] = useState(PACKAGES[0].id);
  const [selectedDemoId, setSelectedDemoId] = useState(null);

  const selected = selectedDemoId
    ? ALL_DEMOS.find((d) => d.id === selectedDemoId)
    : null;

  if (selected) {
    const siblings = ALL_DEMOS.filter((d) => d.package === selected.package);
    const index = siblings.findIndex((d) => d.id === selected.id);
    return (
      <DemoDetail
        key={selected.id}
        demo={selected}
        actions={actions}
        onBack={() => setSelectedDemoId(null)}
        onNavigate={setSelectedDemoId}
        prevDemo={siblings[index - 1] || null}
        nextDemo={siblings[index + 1] || null}
      />
    );
  }

  return (
    <Flex direction="column" gap="sm">
      <Tabs selected={activeTab} onSelectedChange={setActiveTab}>
        {PACKAGES.map(({ id, label }) => {
          const demos = ALL_DEMOS.filter((d) => d.package === id);
          if (demos.length === 0) return null;
          return (
            <Tab key={id} tabId={id} title={label}>
              <PackageTab
                demos={demos}
                label={label}
                actions={actions}
                onSelect={setSelectedDemoId}
              />
            </Tab>
          );
        })}
      </Tabs>
    </Flex>
  );
};
