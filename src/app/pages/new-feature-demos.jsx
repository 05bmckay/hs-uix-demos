import React, { useMemo, useState } from "react";
import {
  Alert,
  Button,
  Divider,
  Flex,
  Input,
  Select,
  StatusTag,
  Tag,
  Text,
  Tile,
  ToggleGroup,
} from "@hubspot/ui-extensions";
import * as HsUix from "hs-uix";
import * as Common from "hs-uix/common-components";
import * as Experimental from "hs-uix/experimental";
import * as FormPackage from "hs-uix/form";
import * as KanbanPackage from "hs-uix/kanban";
import * as FeedPackage from "hs-uix/feed";
import * as CalendarPackage from "hs-uix/calendar";
import * as Safe from "hs-uix/safe";
import {
  CATEGORY_OPTIONS,
  GITHUB_BASE_URL,
  SAMPLE_DATA,
  STATUS_COLORS,
  STATUS_LABELS,
  STATUS_OPTIONS,
  formatCurrency,
} from "./data.jsx";

const ExperimentalDataTable = Experimental.DataTable || Experimental.ExperimentalDataTable;
const FormBuilder = FormPackage.FormBuilder;
const Kanban = KanbanPackage.Kanban;
const Feed = FeedPackage.Feed;
const Calendar = CalendarPackage.Calendar;
const Wizard = Experimental.Wizard;
const OnboardingChecklist = Experimental.OnboardingChecklist;
const FilterBuilder = HsUix.FilterBuilder;
const createGroup = HsUix.createGroup;
const createCondition = HsUix.createCondition;
// Skeleton moved to hs-uix/experimental in 2.2; fall back for older builds.
const Skeleton = Experimental.Skeleton || Common.Skeleton;
const SkeletonText = Experimental.SkeletonText || Common.SkeletonText;
const SkeletonBox = Experimental.SkeletonBox || Common.SkeletonBox;
const SkeletonCircle = Experimental.SkeletonCircle || Common.SkeletonCircle;
const SkeletonTable = Experimental.SkeletonTable || Common.SkeletonTable;
const DateRangePicker = Common.DateRangePicker;
const CrmRecordPicker = Common.CrmRecordPicker;
const fieldsFromHubSpotProperties = FormPackage.fieldsFromHubSpotProperties;

const NEW_FEATURE_DOCS = `${GITHUB_BASE_URL}/new-features`;

const MissingFeature = ({ name, branch }) => (
  <Alert variant="warning" title={`${name} is not available in the linked hs-uix build`}>
    Link or install the feature branch package first: {branch}
  </Alert>
);

const JsonTile = ({ title, value }) => (
  <Tile>
    <Flex direction="column" gap="flush">
      <Text format={{ fontWeight: "demibold" }}>{title}</Text>
      <Text>{JSON.stringify(value, null, 2)}</Text>
    </Flex>
  </Tile>
);

const FilterBuilderDemo = () => {
  const initialTree = useMemo(() => {
    if (!createGroup || !createCondition) return null;
    return createGroup("AND", [
      createCondition("lifecyclestage", "IN", ["customer", "opportunity"]),
      createGroup("OR", [
        createCondition("amount", "GTE", 50000),
        createCondition("renewal_date", "BETWEEN", { year: 2026, month: 0, date: 1 }, { year: 2026, month: 5, date: 30 }),
      ]),
    ]);
  }, []);
  const [tree, setTree] = useState(initialTree);

  if (!FilterBuilder || !initialTree) {
    return <MissingFeature name="FilterBuilder" branch="feat/filter-builder" />;
  }

  return (
    <Flex direction="column" gap="md">
      <FilterBuilder
        properties={[
          {
            name: "lifecyclestage",
            label: "Lifecycle stage",
            type: "enum",
            options: [
              { label: "Customer", value: "customer" },
              { label: "Opportunity", value: "opportunity" },
              { label: "Lead", value: "lead" },
            ],
          },
          { name: "amount", label: "Amount", type: "number" },
          { name: "renewal_date", label: "Renewal date", type: "date" },
          { name: "domain", label: "Domain", type: "string" },
          { name: "is_active", label: "Active customer", type: "bool" },
        ]}
        value={tree}
        onChange={setTree}
        maxDepth={3}
        namePrefix="new-filter-demo"
      />
      <JsonTile title="Filter tree" value={tree} />
    </Flex>
  );
};

