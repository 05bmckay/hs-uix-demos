import React, { useCallback, useMemo, useState } from "react";
import {
  Button,
  Flex,
  MultiSelect,
  NumberInput,
  PanelSection,
  Select,
  Tag,
  Text,
  ToggleGroup,
} from "@hubspot/ui-extensions";
import { Kanban, KanbanCardActions } from "hs-uix/kanban";
import { AvatarStack } from "hs-uix/common-components";
import { formatCurrencyCompact } from "hs-uix/utils";
import { useCustomizePanel } from "./playground.jsx";
import { GITHUB_BASE_URL } from "./data.jsx";

// ═══════════════════════════════════════════════════════════════════════════
// Shared sample data
// ═══════════════════════════════════════════════════════════════════════════

// ---- Lead pipeline (SOR-style lead inbox) ---------------------------------

const LEAD_STAGES = [
  { value: "Uncontacted",            label: "Uncontacted",            shortLabel: "Uncontacted", variant: "warning" },
  { value: "In Progress",            label: "In Progress",            shortLabel: "In Progress", variant: "warning" },
  { value: "Scheduled Trial/Tour",   label: "Scheduled Trial/Tour",   shortLabel: "Sched Trial", variant: "info" },
  { value: "Trial/Tour Complete",    label: "Trial/Tour Complete",    shortLabel: "Trial Done",  variant: "info" },
  { value: "Immersion Pass",         label: "Immersion Pass",         shortLabel: "Immersion",   variant: "info" },
  { value: "Enrolled",               label: "Enrolled",               shortLabel: "Enrolled",    variant: "success", terminal: true },
  { value: "Lost",                   label: "Lost",                   shortLabel: "Lost",        variant: "default", terminal: true },
];

const LEAD_DATA = [
  { id: "1",  name: "Jane Smith",        loc: "Boston",  email: "jane@acme.com",        status: "In Progress",          createDate: "04/18/2026", nextTask: "Overdue 2d",  priority: "high",   amount: 1200 },
  { id: "2",  name: "Bob Johnson",       loc: "Austin",  email: "bob@globex.com",       status: "Uncontacted",          createDate: "04/21/2026", nextTask: "Due today",   priority: "high",   amount: null },
  { id: "3",  name: "Alice Wesker",      loc: "Boston",  email: "alice@umbrella.com",   status: "Scheduled Trial/Tour", createDate: "04/15/2026", nextTask: "Due in 2d",   priority: "normal", amount: 2400 },
  { id: "4",  name: "Michael Bolton",    loc: "Seattle", email: "michael@initech.com",  status: "Trial/Tour Complete",  createDate: "04/10/2026", nextTask: "",            priority: "normal", amount: 1800 },
  { id: "5",  name: "Pepper Potts",      loc: "Boston",  email: "pepper@stark.com",     status: "Enrolled",             createDate: "04/01/2026", nextTask: "",            priority: "normal", amount: 3600 },
  { id: "6",  name: "Lucius Fox",        loc: "Austin",  email: "lucius@wayne.com",     status: "In Progress",          createDate: "04/17/2026", nextTask: "Due tomorrow",priority:"normal", amount: 1500 },
  { id: "7",  name: "Charlie Bucket",    loc: "Seattle", email: "charlie@wonka.com",    status: "Uncontacted",          createDate: "04/20/2026", nextTask: "Overdue 1d",  priority: "normal", amount: null },
  { id: "8",  name: "Sol Roth",          loc: "Boston",  email: "sol@soylent.com",      status: "Immersion Pass",       createDate: "04/05/2026", nextTask: "",            priority: "normal", amount: 900 },
  { id: "9",  name: "Eldon Tyrell",      loc: "Austin",  email: "eldon@tyrell.com",     status: "In Progress",          createDate: "04/12/2026", nextTask: "Due in 3d",   priority: "high",   amount: 4200 },
  { id: "10", name: "Richard Hendricks", loc: "Seattle", email: "richard@piedpiper.com",status:"Scheduled Trial/Tour",  createDate: "04/14/2026", nextTask: "Due in 1d",   priority: "normal", amount: 2000 },
  { id: "11", name: "Gavin Belson",      loc: "Austin",  email: "gavin@hooli.com",      status: "Lost",                 createDate: "04/02/2026", nextTask: "",            priority: "normal", amount: null },
  { id: "12", name: "Miles Dyson",       loc: "Boston",  email: "miles@cyberdyne.com",  status: "Trial/Tour Complete",  createDate: "04/08/2026", nextTask: "",            priority: "normal", amount: 1800 },
  { id: "13", name: "Deckard R.",        loc: "Seattle", email: "rick@lapd.com",        status: "Uncontacted",          createDate: "04/21/2026", nextTask: "Due today",   priority: "high",   amount: null },
  { id: "14", name: "Sarah Connor",      loc: "Austin",  email: "sarah@resistance.org", status: "In Progress",          createDate: "04/19/2026", nextTask: "Overdue 3d",  priority: "high",   amount: 2100 },
  { id: "15", name: "Neo Anderson",      loc: "Seattle", email: "neo@zion.net",         status: "Enrolled",             createDate: "03/30/2026", nextTask: "",            priority: "normal", amount: 3200 },
];

const LEAD_LOCATIONS = [
  { label: "Boston",  value: "Boston" },
  { label: "Austin",  value: "Austin" },
  { label: "Seattle", value: "Seattle" },
];

const LEAD_SORT_OPTIONS = [
  { value: "newest",   label: "Newest Created",
    comparator: (a, b) => new Date(b.createDate).getTime() - new Date(a.createDate).getTime() },
  { value: "oldest",   label: "Oldest Created",
    comparator: (a, b) => new Date(a.createDate).getTime() - new Date(b.createDate).getTime() },
  { value: "name_asc", label: "Name A-Z",
    comparator: (a, b) => a.name.localeCompare(b.name) },
];

const LEAD_LOAD_MORE_META = {
  "Uncontacted":           { hasMore: true,  totalCount: 42, loading: false },
  "In Progress":           { hasMore: true,  totalCount: 18, loading: false },
  "Scheduled Trial/Tour":  { hasMore: false, totalCount: 6 },
  "Trial/Tour Complete":   { hasMore: false, totalCount: 4 },
  "Immersion Pass":        { hasMore: false, totalCount: 2 },
  "Enrolled":              { hasMore: false, totalCount: 8 },
  "Lost":                  { hasMore: false, totalCount: 12 },
};

// ---- HubSpot Deal board clone ---------------------------------------------

