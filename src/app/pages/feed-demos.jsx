import React, { useCallback, useState } from "react";
import { Button, Flex, Link, Text } from "@hubspot/ui-extensions";
import { Feed } from "hs-uix";

const FEED_DOCS = "https://github.com/05bmckay/hs-uix/blob/main/packages/feed/README.md";

// ---------------------------------------------------------------------------
// Shared sample data
// ---------------------------------------------------------------------------

const NOW = Date.now();
const hoursAgo = (h) => new Date(NOW - h * 60 * 60 * 1000).toISOString();
const daysAgo = (d) => new Date(NOW - d * 24 * 60 * 60 * 1000).toISOString();

const CRM_ACTIVITY = [
  {
    id: "a-1",
    type: "Email",
    iconName: "email",
    title: "Pricing proposal opened",
    timestamp: hoursAgo(2),
    actor: { name: "Sam Patel", initials: "SP" },
    body: "Globex opened the pricing proposal three times this morning. Two contacts viewed pages 4–6 (commercial terms).",
    status: "Opens: 3 · Clicks: 1",
    statusVariant: "success",
    headerActions: [
      { label: "Pin", onClick: () => {} },
      { label: "Copy link", onClick: () => {} },
    ],
    actions: [
      { label: "Reply", icon: "email" },
      { label: "Forward", icon: "forward" },
      { label: "Delete", icon: "delete", variant: "transparent" },
    ],
  },
  {
    id: "a-2",
    type: "Call",
    iconName: "calling",
    title: "Discovery call completed",
    timestamp: hoursAgo(6),
    actor: { name: "Jordan Kim", initials: "JK" },
    body: "Confirmed budget range, timeline, and technical decision maker. Procurement review starts next week.",
    status: "Connected · 42 minutes",
    statusVariant: "success",
    headerActions: [
      { label: "Pin", onClick: () => {} },
      { label: "Copy link", onClick: () => {} },
    ],
    actions: [
      { label: "Email recap", icon: "email" },
      { label: "Create task", icon: "tasks" },
    ],
  },
  {
    id: "a-3",
    type: "Workflow",
    iconName: "workflows",
    title: "Workflow enrolled contact",
    timestamp: daysAgo(2),
    actor: { name: "HubSpot", initials: "HS" },
    body: (
      <Text>
        Illuvium enrolled in <Link href={{ url: "https://app.hubspot.com" }}>MKTG - Set Lead Source From Original Source</Link> after the form submission scoring threshold was met.
      </Text>
    ),
  },
  {
    id: "a-4",
    type: "Note",
    iconName: "comment",
    title: "Note added",
    timestamp: daysAgo(35),
    actor: { name: "Avery Reed", initials: "AR" },
    body: "Customer asked for implementation timeline and pricing details before the buying committee meeting.",
    actions: [
      { label: "Edit", icon: "edit" },
      { label: "Delete", icon: "delete", variant: "transparent" },
    ],
  },
  {
    id: "a-5",
    type: "Meeting",
    iconName: "appointment",
    title: "Solution review held",
    timestamp: daysAgo(40),
    actor: { name: "Morgan Chen", initials: "MC" },
    body: "Reviewed data migration constraints and integration ownership with the technical team.",
  },
];

// ---------------------------------------------------------------------------
// 1. CRM activity timeline — collapsible items, headerActions, body actions
// ---------------------------------------------------------------------------

const CrmTimelineDemo = () => (
  <Feed
    title="Activity"
    description="Latest interactions across this contact."
    items={CRM_ACTIVITY}
    searchFields={["title", "body", "type", "actorName"]}
    filters={[
      {
        name: "type",
        type: "multiselect",
        placeholder: "Activity type",
        options: [
          { label: "Email", value: "Email" },
          { label: "Call", value: "Call" },
          { label: "Note", value: "Note" },
          { label: "Meeting", value: "Meeting" },
          { label: "Workflow", value: "Workflow" },
        ],
      },
    ]}
    sortOptions={[
      { value: "newest", label: "Newest first", field: "timestamp", direction: "desc" },
      { value: "oldest", label: "Oldest first", field: "timestamp", direction: "asc" },
    ]}
    defaultSort="newest"
    groupByDate
    pageSize={5}
    recordLabel={{ singular: "event", plural: "events" }}
  />
);

// ---------------------------------------------------------------------------
// 2. Tabbed feed — real HubSpot Tabs / Tab
// ---------------------------------------------------------------------------