const WizardDemo = () => {
  const [completed, setCompleted] = useState(false);

  if (!Wizard || !OnboardingChecklist) {
    return <MissingFeature name="Wizard and OnboardingChecklist" branch="feat/wizard" />;
  }

  return (
    <Flex direction="column" gap="md">
      <Wizard
        defaultValues={{ company: "Acme Corp", plan: "pro" }}
        orientation="vertical"
        onComplete={() => setCompleted(true)}
        steps={[
          {
            id: "account",
            title: "Account",
            description: "Capture the record to configure.",
            render: ({ values, setValues }) => (
              <Input
                name="wizard-company"
                label="Company"
                value={values.company || ""}
                onChange={(company) => setValues({ company })}
              />
            ),
            validate: ({ values }) => (values.company ? true : "Company is required"),
          },
          {
            id: "plan",
            title: "Plan",
            render: ({ values, setValues }) => (
              <Select
                name="wizard-plan"
                label="Plan"
                value={values.plan}
                onChange={(plan) => setValues({ plan })}
                options={[
                  { label: "Starter", value: "starter" },
                  { label: "Pro", value: "pro" },
                  { label: "Enterprise", value: "enterprise" },
                ]}
              />
            ),
          },
          {
            id: "review",
            title: "Review",
            optional: true,
            render: ({ values }) => (
              <JsonTile title="Shared wizard values" value={values} />
            ),
          },
        ]}
      />
      <OnboardingChecklist
        title="Launch checklist"
        progress
        items={[
          { id: "account", title: "Account selected", done: true },
          { id: "plan", title: "Plan reviewed", done: completed },
          {
            id: "activate",
            title: "Activate workflow",
            done: false,
            action: { label: "Open setup", variant: "secondary" },
          },
        ]}
      />
    </Flex>
  );
};

const LoadingPrimitivesDemo = () => {
  const [autoLoading, setAutoLoading] = useState(true);
  if (!SkeletonText || !SkeletonBox || !SkeletonCircle || !SkeletonTable) {
    return <MissingFeature name="Skeleton primitives" branch="feat/skeleton" />;
  }

  const autoColumns = [
    { field: "name", label: "Company" },
    { field: "status", label: "Status" },
    { field: "amount", label: "Amount", render: formatCurrency },
  ];

  return (
    <Flex direction="column" gap="md">
      {Skeleton ? (
        <Tile>
          <Flex direction="column" gap="sm">
            <Flex direction="row" gap="md" align="center">
              <Text format={{ fontWeight: "demibold" }}>Auto wrapper mode</Text>
              <Button size="extra-small" variant="secondary" onClick={() => setAutoLoading((v) => !v)}>
                {autoLoading ? "Finish loading" : "Load again"}
              </Button>
            </Flex>
            <Text variant="microcopy">
              Wrap any surface and pass loading — the placeholder is inferred from the child component and its props.
            </Text>
            <Skeleton loading={autoLoading}>
              <HsUix.DataTable data={SAMPLE_DATA.slice(0, 4)} columns={autoColumns} pageSize={4} />
            </Skeleton>
          </Flex>
        </Tile>
      ) : null}
      <Tile>
        <Flex direction="row" gap="md" align="center">
          <SkeletonCircle size={48} />
          <Flex direction="column" gap="xs">
            <SkeletonText width="md" lines={3} />
            <SkeletonBox width="sm" height={28} radius={6} />
          </Flex>
        </Flex>
      </Tile>
      <Tile>
        <SkeletonTable rows={4} columns={4} width="lg" />
      </Tile>
    </Flex>
  );
};

