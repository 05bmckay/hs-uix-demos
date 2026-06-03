import React, { useState } from "react";
import { Flex, Text } from "@hubspot/ui-extensions";
import {
  AutoStatusTag,
  CrmDataTable,
  CrmKanban,
  CrmLookupSelect,
} from "hs-uix";

// ═══════════════════════════════════════════════════════════════════════════
// CRM Search demos
//
// LIVE examples — they call HubSpot's `useCrmSearch` and need a connected portal
// with CRM read scopes. Each card pairs one hs-uix CRM adapter with a different
// surface (table / board / lookup). If a card shows a permissions error,
// reinstall the local app after the CRM read scopes are uploaded.
//
// All three follow the same data model: fetch ONE batch and do search / sort /
// filter / pagination in-memory. When a result set is larger than the batch the
// table/board auto-refetches search/filter/sort server-side (pagination stays
// client-side) and shows a "first N of M" note — so they scale without relying
// on per-row cursor pagination.
// ═══════════════════════════════════════════════════════════════════════════

const GITHUB = "https://github.com/05bmckay/hs-uix/tree/main/examples/crm-search";

const CONTACT_PROPERTIES = ["firstname", "lastname", "email", "createdate", "lifecyclestage"];
const DEAL_PROPERTIES = ["dealname", "amount", "dealstage", "closedate"];
const COMPANY_PROPERTIES = ["name", "domain", "industry"];

// ───────────────────────────────────────────────────────────────────────────
// 1. CrmDataTable — contacts
// ───────────────────────────────────────────────────────────────────────────

// CRM lifecycle stages come back as raw internal values (e.g. "marketingqualifiedlead").
// Map them to friendly labels + status-tag variants so they don't render grey + lowercase.
const LIFECYCLE_STAGES = {
  subscriber: { label: "Subscriber", variant: "default" },
  lead: { label: "Lead", variant: "info" },
  marketingqualifiedlead: { label: "Marketing Qualified Lead", variant: "info" },
  salesqualifiedlead: { label: "Sales Qualified Lead", variant: "warning" },
  opportunity: { label: "Opportunity", variant: "warning" },
  customer: { label: "Customer", variant: "success" },
  evangelist: { label: "Evangelist", variant: "success" },
  other: { label: "Other", variant: "default" },
};
const LIFECYCLE_ORDER = Object.keys(LIFECYCLE_STAGES);

const renderLifecycleStage = (value) => {
  const stage = LIFECYCLE_STAGES[String(value ?? "").toLowerCase()];
  return <AutoStatusTag variant={stage?.variant || "default"}>{stage?.label || value || "—"}</AutoStatusTag>;
};

const contactColumns = [
  {
    field: "name",
    label: "Name",
    sortable: true,
    renderCell: (_value, row) => `${row.firstname || ""} ${row.lastname || ""}`.trim() || "—",
  },
  { field: "email", label: "Email", sortable: true },
  {
    field: "lifecyclestage",
    label: "Lifecycle stage",
    sortable: true,
    sortOrder: LIFECYCLE_ORDER, // sort by funnel order, not alphabetically
    renderCell: renderLifecycleStage,
  },
  { field: "createdate", label: "Created", sortable: true },
];

const CrmContactTableDemo = () => (
  <Flex direction="column" gap="sm">
    <Text>
      The short-path API: CRM search + loading + normalization + search/sort/filter wiring in one
      component. It fetches a batch and works in-memory; if a portal has more contacts than one batch,
      search/sort/filter refetch server-side and a "first N of M" note appears.
    </Text>
    <CrmDataTable
      title="CRM contacts"
      objectType="contacts"
      properties={CONTACT_PROPERTIES}
      columns={contactColumns}
      autoFilters={["lifecyclestage"]}
      searchFields={["firstname", "lastname", "email"]}
      searchPlaceholder="Search CRM contacts..."
      mapRecord={(record) => ({
        objectId: record.objectId,
        firstname: record.properties.firstname,
        lastname: record.properties.lastname,
        name: `${record.properties.firstname || ""} ${record.properties.lastname || ""}`.trim(),
        email: record.properties.email,
        lifecyclestage: record.properties.lifecyclestage,
        createdate: record.properties.createdate,
      })}
    />
  </Flex>
);

