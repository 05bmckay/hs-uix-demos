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
import { DemoHeaderContext } from "./demoHeader.jsx";
import { CALENDAR_DEMOS } from "./calendar-demos.jsx";
import { COMMON_COMPONENT_DEMOS } from "./common-components-demos.jsx";
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
  ...COMMON_COMPONENT_DEMOS,
  ...ICON_DEMOS,
  ...UTILS_DEMOS,
  ...TEXT_ART_DEMOS,
  ...EXPERIMENTAL_DEMOS,
];

const PACKAGE_META = {
  datatable: { label: "DataTable", tabId: "datatable" },
  form: { label: "FormBuilder", tabId: "form" },
  kanban: { label: "Kanban", tabId: "kanban" },
  "crm-search": { label: "CRM Search", tabId: "crm-search" },
  feed: { label: "Feed", tabId: "feed" },
  calendar: { label: "Calendar", tabId: "calendar" },
  common: { label: "Common Components", tabId: "common" },
  utils: { label: "Utils", tabId: "utils" },
  "text-art": { label: "Text Art", tabId: "text-art" },
  experimental: { label: "Experimental", tabId: "experimental" },
};

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
// Package tab — flagship playground inline, plus a grid of isolated feature
// demos below it (when the package has more than one demo).
// ═══════════════════════════════════════════════════════════════════════════

const PackageTab = ({ demos, label, actions }) => {
  const [activeId, setActiveId] = useState(demos[0]?.id);
  const active = demos.find((d) => d.id === activeId) || demos[0];
  const others = demos.filter((d) => d.id !== active.id);
  return (
    <Flex direction="column" gap="sm">
      {/* key forces a clean remount per demo so header-slot / internal state don't leak across swaps */}
      <DemoDetail
        key={active.id}
        demo={active}
        onBack={() => { }}
        onNavigate={() => { }}
        prevDemo={null}
        nextDemo={null}
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
};

// ═══════════════════════════════════════════════════════════════════════════
// DemoBrowser — the main gallery component
// Tabs for each package, tile grid within, click-through to detail view.
// ═══════════════════════════════════════════════════════════════════════════

export const DemoBrowser = ({ actions }) => {
  const [selectedDemoId, setSelectedDemoId] = useState(null);
  const [activeTab, setActiveTab] = useState("datatable");

  if (selectedDemoId) {
    const currentIndex = ALL_DEMOS.findIndex((d) => d.id === selectedDemoId);
    const demo = ALL_DEMOS[currentIndex];
    if (demo) {
      const prevDemo = currentIndex > 0 ? ALL_DEMOS[currentIndex - 1] : null;
      const nextDemo = currentIndex < ALL_DEMOS.length - 1 ? ALL_DEMOS[currentIndex + 1] : null;
      return (
        <DemoDetail
          demo={demo}
          onBack={() => setSelectedDemoId(null)}
          onNavigate={setSelectedDemoId}
          prevDemo={prevDemo}
          nextDemo={nextDemo}
          actions={actions}
        />
      );
    }
  }

  const datatableDemos = ALL_DEMOS.filter((d) => d.package === "datatable");
  const formDemos = ALL_DEMOS.filter((d) => d.package === "form");
  const kanbanDemos = ALL_DEMOS.filter((d) => d.package === "kanban");
  const crmSearchDemos = ALL_DEMOS.filter((d) => d.package === "crm-search");
  const feedDemos = ALL_DEMOS.filter((d) => d.package === "feed");
  const calendarDemos = ALL_DEMOS.filter((d) => d.package === "calendar");
  const commonDemos = ALL_DEMOS.filter((d) => d.package === "common");
  const utilsDemos = ALL_DEMOS.filter((d) => d.package === "utils");
  const textArtDemos = ALL_DEMOS.filter((d) => d.package === "text-art");
  const experimentalDemos = ALL_DEMOS.filter((d) => d.package === "experimental");
  const datatableDemo = datatableDemos[0];
  const formDemo = formDemos[0];
  const kanbanDemo = kanbanDemos[0];
  const crmSearchDemo = crmSearchDemos[0];
  const feedDemo = feedDemos[0];
  const calendarDemo = calendarDemos[0];

  const handleSelect = (demoId) => {
    const demo = ALL_DEMOS.find((d) => d.id === demoId);
    if (demo) {
      setActiveTab(PACKAGE_META[demo.package].tabId);
    }
    setSelectedDemoId(demoId);
  };

  return (
    <Flex direction="column" gap="sm">
      <Tabs selected={activeTab} onSelectedChange={setActiveTab}>
        <Tab tabId="datatable" title="DataTable">
          {datatableDemo && (
            <PackageTab demos={datatableDemos} label="DataTable" actions={actions} />
          )}
        </Tab>
        <Tab tabId="form" title="FormBuilder">
          {formDemo && (
            <PackageTab demos={formDemos} label="FormBuilder" actions={actions} />
          )}
        </Tab>
        <Tab tabId="kanban" title="Kanban">
          {kanbanDemo && (
            <PackageTab demos={kanbanDemos} label="Kanban" actions={actions} />
          )}
        </Tab>
        <Tab tabId="crm-search" title="CRM Search">
          {crmSearchDemo && (
            <PackageTab demos={crmSearchDemos} label="CRM Search" actions={actions} />
          )}
        </Tab>
        <Tab tabId="feed" title="Feed">
          {feedDemo && (
            <PackageTab demos={feedDemos} label="Feed" actions={actions} />
          )}
        </Tab>
        <Tab tabId="calendar" title="Calendar">
          {calendarDemo && (
            <PackageTab demos={calendarDemos} label="Calendar" actions={actions} />
          )}
        </Tab>
        <Tab tabId="common" title="Common Components">
          <Flex direction="column" gap="xs">
            <DemoGrid demos={commonDemos} onSelect={handleSelect} />
          </Flex>
        </Tab>
        <Tab tabId="utils" title="Utils">
          <Flex direction="column" gap="xs">
            <DemoGrid demos={utilsDemos} onSelect={handleSelect} />
          </Flex>
        </Tab>
        <Tab tabId="text-art" title="Text Art">
          <Flex direction="column" gap="xs">
            <DemoGrid demos={textArtDemos} onSelect={handleSelect} />
          </Flex>
        </Tab>
        <Tab tabId="experimental" title="Experimental">
          <Flex direction="column" gap="xs">
            <DemoGrid demos={experimentalDemos} onSelect={handleSelect} />
          </Flex>
        </Tab>
      </Tabs>
    </Flex>
  );
};