const PickerPrimitivesDemo = () => {
  const [range, setRange] = useState({
    operator: "InRollingDateRange",
    preset: "today",
  });
  const [recordIds, setRecordIds] = useState(["1001"]);

  return (
    <Flex direction="column" gap="md">
      {!DateRangePicker ? (
        <MissingFeature name="DateRangePicker" branch="feat/date-range-picker" />
      ) : (
        <Tile>
          <DateRangePicker
            label="Target close window"
            name="target-close-window"
            value={range}
            onChange={setRange}
            presets
            clearable
          />
        </Tile>
      )}
      {!CrmRecordPicker ? (
        <MissingFeature name="CrmRecordPicker" branch="feat/crm-record-picker" />
      ) : (
        <Tile>
          <CrmRecordPicker
            objectType="companies"
            label="Associated companies"
            placeholder="Search companies"
            properties={["name", "domain", "industry"]}
            labelField="properties.name"
            descriptionField="properties.domain"
            value={recordIds}
            onChange={(ids) => setRecordIds(Array.isArray(ids) ? ids : ids == null ? [] : [ids])}
            multi
            max={3}
            allowCreate={{
              label: (term) => `Create "${term}"`,
              onCreate: (term) => ({
                objectId: `new-${Date.now()}`,
                properties: { name: term, domain: `${term.toLowerCase().replace(/\s+/g, "")}.example.com` },
              }),
            }}
          />
        </Tile>
      )}
      <JsonTile title="Picker state" value={{ range, recordIds }} />
    </Flex>
  );
};

const RowExpansionDemo = () => {
  const [expanded, setExpanded] = useState([1]);
  const columns = [
    { field: "name", label: "Company", sortable: true },
    {
      field: "status",
      label: "Status",
      render: (value) => <StatusTag variant={STATUS_COLORS[value] || "default"}>{STATUS_LABELS[value] || value}</StatusTag>,
    },
    { field: "amount", label: "Amount", align: "right", render: formatCurrency },
  ];

  return (
    <Flex direction="column" gap="sm">
      <ExperimentalDataTable
        data={SAMPLE_DATA.slice(0, 6)}
        columns={columns}
        rowIdField="id"
        expandedRowIds={expanded}
        onExpandedRowsChange={setExpanded}
        expandSingle
        renderExpandedRow={(row) => (
          <Flex direction="column" gap="xs">
            <Text format={{ fontWeight: "demibold" }}>{row.contact}</Text>
            <Text>{row.notes || "No account notes yet."}</Text>
            <Flex direction="row" gap="xs">
              <Tag>{row.email}</Tag>
              <Tag>{row.category}</Tag>
            </Flex>
          </Flex>
        )}
      />
      <Text variant="microcopy">Expanded row ids: {expanded.join(", ") || "none"}</Text>
    </Flex>
  );
};

const FormPropertiesDemo = () => {
  const generatedFields = fieldsFromHubSpotProperties
    ? fieldsFromHubSpotProperties([
        {
          name: "dealname",
          label: "Deal name",
          type: "string",
          fieldType: "text",
          required: true,
        },
        {
          name: "dealstage",
          label: "Deal stage",
          type: "enumeration",
          fieldType: "select",
          options: [
            { label: "Discovery", value: "discovery" },
            { label: "Proposal", value: "proposal" },
            { label: "Closed won", value: "closedwon" },
          ],
        },
        {
          name: "amount",
          label: "Amount",
          type: "number",
          fieldType: "number",
        },
      ])
    : [
        { name: "dealname", label: "Deal name", type: "text", required: true },
        { name: "dealstage", label: "Deal stage", type: "select", options: STATUS_OPTIONS },
        { name: "amount", label: "Amount", type: "number" },
      ];

  return (
    <Flex direction="column" gap="md">
      {!fieldsFromHubSpotProperties && (
        <MissingFeature name="fieldsFromHubSpotProperties" branch="feat/form-enhancements" />
      )}
      <FormBuilder
        fields={generatedFields}
        initialValues={{ dealname: "Expansion opportunity", dealstage: "proposal", amount: 85000 }}
        submitLabel="Save deal"
        onSubmit={() => {}}
      />
    </Flex>
  );
};