const TabbedFeedDemo = () => (
  <Feed
    title="Activities"
    items={CRM_ACTIVITY}
    tabs={[
      { label: "All activities", value: "all" },
      { label: "Notes", value: "Note" },
      { label: "Emails", value: "Email" },
      { label: "Calls", value: "Call" },
      { label: "Meetings", value: "Meeting" },
    ]}
    tabField="type"
    searchFields={["title", "body"]}
    sortOptions={[
      { value: "newest", label: "Newest first", field: "timestamp", direction: "desc" },
      { value: "oldest", label: "Oldest first", field: "timestamp", direction: "asc" },
    ]}
    defaultSort="newest"
    groupByDate
    pageSize={5}
    recordLabel={{ singular: "event", plural: "events" }}
  />
);

// ---------------------------------------------------------------------------
// 3. Stock trades — non-CRM, no tabs, plain filter + sort
// ---------------------------------------------------------------------------

const TRADES = [
  {
    id: "tr-1",
    type: "Buy",
    iconName: "Up",
    title: "Bought 25 NVDA at $884.12",
    timestamp: hoursAgo(3),
    body: "Limit order filled. Position added to growth basket.",
    status: "Filled",
    statusVariant: "success",
    account: "Growth IRA",
    broker: "Schwab",
  },
  {
    id: "tr-2",
    type: "Sell",
    iconName: "Down",
    title: "Sold 10 AAPL at $192.15",
    timestamp: hoursAgo(7),
    body: "Trimmed position after earnings move. Realized $1,921.50.",
    status: "Filled",
    statusVariant: "success",
    account: "Taxable",
    broker: "Fidelity",
  },
  {
    id: "tr-3",
    type: "Dividend",
    iconName: "invoice",
    title: "MSFT dividend reinvested",
    timestamp: daysAgo(2),
    body: "Quarterly dividend reinvested into 0.42 additional shares.",
    status: "Reinvested",
    statusVariant: "info",
    account: "Growth IRA",
    broker: "Schwab",
  },
  {
    id: "tr-4",
    type: "Transfer",
    iconName: "bank",
    title: "ACH transfer completed",
    timestamp: daysAgo(8),
    body: "$5,000 transferred from operating account, available to trade.",
    status: "Settled",
    statusVariant: "success",
    account: "Taxable",
    broker: "Fidelity",
  },
];

const TradesFeedDemo = () => (
  <Feed
    title="Trade history"
    description="Chronological portfolio activity across linked accounts."
    items={TRADES}
    searchFields={["title", "body", "type", "account", "broker"]}
    filters={[
      {
        name: "account",
        type: "multiselect",
        placeholder: "Account",
        options: [
          { label: "Growth IRA", value: "Growth IRA" },
          { label: "Taxable", value: "Taxable" },
        ],
      },
      {
        name: "broker",
        type: "select",
        placeholder: "Broker",
        options: [
          { label: "Schwab", value: "Schwab" },
          { label: "Fidelity", value: "Fidelity" },
        ],
      },
    ]}
    sortOptions={[
      { value: "newest", label: "Newest first", field: "timestamp", direction: "desc" },
      { value: "oldest", label: "Oldest first", field: "timestamp", direction: "asc" },
    ]}
    defaultSort="newest"
    groupByDate
    pageSize={5}
    recordLabel={{ singular: "trade", plural: "trades" }}
  />
);

// ---------------------------------------------------------------------------
// 4. Audit log — compact, hollow status dots, sparse icons
// ---------------------------------------------------------------------------

const AUDIT = [
  {
    id: "au-1",
    type: "Workflow",
    title: "Lifecycle stage updated",
    timestamp: hoursAgo(1),
    body: "Lifecycle stage changed from Lead → MQL after scoring threshold met.",
    status: "Info",
    statusVariant: "info",
    actor: "Revenue workflow",
    object: "Contact: Illuvium",
    source: "Automation",
  },
  {
    id: "au-2",
    type: "API",
    title: "API retry succeeded",
    timestamp: hoursAgo(4),
    body: "Initial sync timed out, retry completed successfully on attempt 2.",
    status: "Warning",
    statusVariant: "warning",
    actor: "Sync service",
    object: "Deal 445019",
    source: "Integration",
  },
  {
    id: "au-3",
    type: "User",
    title: "Owner reassigned",
    timestamp: daysAgo(1),
    body: "Deal owner changed from Sam Patel to Avery Reed for territory alignment.",
    status: "Complete",
    statusVariant: "success",
    actor: "Morgan Chen",
    object: "Deal: Acme renewal",
    source: "CRM",
  },
  {
    id: "au-4",
    type: "System",
    title: "Sync failed",
    timestamp: daysAgo(2),
    body: "External billing system rejected update because invoice ID was missing.",
    status: "Failed",
    statusVariant: "danger",
    actor: "Billing sync",
    object: "Invoice 8831",
    source: "Integration",
  },
];