// ───────────────────────────────────────────────────────────────────────────
// 2. CrmKanban — deals on a board (the Kanban analog of CrmDataTable)
// ───────────────────────────────────────────────────────────────────────────

// The default HubSpot deal pipeline — passing `stages` gives real labels and
// funnel order (instead of the raw "appointmentscheduled" values that auto-derive
// would surface). Swap these for your own pipeline's stage IDs/labels.
const DEAL_STAGES = [
  { value: "appointmentscheduled", label: "Appointment Scheduled" },
  { value: "qualifiedtobuy", label: "Qualified to Buy" },
  { value: "presentationscheduled", label: "Presentation Scheduled" },
  { value: "decisionmakerboughtin", label: "Decision Maker Bought-In" },
  { value: "contractsent", label: "Contract Sent" },
  { value: "closedwon", label: "Closed Won", variant: "success" },
  { value: "closedlost", label: "Closed Lost", variant: "warning" },
];

const CrmDealKanbanDemo = () => (
  <Flex direction="column" gap="sm">
    <Text>
      CrmKanban is the board analog of CrmDataTable — fetch one batch, then group / search / filter /
      sort client-side. Here we pass the default deal pipeline as `stages` for real labels and funnel
      order; omit it to auto-derive stages from the deals in the batch.
    </Text>
    <CrmKanban
      title="CRM deals"
      objectType="deals"
      properties={DEAL_PROPERTIES}
      groupBy="dealstage"
      stages={DEAL_STAGES}
      searchFields={["dealname"]}
      searchPlaceholder="Search CRM deals..."
      cardFields={[
        { field: "dealname", label: "Deal", placement: "title" },
        { field: "amount", label: "Amount", placement: "meta" },
        { field: "closedate", label: "Close date", placement: "body" },
      ]}
    />
  </Flex>
);

// ───────────────────────────────────────────────────────────────────────────
// 3. CrmLookupSelect — the all-in-one lookup component
// ───────────────────────────────────────────────────────────────────────────