const KanbanWipSwimlanesDemo = () => {
  const [collapsedLanes, setCollapsedLanes] = useState(["mid-market"]);
  const stages = [
    { value: "active", label: "Active", variant: "success", wipLimit: 3 },
    { value: "at-risk", label: "At Risk", variant: "warning", wipLimit: 2 },
    { value: "churned", label: "Churned", terminal: true },
  ];

  return (
    <Flex direction="column" gap="md">
      <ToggleGroup
        name="collapsed-lanes"
        toggleType="checkboxList"
        value={collapsedLanes}
        onChange={setCollapsedLanes}
        options={CATEGORY_OPTIONS}
      />
      <Kanban
        data={SAMPLE_DATA}
        stages={stages}
        groupBy="status"
        rowIdField="id"
        cardDensity="compact"
        cardFields={[
          { field: "name", placement: "title" },
          { field: "contact", label: "Contact", placement: "subtitle" },
          { field: "amount", label: "Amount", placement: "body", render: formatCurrency },
        ]}
        swimlaneBy="category"
        swimlaneLabels={{
          enterprise: "Enterprise",
          "mid-market": "Mid-market",
          smb: "SMB",
        }}
        swimlaneOrder={["enterprise", "mid-market", "smb"]}
        collapsedLanes={collapsedLanes}
        onCollapsedLanesChange={setCollapsedLanes}
        wipLimits={{ active: 4, "at-risk": 1 }}
        labels={{ overWip: "Over WIP", wipCount: (count, limit) => `${count} / ${limit}` }}
      />
    </Flex>
  );
};

const FeedEnhancementsDemo = () => {
  const [items, setItems] = useState([
    {
      id: "call-1",
      type: "call",
      title: "Discovery call completed",
      actor: { name: "Jane Smith", initials: "JS" },
      timestamp: "2026-06-09T14:00:00Z",
      body: "Customer asked for rollout timing and pricing details.",
      outcome: "Completed",
    },
    {
      id: "email-1",
      type: "email",
      title: "Proposal sent",
      actor: { name: "Bob Johnson", initials: "BJ" },
      timestamp: "2026-06-08T18:30:00Z",
      body: "Sent implementation proposal with enterprise support add-on.",
      outcome: "Waiting",
    },
  ]);

  return (
    <Flex direction="column" gap="sm">
      <Button
        variant="secondary"
        onClick={() =>
          setItems((current) => [
            {
              id: `note-${current.length + 1}`,
              type: "note",
              title: "New stakeholder note",
              actor: { name: "Morgan Lee", initials: "ML" },
              timestamp: new Date().toISOString(),
              body: "Procurement asked for an updated security review.",
              outcome: "New",
            },
            ...current,
          ])
        }
      >
        Add newest item
      </Button>
      <Feed
        items={items}
        title="Activity timeline"
        groupByDate
        collapsible="auto"
        showCollapseToggle
        newItemsBehavior="pill"
        typePresets={{
          call: { icon: "calling", color: "success", label: "Call", statusVariant: "success" },
          email: { icon: "email", color: "inherit", label: "Email", statusVariant: "info" },
          note: { icon: "notes", color: "warning", label: "Note", statusVariant: "warning" },
        }}
        fields={[
          { field: "outcome", label: "Outcome", placement: "meta", type: "status" },
          { field: "body", placement: "body" },
        ]}
      />
    </Flex>
  );
};

const CalendarEnhancementsDemo = () => {
  const [timeZone, setTimeZone] = useState("America/Chicago");
  const events = [
    {
      id: 1,
      title: "Enterprise QBR",
      owner: "ae",
      start: "2026-06-10T15:00:00Z",
      end: "2026-06-10T16:00:00Z",
      color: "success",
    },
    {
      id: 2,
      title: "Renewal review",
      owner: "cs",
      start: "2026-06-11T17:00:00Z",
      end: "2026-06-11T18:30:00Z",
      color: "warning",
    },
    {
      id: 3,
      title: "Procurement follow-up",
      owner: null,
      start: "2026-06-12T19:00:00Z",
      end: "2026-06-12T19:30:00Z",
      color: "info",
    },
  ];

  return (
    <Flex direction="column" gap="sm">
      <Calendar
        events={events}
        defaultView="resource"
        views={["month", "week", "agenda", "resource"]}
        defaultFocusedDate="2026-06-10"
        eventFields={{
          id: "id",
          title: "title",
          start: "start",
          end: "end",
          color: "color",
        }}
        resources={[
          { id: "ae", label: "Account executive" },
          { id: "cs", label: "Customer success" },
        ]}
        resourceField="owner"
        showUnassignedLane
        timeZone={timeZone}
        onTimeZoneChange={setTimeZone}
        showTimeZoneSelect
        timeZoneOptions={[
          "America/Chicago",
          "America/New_York",
          "Europe/London",
          "UTC",
        ]}
        rescheduleOptions={[
          { label: "+1 day", shift: { days: 1 } },
          { label: "Next week", shift: { weeks: 1 } },
        ]}
      />
      <Text variant="microcopy">Active timezone: {timeZone}</Text>
    </Flex>
  );
};