const AuditLogDemo = () => (
  <Feed
    title="Audit log"
    description="System, API, workflow, and user events."
    items={AUDIT}
    compact
    searchFields={["title", "body", "actor", "object", "type", "source"]}
    filters={[
      {
        name: "source",
        type: "multiselect",
        placeholder: "Source",
        options: [
          { label: "Automation", value: "Automation" },
          { label: "Integration", value: "Integration" },
          { label: "CRM", value: "CRM" },
        ],
      },
      {
        name: "status",
        type: "select",
        placeholder: "Severity",
        options: [
          { label: "Info", value: "Info" },
          { label: "Warning", value: "Warning" },
          { label: "Complete", value: "Complete" },
          { label: "Failed", value: "Failed" },
        ],
      },
    ]}
    sortOptions={[
      { value: "newest", label: "Newest first", field: "timestamp", direction: "desc" },
      { value: "oldest", label: "Oldest first", field: "timestamp", direction: "asc" },
    ]}
    defaultSort="newest"
    groupByDate
    pageSize={6}
    defaultCollapsed="all"
    recordLabel={{ singular: "entry", plural: "entries" }}
  />
);

// ---------------------------------------------------------------------------
// 5. Minimal feed — no toolbar, no tabs, just items
// ---------------------------------------------------------------------------

const MINIMAL = [
  { id: "m-1", title: "Build kicked off", timestamp: hoursAgo(1), body: "Worker 2026-04-26 started build #142 against main." },
  { id: "m-2", title: "Tests passed", timestamp: hoursAgo(2), body: "All 1,284 unit tests passed in 38 seconds." },
  { id: "m-3", title: "Deployed to staging", timestamp: hoursAgo(3), body: "Build promoted to staging environment for QA review." },
];

const MinimalFeedDemo = () => (
  <Feed
    items={MINIMAL}
    showToolbar={false}
    showCollapseToggle={false}
    collapsible={false}
    container="none"
  />
);

// ---------------------------------------------------------------------------
// 6. Server-driven feed — controlled state with Load more
// ---------------------------------------------------------------------------

const SERVER_PAGES = [
  [
    {
      id: "sv-1",
      type: "Pull request",
      iconName: "GithubBranch",
      title: "PR #4451 merged into main",
      timestamp: hoursAgo(2),
      body: "Patch: feed component initial release. Reviewed by 2 engineers.",
      status: "Merged",
      statusVariant: "success",
    },
    {
      id: "sv-2",
      type: "Issue",
      iconName: "exclamationCircle",
      title: "Issue #8821 closed",
      timestamp: hoursAgo(5),
      body: "Fixed: timestamp formatting in feed cards.",
      status: "Closed",
      statusVariant: "default",
    },
  ],
  [
    {
      id: "sv-3",
      type: "Comment",
      iconName: "comment",
      title: "Avery Reed commented",
      timestamp: daysAgo(1),
      body: "Looks great. One note: can we surface the source on the audit demo?",
    },
    {
      id: "sv-4",
      type: "Pull request",
      iconName: "GithubBranch",
      title: "PR #4448 opened",
      timestamp: daysAgo(2),
      body: "WIP: collapsible feed items behind a feature flag.",
      status: "Open",
      statusVariant: "info",
    },
  ],
];