const DEAL_BOARD_STAGES = [
  { value: "new-opp",      label: "New Opportunity",     shortLabel: "New Opportunity" },
  { value: "pricing",      label: "Pricing Complete",    shortLabel: "Pricing Complete" },
  { value: "waiting",      label: "Waiting on Customer", shortLabel: "Waiting on Customer" },
  { value: "changes",      label: "Changes Requested",   shortLabel: "Changes Requested" },
  { value: "closed-lost",  label: "Closed Lost",         shortLabel: "Closed Lost",  terminal: true },
  { value: "closed-won",   label: "Closed Won",          shortLabel: "Closed Won",   terminal: true },
  { value: "ready-revops", label: "Ready for Rev Ops",   shortLabel: "Ready for Rev Ops" },
];

const STAGE_WEIGHTS = {
  "new-opp":      0.10,
  "pricing":      0.70,
  "waiting":      0.70,
  "changes":      0.70,
  "closed-lost":  0,
  "closed-won":   1,
  "ready-revops": 1,
};

const DEAL_OWNERS = [
  "Alex Rivers", "Jordan Kim", "Sam Patel", "Morgan Chen",
  "Riley Singh", "Casey Lopez", "Taylor Brooks", "Jamie Park",
  "Quinn Moreno", "Drew Walsh", "Avery Nguyen",
];