const NEW_FEATURE_SOURCE = {
  safe: `import { SafeIcon, SafeEmptyState, SafeDataTable } from "hs-uix/safe";

<SafeIcon name="duplicate" />            // auto-repairs to "copy", warns once
<SafeEmptyState imageName="new-project"  // invalid -> falls back instead of throwing
  title="Nothing here yet" />
<SafeDataTable data={maybeUndefined}     // missing arrays -> [] (empty state, not a blank page)
  columns={columns} />`,
  filter: `import { FilterBuilder, createGroup, createCondition } from "hs-uix";

<FilterBuilder properties={properties} value={tree} onChange={setTree} maxDepth={3} />`,
  wizard: `import { Wizard, OnboardingChecklist } from "hs-uix/experimental";

<Wizard steps={[{ id: "account", title: "Account", validate, render }]} />
<OnboardingChecklist title="Launch checklist" progress items={items} />`,
  loading: `import { SkeletonText, SkeletonBox, SkeletonCircle, SkeletonTable } from "hs-uix/common-components";

<SkeletonText width="md" lines={3} />
<SkeletonTable rows={4} columns={4} />`,
  pickers: `import { DateRangePicker, CrmRecordPicker } from "hs-uix/common-components";

<DateRangePicker
  value={{ operator: "InRollingDateRange", preset: "today" }}
  onChange={setRange}
  presets
  clearable
/>
<CrmRecordPicker objectType="companies" value={ids} onChange={setIds} multi />`,
  rowExpansion: `import { DataTable } from "hs-uix/experimental";

<DataTable
  data={rows}
  columns={columns}
  renderExpandedRow={(row) => <DealDetails row={row} />}
  expandedRowIds={expanded}
  onExpandedRowsChange={setExpanded}
  expandSingle
/>`,
  formProperties: `import { FormBuilder, fieldsFromHubSpotProperties } from "hs-uix/form";

const fields = fieldsFromHubSpotProperties(properties);
<FormBuilder fields={fields} initialValues={values} onSubmit={save} />`,
  kanban: `import { Kanban } from "hs-uix/kanban";

<Kanban
  data={rows}
  stages={stages}
  swimlaneBy="category"
  wipLimits={{ active: 4, "at-risk": 1 }}
/>`,
  feed: `import { Feed } from "hs-uix/feed";

<Feed
  items={items}
  groupByDate
  collapsible="auto"
  newItemsBehavior="pill"
  typePresets={typePresets}
/>`,
  calendar: `import { Calendar } from "hs-uix/calendar";

<Calendar
  events={events}
  defaultView="resource"
  resources={resources}
  resourceField="owner"
  showTimeZoneSelect
  rescheduleOptions
/>`,
};

const SafeWrappersDemo = () => {
  if (!Safe.SafeIcon || !Safe.SafeEmptyState || !Safe.SafeDataTable) {
    return <MissingFeature name="hs-uix/safe wrappers" branch="feat/safe-wrappers" />;
  }
  const { SafeIcon, SafeEmptyState, SafeDataTable } = Safe;
  return (
    <Flex direction="column" gap="md">
      <Tile>
        <Flex direction="column" gap="sm">
          <Text format={{ fontWeight: "demibold" }}>SafeIcon — alias repair + visible placeholder</Text>
          <Flex direction="row" gap="lg" align="center">
            <Flex direction="row" gap="xs" align="center">
              <SafeIcon name="duplicate" />
              <Text variant="microcopy">name="duplicate" → repaired to "copy"</Text>
            </Flex>
            <Flex direction="row" gap="xs" align="center">
              <SafeIcon name="not-a-real-icon" />
              <Text variant="microcopy">unknown name → alert xCircle (native renders nothing)</Text>
            </Flex>
          </Flex>
        </Flex>
      </Tile>
      <Tile>
        <Flex direction="column" gap="sm">
          <Text format={{ fontWeight: "demibold" }}>SafeEmptyState — bad imageName degrades instead of throwing</Text>
          <SafeEmptyState title="Nothing here yet" imageName="new-project">
            <Text>imageName="new-project" is invalid — the native EmptyState throws; the safe one falls back.</Text>
          </SafeEmptyState>
        </Flex>
      </Tile>
      <Tile>
        <Flex direction="column" gap="sm">
          <Text format={{ fontWeight: "demibold" }}>SafeDataTable — undefined data renders an empty table, not a blank page</Text>
          <SafeDataTable
            data={undefined}
            columns={[
              { field: "name", label: "Company" },
              { field: "amount", label: "Amount" },
            ]}
          />
        </Flex>
      </Tile>
    </Flex>
  );
};