const ServerFeedDemo = () => {
  const [items, setItems] = useState(SERVER_PAGES[0]);
  const [page, setPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const hasMore = page < SERVER_PAGES.length - 1;

  const handleLoadMore = useCallback(() => {
    setLoadingMore(true);
    setTimeout(() => {
      setItems((prev) => [...prev, ...SERVER_PAGES[page + 1]]);
      setPage((p) => p + 1);
      setLoadingMore(false);
    }, 600);
  }, [page]);

  return (
    <Feed
      title="Repository feed"
      description="Server-driven feed with hasMore + onLoadMore wired to a controlled cursor."
      items={items}
      searchFields={["title", "body", "type"]}
      sortOptions={[
        { value: "newest", label: "Newest first", field: "timestamp", direction: "desc" },
      ]}
      defaultSort="newest"
      groupByDate
      hasMore={hasMore}
      loadingMore={loadingMore}
      onLoadMore={handleLoadMore}
      recordLabel={{ singular: "event", plural: "events" }}
    />
  );
};

// ---------------------------------------------------------------------------
// Demo registry
// ---------------------------------------------------------------------------

export const FEED_DEMOS = [
  {
    id: "feed-crm-timeline",
    name: "CRM activity timeline",
    description:
      "HubSpot-style activity feed: collapsible items, header actions (Pin / Copy link), body actions (Reply / Forward / Delete), hollow status dots, and date grouping.",
    package: "feed",
    Component: CrmTimelineDemo,
    githubUrl: FEED_DOCS,
    sourceCode: `<Feed
  title="Activity"
  items={crmActivity}
  searchFields={["title", "body", "type", "actorName"]}
  filters={[
    { name: "type", type: "multiselect", options: typeOptions },
    { name: "timestamp", type: "dateRange", placeholder: "Date range" },
  ]}
  sortOptions={[
    { value: "newest", label: "Newest first", field: "timestamp", direction: "desc" },
  ]}
  defaultSort="newest"
  groupByDate
  pageSize={5}
/>`,
  },
  {
    id: "feed-tabbed",
    name: "Tabbed feed",
    description:
      "Same data with real HubSpot Tabs / Tab — All activities, Notes, Emails, Calls, Meetings. Filters, search, sort scoped per active tab.",
    package: "feed",
    Component: TabbedFeedDemo,
    githubUrl: FEED_DOCS,
    sourceCode: `<Feed
  items={crmActivity}
  tabs={[
    { label: "All activities", value: "all" },
    { label: "Notes", value: "Note" },
    { label: "Emails", value: "Email" },
    { label: "Calls", value: "Call" },
  ]}
  tabField="type"
  groupByDate
/>`,
  },
  {
    id: "feed-trades",
    name: "Stock trade history",
    description:
      "Non-CRM use case. Generic financial event feed with account / broker filters, sort, and grouped dates — proves Feed isn't tied to activities.",
    package: "feed",
    Component: TradesFeedDemo,
    githubUrl: FEED_DOCS,
    sourceCode: `<Feed
  title="Trade history"
  items={trades}
  filters={[
    { name: "account", type: "multiselect", options: accountOptions },
    { name: "broker", type: "select", options: brokerOptions },
  ]}
  sortOptions={[
    { value: "newest", label: "Newest first", field: "timestamp", direction: "desc" },
  ]}
  defaultSort="newest"
  groupByDate
/>`,
  },
  {
    id: "feed-audit",
    name: "Audit log",
    description:
      "Compact operational feed. Items collapsed by default, severity rendered as hollow StatusTag inside expanded body, source / severity filters in toolbar.",
    package: "feed",
    Component: AuditLogDemo,
    githubUrl: FEED_DOCS,
    sourceCode: `<Feed
  title="Audit log"
  items={auditEntries}
  compact
  defaultCollapsed="all"
  filters={[
    { name: "source", type: "multiselect", options: sourceOptions },
    { name: "status", type: "select", options: severityOptions },
  ]}
  groupByDate
/>`,
  },
  {
    id: "feed-minimal",
    name: "Minimal feed",
    description:
      "No toolbar, no tabs, no container, no collapse. The bare-bones embed-anywhere shape.",
    package: "feed",
    Component: MinimalFeedDemo,
    githubUrl: FEED_DOCS,
    sourceCode: `<Feed
  items={items}
  showToolbar={false}
  showCollapseToggle={false}
  collapsible={false}
  container="none"
/>`,
  },
  {
    id: "feed-server",
    name: "Server-driven feed",
    description:
      "Server pagination via hasMore + onLoadMore. Items append on load-more click; loading state disables the button.",
    package: "feed",
    Component: ServerFeedDemo,
    githubUrl: FEED_DOCS,
    sourceCode: `<Feed
  items={items}
  hasMore={hasMore}
  loadingMore={loadingMore}
  onLoadMore={fetchNextPage}
  groupByDate
/>`,
  },
];