const CrmCompanyLookupDemo = () => {
  const [values, setValues] = useState({ companyId: "" });

  return (
    <Flex direction="column" gap="sm">
      <Text>
        The all-in-one CrmLookupSelect — debounced CRM search, option updates, and selection persistence
        are built in. A picked company stays valid even after the search results change, and the field
        shows a "Searching…" state while a query is in flight. Capped at 5 results per search.
      </Text>
      <CrmLookupSelect
        name="companyLookup"
        label="Lookup company"
        objectType="companies"
        properties={COMPANY_PROPERTIES}
        value={values.companyId}
        onChange={(companyId) => setValues((prev) => ({ ...prev, companyId }))}
        placeholder="Type to search CRM companies..."
        description="Debounced CRM search with built-in option updates."
        labelProperty="name"
        valueProperty="objectId"
        descriptionProperty="domain"
        pageLength={5}
        loadingOption={{ label: "Searching…", value: "__loading" }}
        noResultsOption={{ label: "No companies match", value: "__none" }}
      />
    </Flex>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Demo registry entries
// ═══════════════════════════════════════════════════════════════════════════

export const CRM_SEARCH_DEMOS = [
  {
    id: "crm-contact-table",
    name: "CRM Contacts Table",
    description: "CrmDataTable over live contacts — one batch, in-memory search/sort/filter/pagination, auto server-side refetch for large sets.",
    package: "crm-search",
    Component: CrmContactTableDemo,
    githubUrl: GITHUB,
    sourceCode: `// Requires a connected portal with CRM read scopes.
// CrmDataTable fetches one batch (pageLength, default 100) and handles
// search / sort / filter / pagination client-side. If the result set exceeds the
// batch, search/sort/filter auto-refetch server-side and a "first N of M" note
// appears. Lifecycle stages get friendly labels + funnel-ordered sorting.
import { CrmDataTable, AutoStatusTag } from "hs-uix";

const LIFECYCLE = { lead: { label: "Lead", variant: "info" }, customer: { label: "Customer", variant: "success" } /* ... */ };

const columns = [
  { field: "name", label: "Name", sortable: true,
    renderCell: (_v, row) => \`\${row.firstname} \${row.lastname}\`.trim() },
  { field: "email", label: "Email", sortable: true },
  { field: "lifecyclestage", label: "Lifecycle stage", sortable: true, sortOrder: Object.keys(LIFECYCLE),
    renderCell: (v) => <AutoStatusTag variant={LIFECYCLE[v]?.variant}>{LIFECYCLE[v]?.label || v}</AutoStatusTag> },
];

<CrmDataTable
  objectType="contacts"
  properties={["firstname", "lastname", "email", "createdate", "lifecyclestage"]}
  columns={columns}
  autoFilters={["lifecyclestage"]}
  searchFields={["firstname", "lastname", "email"]}
/>`,
  },
  {
    id: "crm-deal-kanban",
    name: "CRM Deals Kanban",
    description: "CrmKanban — the board analog of CrmDataTable. One batch, client-side grouping, with the deal pipeline passed as stages.",
    package: "crm-search",
    Component: CrmDealKanbanDemo,
    githubUrl: GITHUB,
    sourceCode: `// Requires a connected portal with CRM read scopes.
// CrmKanban mirrors CrmDataTable: fetch one batch, then group / search /
// filter / sort client-side. Pass \`stages\` for real pipeline labels + order
// (or omit to auto-derive stages from the deals in the batch).
import { CrmKanban } from "hs-uix";

const DEAL_STAGES = [
  { value: "appointmentscheduled", label: "Appointment Scheduled" },
  { value: "qualifiedtobuy", label: "Qualified to Buy" },
  { value: "presentationscheduled", label: "Presentation Scheduled" },
  { value: "decisionmakerboughtin", label: "Decision Maker Bought-In" },
  { value: "contractsent", label: "Contract Sent" },
  { value: "closedwon", label: "Closed Won", variant: "success" },
  { value: "closedlost", label: "Closed Lost", variant: "warning" },
];

<CrmKanban
  title="CRM deals"
  objectType="deals"
  properties={["dealname", "amount", "dealstage", "closedate"]}
  groupBy="dealstage"
  stages={DEAL_STAGES}
  searchFields={["dealname"]}
  cardFields={[
    { field: "dealname", label: "Deal", placement: "title" },
    { field: "amount", label: "Amount", placement: "meta" },
    { field: "closedate", label: "Close date", placement: "body" },
  ]}
/>`,
  },
  {
    id: "crm-company-lookup",
    name: "CRM Company Lookup",
    description: "The all-in-one CrmLookupSelect — debounced CRM search, selection persistence, and a Searching… state, built in.",
    package: "crm-search",
    Component: CrmCompanyLookupDemo,
    githubUrl: GITHUB,
    sourceCode: `// Requires a connected portal with CRM read scopes.
// Debounced CRM search, option updates, and selection persistence are built in:
// a picked option stays valid after results change, and a "Searching…" option
// shows while a query is in flight.
import { CrmLookupSelect } from "hs-uix";

<CrmLookupSelect
  name="companyLookup"
  label="Lookup company"
  objectType="companies"
  properties={["name", "domain", "industry"]}
  value={values.companyId}
  onChange={(companyId) => setValues((p) => ({ ...p, companyId }))}
  labelProperty="name"
  valueProperty="objectId"
  descriptionProperty="domain"
  pageLength={5}
  loadingOption={{ label: "Searching…", value: "__loading" }}
  noResultsOption={{ label: "No companies match", value: "__none" }}
/>`,
  },
];