const DATE_RANGES = [
  { label: "Today",        value: "today" },
  { label: "Yesterday",    value: "yesterday" },
  { label: "Tomorrow",     value: "tomorrow" },
  { label: "This week",    value: "this_week" },
  { label: "Last week",    value: "last_week" },
  { label: "Last 7 days",  value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 90 days", value: "90d" },
  { label: "This month",   value: "this_month" },
  { label: "Last month",   value: "last_month" },
  { label: "This quarter", value: "this_quarter" },
  { label: "Last quarter", value: "last_quarter" },
  { label: "This year",    value: "this_year" },
  { label: "Last year",    value: "last_year" },
];

const DEAL_BOARD_DATA = [
  { id: 1,  name: "Acme Corp — Annual License Renewal",           stage: "new-opp",      owner: "Alex Rivers",   amount: null,   companies: ["A", "C"], activity: "Task due in 2 days" },
  { id: 2,  name: "Globex — Initial Contract Q1",                 stage: "new-opp",      owner: "Jordan Kim",    amount: null,   companies: ["G", "X"], activity: "Task due in 2 days" },
  { id: 3,  name: "Initech — Server Refresh 2026",                stage: "new-opp",      owner: "Sam Patel",     amount: null,   companies: ["I", "T"] },
  { id: 4,  name: "Umbrella Corp — Security Audit Quote",         stage: "new-opp",      owner: "Morgan Chen",   amount: null,   companies: ["U"],      flag: "Missing POC" },
  { id: 5,  name: "Stark Industries — Enterprise Suite",          stage: "new-opp",      owner: "Riley Singh",   amount: null,   companies: ["S", "I"] },
  { id: 6,  name: "Wonka Industries — Data Warehouse Pilot",      stage: "new-opp",      owner: "Casey Lopez",   amount: null,   companies: ["W", "I"], activity: "Call 8 hours ago", activity2: "Meeting in 2 days" },
  { id: 10, name: "Pied Piper — Contract Amendment",              stage: "changes",      owner: "Taylor Brooks", amount: null,   companies: ["P", "P"], activity: "Meeting 7 days ago" },
  { id: 20, name: "Oscorp — 2026 Infrastructure Renewal",         stage: "closed-lost",  owner: "Alex Rivers",   amount: null,   companies: ["O", "C"] },
  { id: 21, name: "Cyberdyne Systems — Data Center Expansion",    stage: "closed-lost",  owner: "Sam Patel",     amount: null,   companies: ["C", "S"] },
  { id: 22, name: "Wayne Enterprises — Medical Division Upgrade", stage: "closed-lost",  owner: "Riley Singh",   amount: null,   companies: ["W", "E"] },
  { id: 23, name: "Massive Dynamic — Server Bundle",              stage: "closed-lost",  owner: "Drew Walsh",    amount: null,   companies: ["M", "D"] },
  { id: 24, name: "Hooli — Router Replacement",                   stage: "closed-lost",  owner: "Alex Rivers",   amount: 13125,  companies: ["H"] },
  { id: 25, name: "Tyrell Corp — Storage Addition 2026",          stage: "closed-lost",  owner: "Sam Patel",     amount: null,   companies: ["T", "C"] },
  { id: 30, name: "Dunder Mifflin — Server Coterm 3yr",           stage: "closed-won",   owner: "Alex Rivers",   amount: 240,    companies: ["D", "M"] },
  { id: 31, name: "Acme Corp — 2026 Networking Refresh",          stage: "closed-won",   owner: "Avery Nguyen",  amount: 4160,   companies: ["A", "C"] },
  { id: 32, name: "Globex — Singapore Office Addition",           stage: "closed-won",   owner: "Quinn Moreno",  amount: 287,    companies: ["G", "X"] },
  { id: 33, name: "Globex — Renewal 57021713993",                 stage: "closed-won",   owner: "Quinn Moreno",  amount: 1142,   companies: ["G", "X"] },
  { id: 34, name: "Initech — Switch Upgrade 2026",                stage: "closed-won",   owner: "Avery Nguyen",  amount: 32,     companies: ["I", "T"] },
  { id: 35, name: "Pied Piper — Router Installation (IL)",        stage: "closed-won",   owner: "Avery Nguyen",  amount: 455,    companies: ["P"] },
  { id: 40, name: "Stark Industries — 2026 Renewal",              stage: "ready-revops", owner: "Jamie Park",    amount: 625,    companies: ["S", "I", "S"] },
];

const DEAL_BOARD_META = {
  "new-opp":      { hasMore: false, totalCount: 195 },
  "pricing":      { hasMore: false, totalCount: 339 },
  "waiting":      { hasMore: false, totalCount: 115 },
  "changes":      { hasMore: false, totalCount: 1 },
  "closed-lost":  { hasMore: false, totalCount: 1811 },
  "closed-won":   { hasMore: false, totalCount: 1944 },
  "ready-revops": { hasMore: false, totalCount: 1 },
};

const DEAL_BOARD_SORT_OPTIONS = [
  { value: "amount_desc", field: "amount", fieldLabel: "Amount", direction: "desc", label: "High first",
    comparator: (a, b) => (b.amount || 0) - (a.amount || 0) },
  { value: "amount_asc",  field: "amount", fieldLabel: "Amount", direction: "asc",  label: "Low first",
    comparator: (a, b) => (a.amount || 0) - (b.amount || 0) },
  { value: "name_asc",    field: "name",   fieldLabel: "Name",   direction: "asc",  label: "A to Z",
    comparator: (a, b) => a.name.localeCompare(b.name) },
  { value: "name_desc",   field: "name",   fieldLabel: "Name",   direction: "desc", label: "Z to A",
    comparator: (a, b) => b.name.localeCompare(a.name) },
  { value: "owner_asc",   field: "owner",  fieldLabel: "Owner",  direction: "asc",  label: "A to Z",
    comparator: (a, b) => a.owner.localeCompare(b.owner) },
  { value: "owner_desc",  field: "owner",  fieldLabel: "Owner",  direction: "desc", label: "Z to A",
    comparator: (a, b) => b.owner.localeCompare(a.owner) },
];

const DEAL_BOARD_METRICS = [
  { id: "total",    label: "Total deal amount",    number: "$123.58M" },
  { id: "weighted", label: "Weighted deal amount", number: "$32.54M" },
  { id: "open",     label: "Open deal amount",     number: "$13.23M" },
  { id: "closed",   label: "Closed deal amount",   number: "$28.46M" },
  { id: "new",      label: "New deal amount",      number: "$0" },
  { id: "avgAge",   label: "Average deal age",     number: "3.5 months" },
];

// ---- Minimal 3-stage deal pipeline ----------------------------------------

const DEAL_MIN_STAGES = [
  { value: "active",  label: "Active",  variant: "success" },
  { value: "at-risk", label: "At Risk", variant: "warning" },
  { value: "churned", label: "Churned", variant: "default", terminal: true },
];

const DEAL_MIN_DATA = [
  { id: 101, company: "Acme Corp",        status: "active",  amount: 125000, closeDate: "2026-01-15" },
  { id: 102, company: "Globex Inc",       status: "active",  amount: 67000,  closeDate: "2026-02-03" },
  { id: 103, company: "Initech",          status: "churned", amount: 12000,  closeDate: "2025-11-20" },
  { id: 104, company: "Umbrella Corp",    status: "at-risk", amount: 230000, closeDate: "2026-03-01" },
  { id: 105, company: "Stark Industries", status: "active",  amount: 450000, closeDate: "2026-01-28" },
  { id: 106, company: "Wonka Industries", status: "at-risk", amount: 42000,  closeDate: "2026-02-14" },
];

// ═══════════════════════════════════════════════════════════════════════════
// Card field builders — per data shape, parameterized by current controls
// so things like actions display / separator update live.
// ═══════════════════════════════════════════════════════════════════════════

const makeLeadActions = () => [
  { key: "email", label: "Email", icon: "email",   onClick: () => {} },
  { key: "note",  label: "Note",  icon: "comment", onClick: () => {} },
  { key: "task",  label: "Task",  icon: "tasks",   onClick: () => {} },
];

const buildLeadCardFields = (controls) => {
  const fields = [
    {
      field: "name",
      placement: "title",
      href: (row) => ({ url: `https://app.hubspot.com/contacts/0/contact/${row.id}` }),
    },
  ];

  if (controls.cardDensity === "comfortable") {
    fields.push({ field: "email", placement: "subtitle", render: (v) => v });
  }

  fields.push(
    { field: "loc",        placement: "body", label: "Location",  render: (v) => v },
    { field: "createDate", placement: "body", label: "Created",   render: (v) => v },
    { field: "nextTask",   placement: "body", label: "Next task", render: (v) => v || "—" },
  );

  if (controls.cardDensity === "comfortable") {
    fields.push({
      field: "amount", placement: "body", label: "Amount",
      render: (v) => (v ? `$${v.toLocaleString()}` : "—"),
    });
  }

  fields.push({
    key: "priority-tag",
    placement: "footer",
    visible: (row) => row.priority === "high",
    render: () => (
      <Flex direction="row" gap="xs">
        <Tag variant="warning">High priority</Tag>
      </Flex>
    ),
  });

  fields.push({
    key: "actions",
    placement: "footer",
    render: (_, row) => (
      <KanbanCardActions
        display={controls.cardActionsDisplay}
        separator={controls.cardActionsSeparator}
        actions={makeLeadActions(row)}
      />
    ),
  });

  return fields;
};

const buildDealBoardCardFields = (controls) => [
  {
    field: "name",
    placement: "title",
    href: (row) => ({ url: `https://app.hubspot.com/deals/0/deal/${row.id}` }),
  },
  {
    field: "amount", placement: "body", label: "Amount",
    visible: (r) => r.amount != null,
    render: (v) => `$${v.toLocaleString()}`,
  },
  { field: "owner",  placement: "body", label: "Deal owner" },
  {
    key: "avatars", placement: "body",
    visible: (r) => Array.isArray(r.companies) && r.companies.length > 0,
    render: (_, r) => <AvatarStack items={r.companies} />,
  },
  {
    key: "flag", placement: "body",
    visible: (r) => !!r.flag,
    render: (_, r) => (
      <Flex direction="row" gap="xs">
        <Tag variant="error">{r.flag}</Tag>
      </Flex>
    ),
  },
  {
    key: "activity", placement: "body",
    visible: (r) => !!r.activity,
    render: (_, r) => (
      <Flex direction="row" gap="sm">
        {r.activity  ? <Text variant="microcopy">{r.activity}</Text>  : null}
        {r.activity2 ? <Text variant="microcopy">{r.activity2}</Text> : null}
      </Flex>
    ),
  },
  {
    key: "actions", placement: "footer",
    render: () => (
      <KanbanCardActions
        display={controls.cardActionsDisplay}
        separator={controls.cardActionsSeparator}
        actions={[
          { key: "preview",    label: "Preview",               icon: "viewDetails",            onClick: () => {} },
          { key: "properties", label: "Fill smart properties", icon: "artificialIntelligence", onClick: () => {} },
          { key: "email",      label: "Email",                 icon: "email",                  onClick: () => {} },
          { key: "edit",       label: "Edit",                  icon: "edit",                   onClick: () => {} },
        ]}
      />
    ),
  },
];

const buildDealMinCardFields = () => [
  {
    field: "company", placement: "title",
    href: (row) => ({ url: `https://app.hubspot.com/contacts/0/record/0-3/${row.id}` }),
  },
  { field: "amount",    placement: "body", label: "Amount",     render: (v) => `$${v.toLocaleString()}` },
  { field: "closeDate", placement: "body", label: "Close date", render: (v) => v },
];

// ═══════════════════════════════════════════════════════════════════════════
// Weighted column footer for the deal board preset
// ═══════════════════════════════════════════════════════════════════════════

const buildDealBoardFooter = (stageRows, stage) => {
  const total = stageRows.reduce((s, r) => s + (r.amount || 0), 0);
  const weight = STAGE_WEIGHTS[stage.value] ?? 0;
  const weighted = total * weight;
  const pct = Math.round(weight * 100);
  if (stage.value === "closed-won") {
    return (
      <Flex direction="column" gap="flush">
        <Text variant="microcopy">{`${formatCurrencyCompact(total)} | Total amount`}</Text>
        <Text variant="microcopy">Won (100%)</Text>
      </Flex>
    );
  }
  if (stage.value === "closed-lost") {
    return (
      <Flex direction="column" gap="flush">
        <Text variant="microcopy">{`${formatCurrencyCompact(total)} | Total amount`}</Text>
        <Text variant="microcopy">Lost (0%)</Text>
      </Flex>
    );
  }
  return (
    <Flex direction="column" gap="flush">
      <Text variant="microcopy">{`${formatCurrencyCompact(total)} | Total amount`}</Text>
      <Text variant="microcopy">{`${formatCurrencyCompact(weighted)} (${pct}%) | Weighted amount`}</Text>
    </Flex>
  );
};

const buildLeadFooter = (rows) =>
  `${rows.length} leads${rows.some((r) => r.priority === "high") ? " · high priority" : ""}`;

// ═══════════════════════════════════════════════════════════════════════════
// Preset definitions — each preset snapshots the full control state plus the
// dataShape that drives the card fields / stages / filters.
// ═══════════════════════════════════════════════════════════════════════════

const LEAD_FILTERS = [
  { name: "loc", placeholder: "All locations", options: LEAD_LOCATIONS },
];

const DEAL_BOARD_FILTERS = [
  { name: "owner", type: "multiselect", placeholder: "Deal owner", chipLabel: "Owner",
    options: DEAL_OWNERS.map((o) => ({ label: o, value: o })) },
  { name: "createDate",   placeholder: "Create date",        chipLabel: "Created",       options: DATE_RANGES },
  { name: "lastActivity", placeholder: "Last activity date", chipLabel: "Last activity", options: DATE_RANGES },
  { name: "closeDate",    placeholder: "Close date",         chipLabel: "Close date",    options: DATE_RANGES },
];

const KANBAN_PRESETS = {
  "lead-compact": {
    label: "Compact lead board",
    description: "Compact density, icon-only footer actions, menu stage control, single filter, title-as-link.",
    dataShape: "lead",
    cardDensity: "compact",
    dividers: [],
    stageControl: "menu",
    countDisplay: "tag",
    cardActionsDisplay: "icon",
    cardActionsSeparator: "none",
    columnWidth: 280,
    filterInlineLimit: 2,
    maxCardsPerColumn: 12,
    features: ["filters", "sort", "search", "showFilterBadges", "showClearFiltersButton"],
    collapsedStages: [],
  },
  "lead-comfortable": {
    label: "Comfortable lead board",
    description: "Comfortable density — subtitle, labeled pipe actions, dividers between every region, select stage control.",
    dataShape: "lead",
    cardDensity: "comfortable",
    dividers: ["afterTitle", "afterSubtitle", "afterBody", "afterFooter"],
    stageControl: "select",
    countDisplay: "tag",
    cardActionsDisplay: "iconAndLabel",
    cardActionsSeparator: "pipe",
    columnWidth: 320,
    filterInlineLimit: 2,
    maxCardsPerColumn: 12,
    features: ["filters", "sort", "search", "showFilterBadges", "showClearFiltersButton"],
    collapsedStages: [],
  },
  "lead-full": {
    label: "Selection + Load more",
    description: "Bulk selection, per-column stageMeta + onLoadMore pagination, terminal stages, column footer with counts.",
    dataShape: "lead",
    cardDensity: "compact",
    dividers: [],
    stageControl: "menu",
    countDisplay: "tag",
    cardActionsDisplay: "icon",
    cardActionsSeparator: "none",
    columnWidth: 280,
    filterInlineLimit: 2,
    maxCardsPerColumn: 50,
    features: [
      "selectable", "filters", "sort", "search", "loadMore",
      "columnFooter", "showFilterBadges", "showClearFiltersButton",
    ],
    collapsedStages: [],
  },
  "deal-board": {
    label: "HubSpot Deal board clone",
    description: "Recreation of HubSpot's native Deals kanban: 7 stages (2 pre-collapsed), terminal Won/Lost, weighted-amount footers, owner + 3 date filters, metrics panel, avatar chips, Missing-POC flag.",
    dataShape: "deal-board",
    cardDensity: "compact",
    dividers: [],
    stageControl: "menu",
    countDisplay: "tag",
    cardActionsDisplay: "icon",
    cardActionsSeparator: "none",
    columnWidth: 350,
    filterInlineLimit: 2,
    maxCardsPerColumn: 50,
    features: [
      "selectable", "filters", "sort", "search", "fuzzySearch", "metrics",
      "columnFooter", "showFilterBadges", "showClearFiltersButton",
    ],
    collapsedStages: ["pricing", "waiting"],
  },
  "deal-minimal": {
    label: "Minimal 3-stage pipeline",
    description: "Tiny 3-stage board using deal-shaped data. Shows the component works for non-lead shapes with very few props.",
    dataShape: "deal-minimal",
    cardDensity: "compact",
    dividers: [],
    stageControl: "menu",
    countDisplay: "tag",
    cardActionsDisplay: "icon",
    cardActionsSeparator: "none",
    columnWidth: 280,
    filterInlineLimit: 2,
    maxCardsPerColumn: 20,
    features: [],
    collapsedStages: [],
  },
};

const KANBAN_PRESET_OPTIONS = Object.entries(KANBAN_PRESETS).map(([value, preset]) => ({
  label: preset.label,
  value,
}));

// ═══════════════════════════════════════════════════════════════════════════
// Drawer option lists
// ═══════════════════════════════════════════════════════════════════════════

const DENSITY_OPTIONS = [
  { label: "Compact",     value: "compact" },
  { label: "Comfortable", value: "comfortable" },
];

const DIVIDER_OPTIONS = [
  { label: "After title",    value: "afterTitle" },
  { label: "After subtitle", value: "afterSubtitle" },
  { label: "After body",     value: "afterBody" },
  { label: "After footer",   value: "afterFooter" },
];

const STAGE_CONTROL_OPTIONS = [
  { label: "Dropdown select", value: "select" },
  { label: "Move-to menu",    value: "menu" },
  { label: "None",            value: "none" },
];

const COUNT_DISPLAY_OPTIONS = [
  { label: "Tag",  value: "tag" },
  { label: "Text", value: "text" },
  { label: "None", value: "none" },
];

const CARD_ACTIONS_DISPLAY_OPTIONS = [
  { label: "Icon only",     value: "icon" },
  { label: "Label only",    value: "label" },
  { label: "Icon + label",  value: "iconAndLabel" },
];

const CARD_ACTIONS_SEPARATOR_OPTIONS = [
  { label: "None", value: "none" },
  { label: "Pipe", value: "pipe" },
];

const FEATURE_OPTIONS = [
  { label: "Selection + bulk actions",    value: "selectable" },
  { label: "Filters",                      value: "filters" },
  { label: "Sort",                         value: "sort" },
  { label: "Search",                       value: "search" },
  { label: "Fuzzy search",                 value: "fuzzySearch" },
  { label: "Metrics panel",                value: "metrics" },
  { label: "Load more (stageMeta)",        value: "loadMore" },
  { label: "Column footer",                value: "columnFooter" },
  { label: "Filter chips",                 value: "showFilterBadges" },
  { label: "Clear filters button",         value: "showClearFiltersButton" },
];

// ═══════════════════════════════════════════════════════════════════════════
// State + helpers
// ═══════════════════════════════════════════════════════════════════════════

const createKanbanPlaygroundState = (presetId = "lead-compact") => ({
  presetId,
  ...KANBAN_PRESETS[presetId],
});

const getInitialDataFor = (dataShape) => {
  if (dataShape === "deal-board")   return DEAL_BOARD_DATA;
  if (dataShape === "deal-minimal") return DEAL_MIN_DATA;
  return LEAD_DATA;
};

const getInitialMetaFor = (preset) => {
  if (!preset.features.includes("loadMore")) return null;
  if (preset.dataShape === "lead") return { ...LEAD_LOAD_MORE_META };
  if (preset.dataShape === "deal-board") return { ...DEAL_BOARD_META };
  return null;
};

const stageFieldFor = (dataShape) => (dataShape === "deal-board" ? "stage" : "status");

const dividersObject = (values) =>
  DIVIDER_OPTIONS.reduce((acc, opt) => ({ ...acc, [opt.value]: values.includes(opt.value) }), {});

// Build a synthetic load-more-row for the lead board simulation.
const synthLeadRow = (stage, n) => ({
  id: `${stage}-${n}`,
  name: `Lead ${n}`,
  loc: ["Boston", "Austin", "Seattle"][n % 3],
  email: `lead${n}@example.com`,
  status: stage,
  createDate: "04/21/2026",
  nextTask: "",
  priority: n % 4 === 0 ? "high" : "normal",
  amount: null,
});

// ═══════════════════════════════════════════════════════════════════════════
// Playground component
// ═══════════════════════════════════════════════════════════════════════════

const KanbanPlaygroundDemo = ({ actions: alertActions }) => {
  const [controls, setControls] = useState(() => createKanbanPlaygroundState());
  const [data, setData] = useState(() => getInitialDataFor(controls.dataShape));
  const [meta, setMeta] = useState(() => getInitialMetaFor(controls));
  const [collapsedStages, setCollapsedStages] = useState(controls.collapsedStages);

  const addAlert = alertActions?.addAlert || (() => {});

  // ---- Preset application — reset data + meta + collapsed ------------------

  const applyPreset = useCallback((presetId) => {
    const next = createKanbanPlaygroundState(presetId);
    setControls(next);
    setData(getInitialDataFor(next.dataShape));
    setMeta(getInitialMetaFor(next));
    setCollapsedStages(next.collapsedStages);
  }, []);

  const updateControls = useCallback((key, value) => {
    setControls((current) => ({ ...current, [key]: value }));
  }, []);

  const handleFeatureChange = useCallback((values) => {
    setControls((current) => ({ ...current, features: values }));
  }, []);

  const handleDividerChange = useCallback((values) => {
    setControls((current) => ({ ...current, dividers: values }));
  }, []);

  // ---- onStageChange — stage field differs per shape -----------------------

  const stageField = stageFieldFor(controls.dataShape);

  const onStageChange = useCallback(
    (row, newStage) =>
      setData((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, [stageField]: newStage } : r)),
      ),
    [stageField],
  );

  // ---- Load-more simulation (only active when feature is on) ---------------

  const onLoadMore = useCallback((stage) => {
    setMeta((prevMeta) => {
      if (!prevMeta) return prevMeta;
      return { ...prevMeta, [stage]: { ...prevMeta[stage], loading: true } };
    });
    setTimeout(() => {
      setData((prevRows) => {
        const existingInStage = prevRows.filter((r) => r.status === stage).length;
        const totalForStage = meta?.[stage]?.totalCount || 0;
        const remaining = Math.max(0, totalForStage - existingInStage);
        const toAdd = Math.min(5, remaining);
        const nextRows = [...prevRows];
        for (let i = 0; i < toAdd; i++) {
          const n = prevRows.length + i + 1;
          nextRows.push(synthLeadRow(stage, n));
        }
        const nextLoaded = existingInStage + toAdd;
        const done = nextLoaded >= totalForStage;
        setMeta((prevMeta) => {
          if (!prevMeta) return prevMeta;
          return { ...prevMeta, [stage]: { ...prevMeta[stage], loading: false, hasMore: !done } };
        });
        return nextRows;
      });
      addAlert({ type: "info", title: "Loaded more", message: `Appended 5 rows to ${stage}.` });
    }, 600);
  }, [meta, addAlert]);

  // ---- Selection actions (preset-specific) ---------------------------------

  const selectionActions = useMemo(() => {
    if (!controls.features.includes("selectable")) return [];
    if (controls.dataShape === "deal-board") {
      return [
        { label: "→ Assign",              variant: "transparent", onClick: (ids) => addAlert({ type: "info",   title: "Assign",           message: `${ids.length} deals` }) },
        { label: "Fill smart properties", icon: "star",                  variant: "transparent", onClick: ()    => addAlert({ type: "info",   title: "Smart properties", message: "Filled" }) },
        { label: "Share",                 icon: "contact",               variant: "transparent", onClick: ()    => addAlert({ type: "info",   title: "Share",            message: "Opened share panel" }) },
        { label: "Edit",                  icon: "edit",                  variant: "transparent", onClick: ()    => addAlert({ type: "info",   title: "Edit",             message: "Bulk edit" }) },
        { label: "Delete",                icon: "delete",                variant: "transparent", onClick: (ids) => addAlert({ type: "danger", title: "Delete",           message: `Would delete ${ids.length}` }) },
      ];
    }
    // Lead-shape defaults — move actions for each major stage
    return [
      { label: "Email",                  variant: "secondary", onClick: (ids) => addAlert({ type: "success", title: "Bulk email", message: `Would email ${ids.length} contacts.` }) },
      { label: "→ In Progress",           variant: "secondary", onClick: (ids) => moveLeadTo(ids, "In Progress") },
      { label: "→ Scheduled Trial/Tour",  variant: "secondary", onClick: (ids) => moveLeadTo(ids, "Scheduled Trial/Tour") },
      { label: "→ Enrolled",              variant: "primary",   onClick: (ids) => moveLeadTo(ids, "Enrolled") },
      { label: "→ Lost",                  variant: "secondary", onClick: (ids) => moveLeadTo(ids, "Lost") },
    ];

    function moveLeadTo(ids, stage) {
      setData((prev) => prev.map((r) => (ids.includes(r.id) ? { ...r, status: stage } : r)));
      addAlert({ type: "success", title: "Moved", message: `Moved ${ids.length} to ${stage}.` });
    }
  }, [controls.features, controls.dataShape, addAlert]);

  // ---- Kanban prop bag derived from controls -------------------------------

  const kanbanProps = useMemo(() => {
    const hasFeature = (f) => controls.features.includes(f);
    const base = {
      data,
      rowIdField: "id",
      groupBy: stageField,
      cardDensity: controls.cardDensity,
      cardDividers: dividersObject(controls.dividers),
      stageControl: controls.stageControl,
      countDisplay: controls.countDisplay,
      columnWidth: controls.columnWidth,
      filterInlineLimit: controls.filterInlineLimit,
      maxCardsPerColumn: controls.maxCardsPerColumn,
      showFilterBadges: hasFeature("showFilterBadges"),
      showClearFiltersButton: hasFeature("showClearFiltersButton"),
      fuzzySearch: hasFeature("fuzzySearch"),
      onStageChange,
      collapsedStages,
      onCollapsedStagesChange: setCollapsedStages,
    };

    if (controls.dataShape === "lead") {
      Object.assign(base, {
        stages: LEAD_STAGES,
        cardFields: buildLeadCardFields(controls),
        searchFields: hasFeature("search") ? ["name", "email"] : [],
        sortOptions: hasFeature("sort") ? LEAD_SORT_OPTIONS : [],
        defaultSort: hasFeature("sort") ? "newest" : undefined,
        filters: hasFeature("filters") ? LEAD_FILTERS : [],
        selectable: hasFeature("selectable"),
        selectionActions,
        recordLabel: { singular: "lead", plural: "leads" },
        stageMeta: hasFeature("loadMore") ? (meta ?? undefined) : undefined,
        onLoadMore: hasFeature("loadMore") ? onLoadMore : undefined,
        columnFooter: hasFeature("columnFooter") ? buildLeadFooter : undefined,
      });
    } else if (controls.dataShape === "deal-board") {
      Object.assign(base, {
        stages: DEAL_BOARD_STAGES,
        cardFields: buildDealBoardCardFields(controls),
        searchFields: hasFeature("search") ? ["name", "owner"] : [],
        sortOptions: hasFeature("sort") ? DEAL_BOARD_SORT_OPTIONS : [],
        filters: hasFeature("filters") ? DEAL_BOARD_FILTERS : [],
        selectable: hasFeature("selectable"),
        selectionActions,
        recordLabel: { singular: "deal", plural: "deals" },
        metrics: hasFeature("metrics") ? DEAL_BOARD_METRICS : undefined,
        columnFooter: hasFeature("columnFooter") ? buildDealBoardFooter : undefined,
      });
    } else {
      Object.assign(base, {
        stages: DEAL_MIN_STAGES,
        cardFields: buildDealMinCardFields(),
      });
    }

    return base;
  }, [
    controls,
    data,
    meta,
    collapsedStages,
    onStageChange,
    onLoadMore,
    selectionActions,
    stageField,
  ]);

  // ---- Customize drawer ----------------------------------------------------

  useCustomizePanel({
    id: "kanban-playground-controls",
    title: "Customize kanban",
    onReset: () => applyPreset(controls.presetId),
    body: (
      <>
        <PanelSection>
          <Flex direction="column" gap="sm">
            <Text>
              Pick a preset, then tune card rendering, stage controls, and features live against the same board.
            </Text>
            <Select
              label="Preset"
              name="kanban-preset"
              value={controls.presetId}
              options={KANBAN_PRESET_OPTIONS}
              onChange={applyPreset}
            />
          </Flex>
        </PanelSection>

        <PanelSection>
          <Flex direction="column" gap="sm">
            <Text format={{ fontWeight: "demibold" }}>Card rendering</Text>
            <Select
              label="Density"
              name="kanban-density"
              value={controls.cardDensity}
              options={DENSITY_OPTIONS}
              onChange={(value) => updateControls("cardDensity", value)}
            />
            <ToggleGroup
              toggleType="checkboxList"
              name="kanban-dividers"
              label="Dividers"
              value={controls.dividers}
              options={DIVIDER_OPTIONS}
              onChange={handleDividerChange}
            />
            <Select
              label="Card actions display"
              name="kanban-actions-display"
              value={controls.cardActionsDisplay}
              options={CARD_ACTIONS_DISPLAY_OPTIONS}
              onChange={(value) => updateControls("cardActionsDisplay", value)}
            />
            <Select
              label="Card actions separator"
              name="kanban-actions-separator"
              value={controls.cardActionsSeparator}
              options={CARD_ACTIONS_SEPARATOR_OPTIONS}
              onChange={(value) => updateControls("cardActionsSeparator", value)}
            />
          </Flex>
        </PanelSection>

        <PanelSection>
          <Flex direction="column" gap="sm">
            <Text format={{ fontWeight: "demibold" }}>Stage transitions</Text>
            <Select
              label="Stage control"
              name="kanban-stage-control"
              value={controls.stageControl}
              options={STAGE_CONTROL_OPTIONS}
              onChange={(value) => updateControls("stageControl", value)}
            />
            <Select
              label="Column count display"
              name="kanban-count-display"
              value={controls.countDisplay}
              options={COUNT_DISPLAY_OPTIONS}
              onChange={(value) => updateControls("countDisplay", value)}
            />
          </Flex>
        </PanelSection>

        <PanelSection>
          <Flex direction="column" gap="sm">
            <ToggleGroup
              toggleType="checkboxList"
              name="kanban-features"
              label="Features"
              value={controls.features}
              options={FEATURE_OPTIONS}
              onChange={handleFeatureChange}
            />
          </Flex>
        </PanelSection>

        <PanelSection>
          <Flex direction="column" gap="sm">
            <Text format={{ fontWeight: "demibold" }}>Layout</Text>
            <NumberInput
              label="Column width (px)"
              name="kanban-column-width"
              min={280}
              max={480}
              value={controls.columnWidth}
              onChange={(value) => updateControls("columnWidth", value)}
            />
            <NumberInput
              label="Inline filter count"
              name="kanban-filter-inline-limit"
              min={1}
              max={4}
              value={controls.filterInlineLimit}
              onChange={(value) => updateControls("filterInlineLimit", value)}
            />
            <NumberInput
              label="Max cards per column"
              name="kanban-max-cards"
              min={5}
              max={100}
              value={controls.maxCardsPerColumn}
              onChange={(value) => updateControls("maxCardsPerColumn", value)}
            />
          </Flex>
        </PanelSection>

        {controls.dataShape === "deal-board" && (
          <PanelSection>
            <Flex direction="column" gap="sm">
              <Text format={{ fontWeight: "demibold" }}>Collapsed stages</Text>
              <MultiSelect
                label="Pre-collapsed stages"
                name="kanban-collapsed-stages"
                value={collapsedStages}
                options={DEAL_BOARD_STAGES.map((s) => ({ label: s.label, value: s.value }))}
                onChange={setCollapsedStages}
              />
            </Flex>
          </PanelSection>
        )}
      </>
    ),
  }, [
    controls,
    collapsedStages,
    applyPreset,
    updateControls,
    handleDividerChange,
    handleFeatureChange,
  ]);

  return (
    <Flex direction="column" gap="sm">
      <Kanban {...kanbanProps} />
    </Flex>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Isolated feature demos — one focused card per capability
// ═══════════════════════════════════════════════════════════════════════════

const KN_GITHUB = `${GITHUB_BASE_URL}/kanban`;
const knNotify = (actions, message, type = "success") => actions?.addAlert?.({ type, message });

const KN_DEALS = [
  { id: 1, name: "Acme renewal", amount: 125000, stage: "new", owner: "Jane" },
  { id: 2, name: "Globex expansion", amount: 67000, stage: "qualified", owner: "Bob" },
  { id: 3, name: "Initech pilot", amount: 12000, stage: "new", owner: "Mike" },
  { id: 4, name: "Umbrella upsell", amount: 230000, stage: "qualified", owner: "Alice" },
  { id: 5, name: "Stark deal", amount: 450000, stage: "won", owner: "Pepper" },
  { id: 6, name: "Wonka trial", amount: 42000, stage: "new", owner: "Charlie" },
];

const KN_STAGES = [
  { value: "new", label: "New", variant: "default" },
  { value: "qualified", label: "Qualified", variant: "info" },
  { value: "won", label: "Won", variant: "success" },
  { value: "lost", label: "Lost", variant: "warning", terminal: true },
];

const KN_CARD_FIELDS = [
  { field: "name", placement: "title" },
  { field: "amount", placement: "meta", render: (v) => formatCurrencyCompact(v) },
  { field: "owner", label: "Owner", placement: "body" },
];

// Stage transitions — canEnter, onEnterRequired confirmation, terminal stage
const StageTransitionsDemo = ({ actions }) => {
  const [data, setData] = useState(() => KN_DEALS.map((d) => ({ ...d })));
  const stages = [
    { value: "new", label: "New", variant: "default" },
    { value: "qualified", label: "Qualified", variant: "info", canEnter: (row) => row.amount >= 20000 },
    {
      value: "won",
      label: "Won",
      variant: "success",
      onEnterRequired: {
        render: ({ row, onConfirm, onCancel }) => (
          <Flex direction="column" gap="sm">
            <Text>Mark {row.name} as Won?</Text>
            <Flex direction="row" gap="sm">
              <Button variant="primary" onClick={() => onConfirm()}>Confirm</Button>
              <Button variant="secondary" onClick={onCancel}>Cancel</Button>
            </Flex>
          </Flex>
        ),
      },
    },
    { value: "lost", label: "Lost", variant: "warning", terminal: true },
  ];
  return (
    <Flex direction="column" gap="sm">
      <Text>
        Use a card's stage control: canEnter blocks Qualified for deals under $20k,{" "}
        onEnterRequired prompts to confirm before Won, and Lost is{" "}
        terminal (no moves out).
      </Text>
      <Kanban
        data={data}
        rowIdField="id"
        groupBy="stage"
        stages={stages}
        stageControl="select"
        cardFields={KN_CARD_FIELDS}
        onStageChange={(row, newStage) => {
          setData((prev) => prev.map((d) => (d.id === row.id ? { ...d, stage: newStage } : d)));
          knNotify(actions, `${row.name} → ${newStage}`);
        }}
      />
    </Flex>
  );
};

// Metrics panel + collapsed stages
const MetricsCollapsedDemo = () => {
  const [collapsed, setCollapsed] = useState(["lost"]);
  const metrics = [
    { id: "open", label: "Open deals", number: 4 },
    { id: "pipeline", label: "Pipeline", number: "$884k", trend: { direction: "increase", value: "12%", color: "green" } },
    { id: "won", label: "Won", number: "$450k" },
  ];
  return (
    <Flex direction="column" gap="sm">
      <Text>
        A metrics panel (toggle it via the toolbar's Metrics button) and controlled{" "}
        collapsedStages — "Lost" starts collapsed into a rail; click it to expand.
      </Text>
      <Kanban
        data={KN_DEALS}
        rowIdField="id"
        groupBy="stage"
        stages={KN_STAGES}
        cardFields={KN_CARD_FIELDS}
        metrics={metrics}
        showMetrics
        collapsedStages={collapsed}
        onCollapsedStagesChange={setCollapsed}
      />
    </Flex>
  );
};

// Per-stage load-more with loading + error/retry
const LoadMoreDemo = ({ actions }) => {
  const [data, setData] = useState(() => KN_DEALS.map((d) => ({ ...d })));
  const [meta, setMeta] = useState({
    new: { hasMore: true, totalCount: 12 },
    qualified: { hasMore: true, totalCount: 8 },
    won: { hasMore: false },
    lost: { hasMore: false },
  });
  const failedOnce = React.useRef({});
  const onLoadMore = useCallback((stage) => {
    // "qualified" simulates a flaky endpoint: the first attempt fails (shows a
    // retry), the retry succeeds. Every other stage loads immediately.
    if (stage === "qualified" && !failedOnce.current[stage]) {
      failedOnce.current[stage] = true;
      setMeta((prev) => ({ ...prev, [stage]: { ...prev[stage], error: "Couldn't reach the server" } }));
      knNotify(actions, "Load failed — hit retry", "warning");
      return;
    }
    setData((prev) => {
      const base = prev.filter((d) => d.stage === stage).length;
      return [
        ...prev,
        { id: `${stage}-x${base + 1}`, name: `${stage} deal ${base + 1}`, amount: 30000, stage, owner: "—" },
        { id: `${stage}-x${base + 2}`, name: `${stage} deal ${base + 2}`, amount: 45000, stage, owner: "—" },
      ];
    });
    setMeta((prev) => ({ ...prev, [stage]: { ...prev[stage], error: undefined, hasMore: false } }));
    knNotify(actions, `Loaded more in "${stage}"`, "info");
  }, [actions]);
  return (
    <Flex direction="column" gap="sm">
      <Text>
        Per-stage stageMeta drives the column footer: stages with hasMore show a "Load more" button.
        "Qualified" simulates a flaky endpoint — its first load fails and shows a retry, which then succeeds.
      </Text>
      <Kanban
        data={data}
        rowIdField="id"
        groupBy="stage"
        stages={KN_STAGES}
        cardFields={KN_CARD_FIELDS}
        stageMeta={meta}
        onLoadMore={onLoadMore}
      />
    </Flex>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Demo registry — playground + isolated feature cards
// ═══════════════════════════════════════════════════════════════════════════

const KANBAN_DOCS = "https://github.com/05bmckay/hs-uix/blob/main/packages/kanban/SPEC.md";

export const KANBAN_DEMOS = [
  {
    id: "kanban-playground",
    name: "Interactive Kanban Playground",
    description: "Storybook-style Kanban preview with presets (compact lead / comfortable / selection+load-more / HubSpot Deal board clone / minimal 3-stage) and a drawer of live controls for density, dividers, stage control, features, and layout.",
    package: "kanban",
    Component: KanbanPlaygroundDemo,
    githubUrl: KANBAN_DOCS,
    sourceCode: `// Interactive Kanban Playground
// Presets + a drawer-backed control surface for live Kanban configuration.
// Package: hs-uix/kanban
//
// The "Customize" button is registered into the shared DemoDetail header slot
// (see useCustomizePanel in ./playground.jsx) so it sits alongside View code /
// Copy code. The demo body is just the live Kanban.

import { PanelSection, Select, ToggleGroup } from "@hubspot/ui-extensions";
import { Kanban, KanbanCardActions } from "hs-uix/kanban";
import { useCustomizePanel } from "./playground.jsx";

const [controls, setControls] = useState(createKanbanPlaygroundState("lead-compact"));

useCustomizePanel({
  id: "kanban-playground-controls",
  title: "Customize kanban",
  onReset: () => applyPreset(controls.presetId),
  body: (
    <>
      <PanelSection>
        <Select label="Preset" value={controls.presetId} options={KANBAN_PRESET_OPTIONS} onChange={applyPreset} />
      </PanelSection>
      <PanelSection>
        <Select label="Density" value={controls.cardDensity} options={DENSITY_OPTIONS} onChange={(v) => updateControls("cardDensity", v)} />
        <ToggleGroup toggleType="checkboxList" label="Dividers" value={controls.dividers} options={DIVIDER_OPTIONS} onChange={handleDividerChange} />
      </PanelSection>
      <PanelSection>
        <ToggleGroup toggleType="checkboxList" label="Features" value={controls.features} options={FEATURE_OPTIONS} onChange={handleFeatureChange} />
      </PanelSection>
    </>
  ),
}, [controls, applyPreset, updateControls, handleDividerChange, handleFeatureChange]);

<Kanban {...buildKanbanProps(controls, data, meta, collapsedStages, ...)} />`,
  },
  {
    id: "kanban-stage-transitions",
    name: "Stage transitions & guards",
    description: "canEnter blocks invalid moves, onEnterRequired shows a confirm prompt before a stage, and terminal stages block outbound moves.",
    package: "kanban",
    Component: StageTransitionsDemo,
    githubUrl: KN_GITHUB,
    sourceCode: `import { Kanban } from "hs-uix/kanban";

const stages = [
  { value: "new", label: "New" },
  { value: "qualified", label: "Qualified", canEnter: (row) => row.amount >= 20000 },
  {
    value: "won", label: "Won",
    onEnterRequired: {
      render: ({ row, onConfirm, onCancel }) => (
        <Flex direction="column" gap="sm">
          <Text>Mark {row.name} as Won?</Text>
          <Flex gap="sm">
            <Button variant="primary" onClick={() => onConfirm()}>Confirm</Button>
            <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          </Flex>
        </Flex>
      ),
    },
  },
  { value: "lost", label: "Lost", terminal: true },
];

<Kanban data={data} groupBy="stage" stages={stages} stageControl="select"
  onStageChange={(row, newStage) => move(row, newStage)} />`,
  },
  {
    id: "kanban-metrics-collapsed",
    name: "Metrics panel & collapsed stages",
    description: "A Statistics metrics panel toggled from the toolbar, plus controlled collapsedStages that rail a column.",
    package: "kanban",
    Component: MetricsCollapsedDemo,
    githubUrl: KN_GITHUB,
    sourceCode: `import { Kanban } from "hs-uix/kanban";

<Kanban
  data={data}
  groupBy="stage"
  stages={stages}
  metrics={[
    { id: "open", label: "Open deals", number: 4 },
    { id: "pipeline", label: "Pipeline", number: "$884k",
      trend: { direction: "increase", value: "12%", color: "green" } },
    { id: "won", label: "Won", number: "$450k" },
  ]}
  showMetrics
  collapsedStages={collapsed}
  onCollapsedStagesChange={setCollapsed}
/>`,
  },
  {
    id: "kanban-load-more",
    name: "Load more & per-stage errors",
    description: "Per-stage stageMeta drives hasMore/loading/error footers; onLoadMore handles both 'load more' and error retry.",
    package: "kanban",
    Component: LoadMoreDemo,
    githubUrl: KN_GITHUB,
    sourceCode: `import { Kanban } from "hs-uix/kanban";

const [meta, setMeta] = useState({
  new: { hasMore: true, totalCount: 12 },
  qualified: { hasMore: true, totalCount: 8, error: "Couldn't reach the server" },
  won: { hasMore: false },
});

<Kanban
  data={data}
  groupBy="stage"
  stages={stages}
  stageMeta={meta}
  onLoadMore={(stage) => {
    appendRows(stage);
    setMeta((prev) => ({ ...prev, [stage]: { ...prev[stage], error: undefined, hasMore: false } }));
  }}
/>`,
  },
];