export const NEW_FEATURE_DEMOS = [
  {
    id: "new-safe-wrappers",
    name: "Safe wrappers",
    description: "Hardened drop-ins: icon alias repair, EmptyState fallback, and array coercion that keeps pages alive.",
    package: "new",
    Component: SafeWrappersDemo,
    githubUrl: NEW_FEATURE_DOCS,
    sourceCode: NEW_FEATURE_SOURCE.safe,
  },
  {
    id: "new-filter-builder",
    name: "FilterBuilder",
    description: "Nested AND/OR filter trees with typed operators and controlled state output.",
    package: "new",
    Component: FilterBuilderDemo,
    githubUrl: NEW_FEATURE_DOCS,
    sourceCode: NEW_FEATURE_SOURCE.filter,
  },
  {
    id: "new-wizard-checklist",
    name: "Wizard + checklist",
    description: "A gated multi-step flow plus a progress checklist for onboarding-style work.",
    package: "new",
    Component: WizardDemo,
    githubUrl: NEW_FEATURE_DOCS,
    sourceCode: NEW_FEATURE_SOURCE.wizard,
  },
  {
    id: "new-loading-primitives",
    name: "Skeleton loading states",
    description: "Text, box, circle, and table placeholders rendered with the new skeleton helpers.",
    package: "new",
    Component: LoadingPrimitivesDemo,
    githubUrl: NEW_FEATURE_DOCS,
    sourceCode: NEW_FEATURE_SOURCE.loading,
  },
  {
    id: "new-picker-primitives",
    name: "Date range + CRM record pickers",
    description: "Reusable date range and CRM record selection primitives with controlled state.",
    package: "new",
    Component: PickerPrimitivesDemo,
    githubUrl: NEW_FEATURE_DOCS,
    sourceCode: NEW_FEATURE_SOURCE.pickers,
  },
  {
    id: "new-datatable-row-expansion",
    name: "DataTable row expansion",
    description: "Full-width detail rows with controlled expansion state and accordion behavior.",
    package: "new",
    Component: RowExpansionDemo,
    githubUrl: NEW_FEATURE_DOCS,
    sourceCode: NEW_FEATURE_SOURCE.rowExpansion,
  },
  {
    id: "new-form-property-fields",
    name: "FormBuilder from CRM properties",
    description: "Convert HubSpot property metadata into FormBuilder field configs.",
    package: "new",
    Component: FormPropertiesDemo,
    githubUrl: NEW_FEATURE_DOCS,
    sourceCode: NEW_FEATURE_SOURCE.formProperties,
  },
  {
    id: "new-kanban-wip-swimlanes",
    name: "Kanban WIP + swimlanes",
    description: "Stage WIP limits, over-limit labels, and collapsible swimlane grouping.",
    package: "new",
    Component: KanbanWipSwimlanesDemo,
    githubUrl: NEW_FEATURE_DOCS,
    sourceCode: NEW_FEATURE_SOURCE.kanban,
  },
  {
    id: "new-feed-enhancements",
    name: "Feed live and type presets",
    description: "Activity type presets, collapsible groups, and new-item pill behavior.",
    package: "new",
    Component: FeedEnhancementsDemo,
    githubUrl: NEW_FEATURE_DOCS,
    sourceCode: NEW_FEATURE_SOURCE.feed,
  },
  {
    id: "new-calendar-enhancements",
    name: "Calendar resources + rescheduling",
    description: "Resource lanes, timezone selection, and reschedule affordances.",
    package: "new",
    Component: CalendarEnhancementsDemo,
    githubUrl: NEW_FEATURE_DOCS,
    sourceCode: NEW_FEATURE_SOURCE.calendar,
  },
];
