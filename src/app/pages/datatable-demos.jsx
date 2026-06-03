import React, { useState, useCallback, useMemo } from "react";
import {
  Button,
  Flex,
  MultiSelect,
  NumberInput,
  Panel,
  PanelBody,
  PanelFooter,
  PanelSection,
  Select,
  StatusTag,
  Tag,
  Text,
  ToggleGroup,
} from "@hubspot/ui-extensions";
import { DataTable } from "hs-uix";
import { useDemoHeaderSlot } from "./demoHeader.jsx";
import {
  SAMPLE_DATA,
  STATUS_COLORS,
  STATUS_LABELS,
  STATUS_OPTIONS,
  CATEGORY_OPTIONS,
  formatCurrency,
  formatTime,
  formatDateTime,
} from "./data.jsx";

// ═══════════════════════════════════════════════════════════════════════════
// Interactive DataTable Playground
// ═══════════════════════════════════════════════════════════════════════════

const PLAYGROUND_PRESETS = {
  overview: {
    label: "Overview",
    description: "Search, filters, sorting, footer totals, and a clean starter column set.",
    columnFields: ["name", "contact", "status", "category", "amount", "date"],
    search: true,
    fuzzySearch: true,
    filters: true,
    selectable: false,
    rowActions: false,
    grouping: false,
    scrollable: false,
    footer: true,
    columnDescriptions: true,
    editing: "none",
    pageSize: 5,
    filterInlineLimit: 2,
    sortField: "amount",
    sortDirection: "descending",
    recordLabelStyle: "companies",
    showRowCount: true,
    rowCountBold: false,
    showFilterBadges: true,
    showClearFiltersButton: true,
    showButtonLabels: true,
    showFirstLastButtons: false,
    bordered: true,
    autoWidth: true,
    hideRowActionsWhenSelectionActive: false,
    resetPageOnChange: true,
    categoryFilterType: "select",
    activeFilters: ["status", "category", "date"],
  },
  selection: {
    label: "Selection + Actions",
    description: "Checkbox selection, bulk actions, row actions, and a notes-heavy review workflow.",
    columnFields: ["name", "contact", "status", "amount", "notes"],
    search: true,
    fuzzySearch: false,
    filters: true,
    selectable: true,
    rowActions: true,
    grouping: false,
    scrollable: false,
    footer: false,
    columnDescriptions: true,
    editing: "none",
    pageSize: 5,
    filterInlineLimit: 2,
    sortField: "name",
    sortDirection: "ascending",
    recordLabelStyle: "companies",
    showRowCount: true,
    rowCountBold: true,
    showFilterBadges: true,
    showClearFiltersButton: true,
    showButtonLabels: true,
    showFirstLastButtons: false,
    bordered: true,
    autoWidth: true,
    hideRowActionsWhenSelectionActive: true,
    resetPageOnChange: true,
    categoryFilterType: "select",
    activeFilters: ["status", "category", "date"],
  },
  editing: {
    label: "Row Editing",
    description: "Editable fields plus row-level edit controls for a hands-on workflow preview.",
    columnFields: ["name", "status", "amount", "meeting"],
    search: true,
    fuzzySearch: false,
    filters: false,
    selectable: false,
    rowActions: true,
    grouping: false,
    scrollable: false,
    footer: false,
    columnDescriptions: true,
    editing: "row",
    pageSize: 6,
    filterInlineLimit: 2,
    sortField: "amount",
    sortDirection: "descending",
    recordLabelStyle: "companies",
    showRowCount: true,
    rowCountBold: false,
    showFilterBadges: false,
    showClearFiltersButton: true,
    showButtonLabels: true,
    showFirstLastButtons: false,
    bordered: true,
    autoWidth: true,
    hideRowActionsWhenSelectionActive: false,
    resetPageOnChange: true,
    categoryFilterType: "select",
    activeFilters: ["status", "category", "date"],
  },
  grouping: {
    label: "Grouped Pipeline",
    description: "Groups rows by segment and shows aggregate values for pipeline review.",
    columnFields: ["name", "contact", "status", "category", "amount"],
    search: false,
    fuzzySearch: false,
    filters: false,
    selectable: false,
    rowActions: false,
    grouping: true,
    scrollable: false,
    footer: false,
    columnDescriptions: true,
    editing: "none",
    pageSize: 20,
    filterInlineLimit: 2,
    sortField: "amount",
    sortDirection: "descending",
    recordLabelStyle: "deals",
    showRowCount: true,
    rowCountBold: false,
    showFilterBadges: false,
    showClearFiltersButton: true,
    showButtonLabels: true,
    showFirstLastButtons: true,
    bordered: true,
    autoWidth: true,
    hideRowActionsWhenSelectionActive: false,
    resetPageOnChange: true,
    categoryFilterType: "multiselect",
    activeFilters: ["status", "category", "date"],
  },
  wide: {
    label: "Wide Table",
    description: "A denser, horizontally scrollable view for testing long table layouts.",
    columnFields: ["name", "contact", "status", "category", "amount", "date", "priority", "callTime", "notes"],
    search: true,
    fuzzySearch: false,
    filters: false,
    selectable: false,
    rowActions: false,
    grouping: false,
    scrollable: true,
    footer: false,
    columnDescriptions: true,
    editing: "none",
    pageSize: 6,
    filterInlineLimit: 3,
    sortField: "amount",
    sortDirection: "descending",
    recordLabelStyle: "companies",
    showRowCount: true,
    rowCountBold: false,
    showFilterBadges: false,
    showClearFiltersButton: true,
    showButtonLabels: true,
    showFirstLastButtons: true,
    bordered: true,
    autoWidth: false,
    hideRowActionsWhenSelectionActive: false,
    resetPageOnChange: true,
    categoryFilterType: "select",
    activeFilters: ["status", "category", "date"],
  },
};

const PLAYGROUND_PRESET_OPTIONS = Object.entries(PLAYGROUND_PRESETS).map(([value, preset]) => ({
  label: preset.label,
  value,
}));

const PLAYGROUND_EDIT_MODE_OPTIONS = [
  { label: "Off", value: "none" },
  { label: "Discrete inline", value: "discrete" },
  { label: "Always-visible inline", value: "inline" },
  { label: "Full-row actions", value: "row" },
];

const PLAYGROUND_COLUMN_OPTIONS = [
  { label: "Company", value: "name" },
  { label: "Contact", value: "contact" },
  { label: "Status", value: "status" },
  { label: "Segment", value: "category" },
  { label: "Amount", value: "amount" },
  { label: "Close date", value: "date" },
  { label: "Priority", value: "priority" },
  { label: "Call time", value: "callTime" },
  { label: "Meeting", value: "meeting" },
  { label: "Notes", value: "notes" },
];

const PLAYGROUND_FEATURE_OPTIONS = [
  { label: "Search", value: "search" },
  { label: "Fuzzy search", value: "fuzzySearch" },
  { label: "Filters", value: "filters" },
  { label: "Selection", value: "selectable" },
  { label: "Row actions", value: "rowActions" },
  { label: "Grouping", value: "grouping" },
  { label: "Scrollable width", value: "scrollable" },
  { label: "Footer totals", value: "footer" },
  { label: "Column descriptions", value: "columnDescriptions" },
];

const PLAYGROUND_PRESENTATION_OPTIONS = [
  { label: "Show row count", value: "showRowCount" },
  { label: "Bold row count", value: "rowCountBold" },
  { label: "Filter chips", value: "showFilterBadges" },
  { label: "Clear filters button", value: "showClearFiltersButton" },
  { label: "Pagination labels", value: "showButtonLabels" },
  { label: "First/last buttons", value: "showFirstLastButtons" },
  { label: "Borders", value: "bordered" },
  { label: "Auto width", value: "autoWidth" },
  {
    label: "Hide row actions when selecting",
    value: "hideRowActionsWhenSelectionActive",
  },
  { label: "Reset to page 1 on changes", value: "resetPageOnChange" },
];

const PLAYGROUND_SORT_FIELD_OPTIONS = [
  { label: "Amount", value: "amount" },
  { label: "Company", value: "name" },
  { label: "Contact", value: "contact" },
  { label: "Status", value: "status" },
  { label: "Segment", value: "category" },
  { label: "Close date", value: "date" },
];

const PLAYGROUND_SORT_DIRECTION_OPTIONS = [
  { label: "Descending", value: "descending" },
  { label: "Ascending", value: "ascending" },
  { label: "Off", value: "none" },
];

const PLAYGROUND_RECORD_LABEL_OPTIONS = [
  { label: "Companies", value: "companies" },
  { label: "Deals", value: "deals" },
  { label: "Records", value: "records" },
];

const PLAYGROUND_FILTER_TYPE_OPTIONS = [
  { label: "Single select", value: "select" },
  { label: "Multi-select", value: "multiselect" },
];

const PLAYGROUND_ACTIVE_FILTER_OPTIONS = [
  { label: "Status", value: "status" },
  { label: "Segment", value: "category" },
  { label: "Close date", value: "date" },
];

const cloneSampleData = () =>
  SAMPLE_DATA.map((row) => ({
    ...row,
    callTime: row.callTime ? { ...row.callTime } : null,
    meeting: row.meeting
      ? {
        date: row.meeting.date ? { ...row.meeting.date } : null,
        time: row.meeting.time ? { ...row.meeting.time } : null,
      }
      : null,
  }));

const createPlaygroundState = (presetId = "overview") => ({
  presetId,
  ...PLAYGROUND_PRESETS[presetId],
});

const buildPlaygroundFilters = (controls) => {
  const active = new Set(controls.activeFilters || ["status", "category", "date"]);
  const all = [
    { name: "status", type: "select", placeholder: "All statuses", options: STATUS_OPTIONS },
    {
      name: "category",
      type: controls.categoryFilterType,
      placeholder: controls.categoryFilterType === "multiselect" ? "Segments" : "All segments",
      options: CATEGORY_OPTIONS,
    },
    { name: "date", type: "dateRange", placeholder: "Close date" },
  ];
  return all.filter((f) => active.has(f.name));
};

const buildPlaygroundColumns = (controls) => {
  const editableFields =
    controls.editing === "none"
      ? new Set()
      : new Set(["name", "status", "amount", "meeting", "priority"]);

  const columnsByField = {
    name: {
      field: "name",
      label: "Company",
      sortable: true,
      ...(controls.footer ? { footer: "Total" } : {}),
      ...(editableFields.has("name")
        ? {
          editable: true,
          editType: "text",
          editValidate: (val) => {
            if (!val || val.trim() === "") return "Company name is required";
            if (val.trim().length < 2) return "Must be at least 2 characters";
            return true;
          },
        }
        : {}),
      renderCell: (val) => <Text format={{ fontWeight: "demibold" }}>{val}</Text>,
    },
    contact: {
      field: "contact",
      label: "Contact",
      sortable: true,
      renderCell: (val) => val,
    },
    status: {
      field: "status",
      label: "Status",
      ...(controls.columnDescriptions
        ? { description: "Current stage of the deal in the sales pipeline." }
        : {}),
      sortable: true,
      ...(editableFields.has("status")
        ? { editable: true, editType: "select", editOptions: STATUS_OPTIONS }
        : {}),
      renderCell: (val) => <StatusTag variant={STATUS_COLORS[val]}>{STATUS_LABELS[val]}</StatusTag>,
    },
    category: {
      field: "category",
      label: "Segment",
      sortable: true,
      renderCell: (val) => val,
    },
    amount: {
      field: "amount",
      label: "Amount",
      ...(controls.columnDescriptions
        ? { description: "Expected deal value in USD, net of standard discounts." }
        : {}),
      sortable: true,
      align: "right",
      ...(controls.footer
        ? {
          footer: (rows) =>
            formatCurrency(rows.reduce((sum, row) => sum + row.amount, 0)),
        }
        : {}),
      ...(editableFields.has("amount")
        ? {
          editable: true,
          editType: "currency",
          editValidate: (val) => {
            if (val === null || val === undefined || val === "") return "Amount is required";
            if (Number(val) < 0) return "Cannot be negative";
            if (Number(val) > 1000000) return "Cannot exceed $1,000,000";
            return true;
          },
        }
        : {}),
      renderCell: (val) => formatCurrency(val),
    },
    date: {
      field: "date",
      label: "Close Date",
      sortable: true,
      width: controls.scrollable ? "min" : undefined,
      renderCell: (val) =>
        new Date(val).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
    },
    priority: {
      field: "priority",
      label: "Priority",
      ...(controls.columnDescriptions
        ? { description: "Flagged accounts get surfaced at the top of outreach queues." }
        : {}),
      ...(editableFields.has("priority")
        ? { editable: true, editType: "toggle" }
        : {}),
      renderCell: (val) => (val ? <Tag variant="warning">Priority</Tag> : <Text variant="microcopy">No</Text>),
    },
    callTime: {
      field: "callTime",
      label: "Call Time",
      renderCell: (val) => formatTime(val),
    },
    meeting: {
      field: "meeting",
      label: "Meeting",
      ...(editableFields.has("meeting")
        ? {
          editable: true,
          editType: "datetime",
          editProps: { timeProps: { interval: 30 } },
        }
        : {}),
      renderCell: (val) => formatDateTime(val),
    },
    notes: {
      field: "notes",
      label: "Notes",
      truncate: controls.scrollable ? true : { maxLength: 80 },
      renderCell: (val) => val || "—",
    },
  };

  return controls.columnFields.map((field) => columnsByField[field]).filter(Boolean);
};

export const DataTablePlaygroundDemo = () => {
  const [controls, setControls] = useState(() => createPlaygroundState());
  const [data, setData] = useState(() => cloneSampleData());
  const [, setSelectedIds] = useState([]);
  const [editingRowId, setEditingRowId] = useState(null);

  const applyPreset = useCallback(
    (presetId) => {
      setControls(createPlaygroundState(presetId));
      setData(cloneSampleData());
      setSelectedIds([]);
      setEditingRowId(null);
    },
    []
  );

  const updateControls = useCallback((key, value) => {
    if (key === "selectable" && !value) {
      setSelectedIds([]);
    }
    if (key === "editing" && value !== "row") {
      setEditingRowId(null);
    }
    setControls((current) => ({ ...current, [key]: value }));
  }, []);

  const handleColumnChange = useCallback((nextFields) => {
    if (!nextFields.length) return;
    const nextSet = new Set(nextFields);
    const orderedFields = PLAYGROUND_COLUMN_OPTIONS.map((option) => option.value).filter((value) =>
      nextSet.has(value)
    );
    updateControls("columnFields", orderedFields);
  }, [updateControls]);

  const handleRowEdit = useCallback(
    (row, field, newValue) => {
      setData((current) =>
        current.map((item) => (item.id === row.id ? { ...item, [field]: newValue } : item))
      );
    },
    []
  );

  const togglePriority = useCallback(
    (row) => {
      setData((current) =>
        current.map((item) =>
          item.id === row.id ? { ...item, priority: !item.priority } : item
        )
      );
    },
    []
  );

  const selectionActions = useMemo(
    () => [
      {
        label: "Compare",
        icon: "search",
        onClick: () => { },
      },
      {
        label: "Add to list",
        icon: "add",
        onClick: () => { },
      },
    ],
    []
  );

  const rowActions = useCallback(
    (row) => {
      const actions = [];

      if (controls.editing === "row") {
        actions.push(
          editingRowId === row.id
            ? {
              label: "Done",
              icon: "success",
              onClick: () => {
                setEditingRowId(null);
              },
            }
            : {
              label: "Edit",
              icon: "edit",
              onClick: (target) => {
                setEditingRowId(target.id);
              },
            }
        );
      }

      if (controls.rowActions) {
        actions.push(
          {
            label: "Inspect",
            icon: "search",
            onClick: () => { },
          },
          {
            label: row.priority ? "Remove priority" : "Mark priority",
            icon: "edit",
            onClick: togglePriority,
          }
        );
      }

      return actions;
    },
    [controls.editing, controls.rowActions, editingRowId, togglePriority]
  );

  const columns = useMemo(() => buildPlaygroundColumns(controls), [controls]);
  const groupBy = useMemo(
    () =>
      controls.grouping
        ? {
          field: "category",
          label: (value, rows) =>
            `${value.charAt(0).toUpperCase() + value.slice(1)} (${rows.length})`,
          sort: "asc",
          defaultExpanded: true,
          aggregations: {
            amount: (rows) =>
              formatCurrency(rows.reduce((sum, row) => sum + row.amount, 0)),
            status: (rows) => {
              const activeRows = rows.filter((row) => row.status === "active").length;
              return (
                <Text variant="microcopy">
                  {activeRows} of {rows.length} active
                </Text>
              );
            },
          },
        }
        : undefined,
    [controls.grouping]
  );

  const featureValues = useMemo(
    () =>
      PLAYGROUND_FEATURE_OPTIONS.filter((option) => controls[option.value]).map(
        (option) => option.value
      ),
    [controls]
  );

  const presentationValues = useMemo(
    () =>
      PLAYGROUND_PRESENTATION_OPTIONS.filter((option) => controls[option.value]).map(
        (option) => option.value
      ),
    [controls]
  );

  const recordLabel = useMemo(() => {
    if (controls.recordLabelStyle === "deals") {
      return { singular: "Deal", plural: "Deals" };
    }
    if (controls.recordLabelStyle === "records") {
      return { singular: "Record", plural: "Records" };
    }
    return { singular: "Company", plural: "Companies" };
  }, [controls.recordLabelStyle]);

  const defaultSort = useMemo(() => {
    if (controls.sortDirection === "none") return undefined;
    return { [controls.sortField]: controls.sortDirection };
  }, [controls.sortDirection, controls.sortField]);

  const playgroundFilters = useMemo(
    () => buildPlaygroundFilters(controls),
    [controls]
  );

  const handleFeatureChange = useCallback((values) => {
    const selected = new Set(values);
    PLAYGROUND_FEATURE_OPTIONS.forEach((option) => {
      const nextValue = selected.has(option.value);
      if (controls[option.value] !== nextValue) {
        updateControls(option.value, nextValue);
      }
    });
  }, [controls, updateControls]);

  const handlePresentationChange = useCallback((values) => {
    const selected = new Set(values);
    PLAYGROUND_PRESENTATION_OPTIONS.forEach((option) => {
      const nextValue = selected.has(option.value);
      if (controls[option.value] !== nextValue) {
        updateControls(option.value, nextValue);
      }
    });
  }, [controls, updateControls]);

  const controlsOverlay = useMemo(() => (
    <Panel id="datatable-playground-controls" title="Customize table" width="sm">
      <PanelBody>
        <PanelSection>
          <Flex direction="column" gap="sm">
            <Text>
              Pick a preset, then tune the feature flags and structure live against the same table preview.
            </Text>
            <Select
              label="Preset"
              name="datatable-playground-preset-panel"
              value={controls.presetId}
              options={PLAYGROUND_PRESET_OPTIONS}
              onChange={applyPreset}
            />
          </Flex>
        </PanelSection>
        <PanelSection>
          <Flex direction="column" gap="sm">
            <ToggleGroup
              toggleType="checkboxList"
              name="datatable-playground-features"
              label="Features"
              value={featureValues}
              options={PLAYGROUND_FEATURE_OPTIONS}
              onChange={handleFeatureChange}
            />
          </Flex>
        </PanelSection>
        <PanelSection>
          <Flex direction="column" gap="sm">
            <ToggleGroup
              toggleType="checkboxList"
              name="datatable-playground-presentation"
              label="Toolbar and table chrome"
              value={presentationValues}
              options={PLAYGROUND_PRESENTATION_OPTIONS}
              onChange={handlePresentationChange}
            />
          </Flex>
        </PanelSection>
        <PanelSection>
          <Flex direction="column" gap="sm">
            <Text format={{ fontWeight: "demibold" }}>Structure</Text>
            <MultiSelect
              label="Visible columns"
              name="datatable-playground-columns"
              value={controls.columnFields}
              options={PLAYGROUND_COLUMN_OPTIONS}
              onChange={handleColumnChange}
            />
            <NumberInput
              label="Page size"
              name="datatable-playground-page-size"
              min={3}
              max={20}
              value={controls.pageSize}
              onChange={(value) => updateControls("pageSize", value)}
            />
            <Select
              label="Editing mode"
              name="datatable-playground-edit-mode"
              value={controls.editing}
              options={PLAYGROUND_EDIT_MODE_OPTIONS}
              onChange={(value) => updateControls("editing", value)}
            />
            <NumberInput
              label="Inline filter count"
              name="datatable-playground-filter-inline-limit"
              min={1}
              max={4}
              value={controls.filterInlineLimit}
              onChange={(value) => updateControls("filterInlineLimit", value)}
            />
            <Select
              label="Segment filter type"
              name="datatable-playground-category-filter-type"
              value={controls.categoryFilterType}
              options={PLAYGROUND_FILTER_TYPE_OPTIONS}
              onChange={(value) => updateControls("categoryFilterType", value)}
            />
            <MultiSelect
              label="Active filters"
              name="datatable-playground-active-filters"
              value={controls.activeFilters}
              options={PLAYGROUND_ACTIVE_FILTER_OPTIONS}
              onChange={(value) => updateControls("activeFilters", value)}
            />
          </Flex>
        </PanelSection>
        <PanelSection>
          <Flex direction="column" gap="sm">
            <Text format={{ fontWeight: "demibold" }}>Sorting and labels</Text>
            <Select
              label="Default sort field"
              name="datatable-playground-sort-field"
              value={controls.sortField}
              options={PLAYGROUND_SORT_FIELD_OPTIONS}
              onChange={(value) => updateControls("sortField", value)}
            />
            <Select
              label="Default sort direction"
              name="datatable-playground-sort-direction"
              value={controls.sortDirection}
              options={PLAYGROUND_SORT_DIRECTION_OPTIONS}
              onChange={(value) => updateControls("sortDirection", value)}
            />
            <Select
              label="Record label"
              name="datatable-playground-record-label"
              value={controls.recordLabelStyle}
              options={PLAYGROUND_RECORD_LABEL_OPTIONS}
              onChange={(value) => updateControls("recordLabelStyle", value)}
            />
          </Flex>
        </PanelSection>
      </PanelBody>
      <PanelFooter>
        <Flex direction="row" justify="end">
          <Button variant="secondary" onClick={() => applyPreset(controls.presetId)}>
            Reset preset
          </Button>
        </Flex>
      </PanelFooter>
    </Panel>
  ), [
    controls,
    applyPreset,
    updateControls,
    handleColumnChange,
    handleFeatureChange,
    handlePresentationChange,
    featureValues,
    presentationValues,
  ]);

  const customizeButton = useMemo(() => (
    <Button variant="secondary" overlay={controlsOverlay}>
      Customize
    </Button>
  ), [controlsOverlay]);

  useDemoHeaderSlot(customizeButton);

  return (
    <Flex direction="column" gap="sm">
      <DataTable
        data={data}
        columns={columns}
        rowIdField="id"
        recordLabel={recordLabel}
        pageSize={controls.pageSize}
        defaultSort={defaultSort}
        searchFields={controls.search ? ["name", "contact", "notes"] : []}
        searchPlaceholder={
          controls.search ? "Search companies, contacts, or notes..." : undefined
        }
        fuzzySearch={controls.search && controls.fuzzySearch}
        filters={controls.filters ? playgroundFilters : []}
        filterInlineLimit={controls.filterInlineLimit}
        showFilterBadges={controls.showFilterBadges}
        showClearFiltersButton={controls.showClearFiltersButton}
        selectable={controls.selectable}
        onSelectionChange={(ids) => {
          setSelectedIds(ids);
        }}
        selectionActions={controls.selectable ? selectionActions : []}
        rowActions={controls.rowActions || controls.editing === "row" ? rowActions : undefined}
        hideRowActionsWhenSelectionActive={controls.hideRowActionsWhenSelectionActive}
        groupBy={groupBy}
        scrollable={controls.scrollable}
        editMode={controls.editing === "row" ? undefined : controls.editing}
        editingRowId={controls.editing === "row" ? editingRowId : null}
        onRowEdit={controls.editing === "none" ? undefined : handleRowEdit}
        showRowCount={controls.showRowCount}
        rowCountBold={controls.rowCountBold}
        showButtonLabels={controls.showButtonLabels}
        showFirstLastButtons={controls.showFirstLastButtons}
        bordered={controls.bordered}
        autoWidth={controls.autoWidth}
        resetPageOnChange={controls.resetPageOnChange}
      />
    </Flex>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Full-Featured DataTable
// ═══════════════════════════════════════════════════════════════════════════

const FULL_COLUMNS = [
  { field: "name", label: "Company", sortable: true, footer: "Total", renderCell: (val) => <Text format={{ fontWeight: "demibold" }}>{val}</Text> },
  { field: "contact", label: "Contact", sortable: true, renderCell: (val) => val },
  { field: "status", label: "Status", sortable: true, renderCell: (val) => <StatusTag variant={STATUS_COLORS[val]}>{STATUS_LABELS[val]}</StatusTag> },
  { field: "category", label: "Segment", sortable: true, renderCell: (val) => val },
  { field: "amount", label: "Amount", sortable: true, align: "right", footer: (rows) => formatCurrency(rows.reduce((sum, r) => sum + r.amount, 0)), renderCell: (val) => formatCurrency(val) },
  { field: "date", label: "Close Date", sortable: true, renderCell: (val) => new Date(val).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
];

const FULL_FILTERS = [
  { name: "status", type: "select", placeholder: "All statuses", options: STATUS_OPTIONS },
  { name: "category", type: "select", placeholder: "All segments", options: CATEGORY_OPTIONS },
  { name: "date", type: "dateRange", placeholder: "Close date" },
];

export const FullFeaturedDemo = () => (
  <DataTable
    data={SAMPLE_DATA}
    columns={FULL_COLUMNS}
    searchFields={["name", "contact"]}
    searchPlaceholder="Search companies or contacts..."
    fuzzySearch={true}
    filters={FULL_FILTERS}
    recordLabel={{ singular: "Deal", plural: "Deals" }}
    pageSize={5}
    defaultSort={{ amount: "descending" }}
  />
);

// ═══════════════════════════════════════════════════════════════════════════
// Selectable DataTable
// ═══════════════════════════════════════════════════════════════════════════

const SELECT_COLUMNS = [
  { field: "name", label: "Company", sortable: true, renderCell: (val) => <Text format={{ fontWeight: "demibold" }}>{val}</Text> },
  { field: "contact", label: "Contact", renderCell: (val) => val },
  { field: "status", label: "Status", renderCell: (val) => <StatusTag variant={STATUS_COLORS[val]}>{STATUS_LABELS[val]}</StatusTag> },
  { field: "amount", label: "Amount", sortable: true, align: "right", renderCell: (val) => formatCurrency(val) },
  { field: "notes", label: "Notes", truncate: { maxLength: 60 }, renderCell: (val) => val },
];

export const SelectableDemo = () => {
  const [selected, setSelected] = useState([]);
  const selectionActions = useMemo(() => [
    { label: "Edit", icon: "edit", onClick: (ids) => console.log("Edit", ids) },
    { label: "Delete", icon: "delete", onClick: (ids) => console.log("Delete", ids) },
  ], []);

  return (
    <DataTable
      data={SAMPLE_DATA}
      columns={SELECT_COLUMNS}
      selectable={true}
      rowIdField="id"
      recordLabel={{ singular: "Company", plural: "Companies" }}
      onSelectionChange={setSelected}
      selectionActions={selectionActions}
      rowActions={[
        { icon: "edit", onClick: (row) => console.log("Edit", row) },
        { icon: "delete", onClick: (row) => console.log("Delete", row) },
      ]}
      searchFields={["name"]}
      filters={[{ name: "status", type: "select", placeholder: "All statuses", options: STATUS_OPTIONS }]}
      pageSize={5}
    />
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Editable DataTable
// ═══════════════════════════════════════════════════════════════════════════

export const EditableDemo = () => {
  const [data, setData] = useState(SAMPLE_DATA);
  const [editingRowId, setEditingRowId] = useState(null);

  const handleEdit = useCallback((row, field, newValue) => {
    setData((prev) => prev.map((r) => (r.id === row.id ? { ...r, [field]: newValue } : r)));
  }, []);

  const editColumns = [
    {
      field: "name", label: "Company", sortable: true, editable: true, editType: "text",
      editValidate: (val) => { if (!val || val.trim() === "") return "Company name is required"; if (val.length < 2) return "Must be at least 2 characters"; return true; },
      renderCell: (val) => <Text format={{ fontWeight: "demibold" }}>{val}</Text>
    },
    {
      field: "status", label: "Status", editable: true, editType: "select", editOptions: STATUS_OPTIONS,
      renderCell: (val) => <StatusTag variant={STATUS_COLORS[val]}>{STATUS_LABELS[val]}</StatusTag>
    },
    {
      field: "amount", label: "Amount", sortable: true, align: "right", editable: true, editType: "currency",
      editValidate: (val) => { if (val === null || val === undefined || val === "") return "Amount is required"; if (Number(val) < 0) return "Cannot be negative"; if (Number(val) > 1000000) return "Cannot exceed $1,000,000"; return true; },
      renderCell: (val) => formatCurrency(val)
    },
    {
      field: "meeting", label: "Meeting", editable: true, editType: "datetime", editProps: { timeProps: { interval: 30 } },
      renderCell: (val) => formatDateTime(val)
    },
  ];

  return (
    <DataTable
      data={data}
      columns={editColumns}
      rowIdField="id"
      editingRowId={editingRowId}
      onRowEdit={handleEdit}
      rowActions={(row) => [
        editingRowId === row.id
          ? { label: "Done", icon: "success", onClick: () => setEditingRowId(null) }
          : { label: "Edit", icon: "edit", onClick: (r) => setEditingRowId(r.id) },
      ]}
      searchFields={["name", "contact"]}
      pageSize={6}
    />
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Scrollable DataTable
// ═══════════════════════════════════════════════════════════════════════════

const SCROLLABLE_COLUMNS = [
  { field: "name", label: "Company", sortable: true, renderCell: (val) => <Text format={{ fontWeight: "demibold" }}>{val}</Text> },
  { field: "contact", label: "Contact", sortable: true, renderCell: (val) => val },
  { field: "status", label: "Status", renderCell: (val) => <StatusTag variant={STATUS_COLORS[val]}>{STATUS_LABELS[val]}</StatusTag> },
  { field: "category", label: "Segment", renderCell: (val) => val },
  { field: "amount", label: "Amount", sortable: true, align: "right", renderCell: (val) => formatCurrency(val) },
  { field: "date", label: "Close Date", sortable: true, width: "min", renderCell: (val) => new Date(val).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
  { field: "priority", label: "Priority", renderCell: (val) => val ? "Yes" : "No" },
  { field: "callTime", label: "Call Time", renderCell: (val) => formatTime(val) },
  { field: "notes", label: "Notes", truncate: true, renderCell: (val) => val },
];

export const ScrollableDemo = () => (
  <DataTable
    data={SAMPLE_DATA}
    columns={SCROLLABLE_COLUMNS}
    scrollable={true}
    searchFields={["name", "contact"]}
    searchPlaceholder="Search..."
    pageSize={6}
    defaultSort={{ amount: "descending" }}
  />
);

// ═══════════════════════════════════════════════════════════════════════════
// Minimal / Basic DataTable
// ═══════════════════════════════════════════════════════════════════════════

const BASIC_COLUMNS = [
  { field: "name", label: "Company", sortable: true, renderCell: (val) => <Text format={{ fontWeight: "demibold" }}>{val}</Text> },
  { field: "contact", label: "Contact", renderCell: (val) => val },
  { field: "amount", label: "Amount", sortable: true, align: "right", renderCell: (val) => formatCurrency(val) },
];

export const BasicDemo = () => (
  <DataTable
    data={SAMPLE_DATA}
    columns={BASIC_COLUMNS}
    pageSize={5}
  />
);

// ═══════════════════════════════════════════════════════════════════════════
// Row Grouping with Aggregations
// ═══════════════════════════════════════════════════════════════════════════

const GROUP_COLUMNS = [
  { field: "name", label: "Company", renderCell: (val) => <Text format={{ fontWeight: "demibold" }}>{val}</Text> },
  { field: "contact", label: "Contact", renderCell: (val) => val },
  { field: "status", label: "Status", renderCell: (val) => <StatusTag variant={STATUS_COLORS[val]}>{STATUS_LABELS[val]}</StatusTag> },
  { field: "amount", label: "Amount", align: "right", renderCell: (val) => formatCurrency(val) },
];

export const GroupingDemo = () => (
  <DataTable
    data={SAMPLE_DATA}
    columns={GROUP_COLUMNS}
    groupBy={{
      field: "category",
      label: (value, rows) => `${value.charAt(0).toUpperCase() + value.slice(1)} (${rows.length})`,
      sort: "asc",
      defaultExpanded: true,
      aggregations: {
        amount: (rows) => formatCurrency(rows.reduce((sum, r) => sum + r.amount, 0)),
        status: (rows) => {
          const active = rows.filter((r) => r.status === "active").length;
          return <Text variant="microcopy">{active} of {rows.length} active</Text>;
        },
      },
    }}
    pageSize={20}
  />
);

// ═══════════════════════════════════════════════════════════════════════════
// Discrete Inline Editing
// ═══════════════════════════════════════════════════════════════════════════

export const DiscreteEditDemo = () => {
  const [data, setData] = useState(SAMPLE_DATA);

  const handleEdit = useCallback((row, field, newValue) => {
    setData((prev) => prev.map((r) => (r.id === row.id ? { ...r, [field]: newValue } : r)));
  }, []);

  const columns = [
    {
      field: "name", label: "Company", sortable: true, editable: true, editType: "text",
      renderCell: (val) => <Text format={{ fontWeight: "demibold" }}>{val}</Text>,
    },
    {
      field: "status", label: "Status", editable: true, editType: "select", editOptions: STATUS_OPTIONS,
      renderCell: (val) => <StatusTag variant={STATUS_COLORS[val]}>{STATUS_LABELS[val]}</StatusTag>,
    },
    {
      field: "amount", label: "Amount", sortable: true, align: "right", editable: true, editType: "currency",
      renderCell: (val) => formatCurrency(val),
    },
    {
      field: "priority", label: "Priority", editable: true, editType: "checkbox",
      renderCell: (val) => val ? <Tag variant="default">Yes</Tag> : <Text variant="microcopy">No</Text>,
    },
  ];

  return (
    <DataTable
      data={data}
      columns={columns}
      rowIdField="id"
      onRowEdit={handleEdit}
      searchFields={["name"]}
      pageSize={6}
    />
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Always-Visible Inline Edit Mode
// ═══════════════════════════════════════════════════════════════════════════

export const InlineModeDemo = () => {
  const [data, setData] = useState(SAMPLE_DATA);

  const handleEdit = useCallback((row, field, newValue) => {
    setData((prev) => prev.map((r) => (r.id === row.id ? { ...r, [field]: newValue } : r)));
  }, []);

  const columns = [
    { field: "name", label: "Company", editable: true, editType: "text", renderCell: (val) => val },
    {
      field: "status", label: "Status", editable: true, editType: "select", editOptions: STATUS_OPTIONS,
      renderCell: (val) => <StatusTag variant={STATUS_COLORS[val]}>{STATUS_LABELS[val]}</StatusTag>,
    },
    { field: "amount", label: "Amount", align: "right", editable: true, editType: "number", renderCell: (val) => formatCurrency(val) },
    { field: "priority", label: "Priority", editable: true, editType: "toggle", renderCell: (val) => val ? "Yes" : "No" },
  ];

  return (
    <DataTable
      data={data}
      columns={columns}
      rowIdField="id"
      editMode="inline"
      onRowEdit={handleEdit}
      pageSize={5}
    />
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Server-Side Mode (Simulated)
// ═══════════════════════════════════════════════════════════════════════════

const simulateFetch = (params) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let filtered = [...SAMPLE_DATA];
      if (params.search) {
        const term = params.search.toLowerCase();
        filtered = filtered.filter((r) => r.name.toLowerCase().includes(term) || r.contact.toLowerCase().includes(term));
      }
      if (params.filters?.status) {
        filtered = filtered.filter((r) => r.status === params.filters.status);
      }
      if (params.sort) {
        const { field, direction } = params.sort;
        filtered.sort((a, b) => {
          if (a[field] < b[field]) return direction === "ascending" ? -1 : 1;
          if (a[field] > b[field]) return direction === "ascending" ? 1 : -1;
          return 0;
        });
      }
      const start = ((params.page || 1) - 1) * 4;
      resolve({ rows: filtered.slice(start, start + 4), total: filtered.length });
    }, 600);
  });
};

export const ServerSideDemo = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [params, setParams] = useState({ page: 1, search: "", filters: {}, sort: null });

  const fetchData = useCallback((newParams) => {
    setLoading(true);
    setParams(newParams);
    simulateFetch(newParams).then(({ rows, total }) => {
      setData(rows);
      setTotalCount(total);
      setLoading(false);
    });
  }, []);

  // Initial fetch
  useMemo(() => { fetchData(params); }, []);

  const columns = [
    { field: "name", label: "Company", sortable: true, renderCell: (val) => <Text format={{ fontWeight: "demibold" }}>{val}</Text> },
    { field: "contact", label: "Contact", sortable: true, renderCell: (val) => val },
    { field: "status", label: "Status", renderCell: (val) => <StatusTag variant={STATUS_COLORS[val]}>{STATUS_LABELS[val]}</StatusTag> },
    { field: "amount", label: "Amount", sortable: true, align: "right", renderCell: (val) => formatCurrency(val) },
  ];

  return (
    <DataTable
      serverSide={true}
      loading={loading}
      data={data}
      totalCount={totalCount}
      columns={columns}
      searchFields={["name", "contact"]}
      searchPlaceholder="Search (server-side)..."
      searchDebounce={300}
      filters={[{ name: "status", type: "select", placeholder: "All statuses", options: STATUS_OPTIONS }]}
      pageSize={4}
      page={params.page}
      searchValue={params.search}
      filterValues={params.filters}
      sort={params.sort}
      onParamsChange={(p) => fetchData({ ...params, ...p })}
      recordLabel={{ singular: "Record", plural: "Records" }}
    />
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Custom Filter Functions
// ═══════════════════════════════════════════════════════════════════════════

const CUSTOM_FILTER_COLUMNS = [
  { field: "name", label: "Company", sortable: true, footer: "Total", renderCell: (val) => <Text format={{ fontWeight: "demibold" }}>{val}</Text> },
  { field: "category", label: "Segment", sortable: true, renderCell: (val) => val },
  { field: "amount", label: "Amount", sortable: true, align: "right", footer: (rows) => formatCurrency(rows.reduce((sum, r) => sum + r.amount, 0)), renderCell: (val) => formatCurrency(val) },
  { field: "status", label: "Status", renderCell: (val) => <StatusTag variant={STATUS_COLORS[val]}>{STATUS_LABELS[val]}</StatusTag> },
];

const CUSTOM_FILTERS = [
  {
    name: "amount",
    type: "select",
    placeholder: "Deal size",
    options: [
      { label: "Under $50K", value: "small" },
      { label: "$50K - $200K", value: "medium" },
      { label: "Over $200K", value: "large" },
    ],
    filterFn: (row, value) => {
      if (value === "small") return row.amount < 50000;
      if (value === "medium") return row.amount >= 50000 && row.amount <= 200000;
      return row.amount > 200000;
    },
  },
  { name: "category", type: "multiselect", placeholder: "Segments", options: CATEGORY_OPTIONS },
];

export const CustomFilterDemo = () => (
  <DataTable
    data={SAMPLE_DATA}
    columns={CUSTOM_FILTER_COLUMNS}
    filters={CUSTOM_FILTERS}
    searchFields={["name"]}
    searchPlaceholder="Search companies..."
    recordLabel={{ singular: "Deal", plural: "Deals" }}
    pageSize={6}
    defaultSort={{ amount: "descending" }}
  />
);

// ═══════════════════════════════════════════════════════════════════════════
// Isolated feature demos — one focused card per capability
// ═══════════════════════════════════════════════════════════════════════════

const dtNotify = (actions, message, type = "success") => actions?.addAlert?.({ type, message });

const DT_GITHUB = "https://github.com/05bmckay/hs-uix/tree/main/packages/datatable";

const FEATURE_COLUMNS = [
  { field: "name", label: "Account", sortable: true },
  { field: "contact", label: "Contact" },
  { field: "status", label: "Status", renderCell: (v) => <StatusTag variant={STATUS_COLORS[v]}>{STATUS_LABELS[v]}</StatusTag> },
  { field: "amount", label: "Amount", align: "right", sortable: true, renderCell: (v) => formatCurrency(v) },
];

// Advanced sorting — sortOrder (enum rank) + sortComparator (custom)
const SortingDemo = () => {
  const columns = [
    {
      field: "name",
      label: "Account",
      sortable: true,
      // Case-insensitive, locale-aware comparison
      sortComparator: (a, b) => String(a).localeCompare(String(b), undefined, { sensitivity: "base" }),
    },
    {
      field: "status",
      label: "Status",
      sortable: true,
      // Rank by a fixed business order rather than alphabetically
      sortOrder: ["active", "at-risk", "churned"],
      renderCell: (v) => <StatusTag variant={STATUS_COLORS[v]}>{STATUS_LABELS[v]}</StatusTag>,
    },
    { field: "amount", label: "Amount", align: "right", sortable: true, renderCell: (v) => formatCurrency(v) },
  ];
  return (
    <Flex direction="column" gap="sm">
      <Text>
        sortComparator gives Account a case-insensitive sort;{" "}
        sortOrder ranks Status by a business order (active → at-risk → churned) instead of alphabetically.
      </Text>
      <DataTable data={SAMPLE_DATA} columns={columns} defaultSort={{ status: "ascending" }} pageSize={6} />
    </Flex>
  );
};

// Edit lifecycle & validation (discrete / click-to-edit)
const EditLifecycleDemo = ({ actions }) => {
  const [rows, setRows] = useState(() => SAMPLE_DATA.slice(0, 6).map((r) => ({ ...r })));
  const columns = [
    {
      field: "name",
      label: "Account",
      editable: true,
      editType: "text",
      editValidate: (value) => (value && String(value).trim() ? true : "Name can't be empty"),
    },
    { field: "status", label: "Status", editable: true, editType: "select", editOptions: STATUS_OPTIONS, renderCell: (v) => <StatusTag variant={STATUS_COLORS[v]}>{STATUS_LABELS[v]}</StatusTag> },
    { field: "amount", label: "Amount", align: "right", editable: true, editType: "currency", renderCell: (v) => formatCurrency(v) },
  ];
  return (
    <Flex direction="column" gap="sm">
      <Text>
        Click a cell to edit. editValidate blocks an empty Account, and the lifecycle hooks
        (onEditStart / onEditCancel) fire alerts.
      </Text>
      <DataTable
        data={rows}
        columns={columns}
        rowIdField="id"
        editMode="discrete"
        onRowEdit={(row, field, value) => setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, [field]: value } : r)))}
        onEditStart={(row, field) => dtNotify(actions, `Editing ${field} on ${row.name}`, "info")}
        onEditCancel={(row, field) => dtNotify(actions, `Cancelled editing ${field}`, "info")}
        pageSize={6}
      />
    </Flex>
  );
};

// Render overrides — empty / loading / error / selection bar
const DT_STATE_OPTIONS = [
  { label: "Data", value: "data" },
  { label: "Empty", value: "empty" },
  { label: "Loading", value: "loading" },
  { label: "Error", value: "error" },
];
const RenderOverridesDemo = ({ actions }) => {
  const [state, setState] = useState("data");
  const data = state === "empty" ? [] : SAMPLE_DATA.slice(0, 5);
  return (
    <Flex direction="column" gap="sm">
      <Text>
        Custom renderEmptyState / renderLoadingState / renderErrorState / renderSelectionBar.
        Switch the state, or select rows to see the custom selection bar.
      </Text>
      <Select name="dt-state" label="Table state" value={state} options={DT_STATE_OPTIONS} onChange={setState} />
      <DataTable
        data={data}
        columns={FEATURE_COLUMNS}
        rowIdField="id"
        selectable
        loading={state === "loading"}
        error={state === "error" ? "Simulated load failure" : false}
        selectionActions={[{ label: "Archive", onClick: (ids) => dtNotify(actions, `Archived ${ids.length}`) }]}
        renderEmptyState={({ title }) => (
          <Flex direction="column" align="center" gap="xs">
            🗂 Nothing here yet
            <Text variant="microcopy">{title}</Text>
          </Flex>
        )}
        renderLoadingState={({ label }) => <Text>⏳ {label}</Text>}
        renderErrorState={({ error }) => (
          <Flex direction="column" gap="xs">
            ⚠️ Couldn't load accounts
            <Text variant="microcopy">{String(error)}</Text>
          </Flex>
        )}
        renderSelectionBar={({ selectedIds, selectedCount, onDeselectAll, selectionActions }) => (
          <Flex direction="row" gap="sm" align="center">
            {selectedCount} picked
            {selectionActions.map((action) => (
              <Button key={action.label} variant="primary" onClick={() => action.onClick([...selectedIds])}>
                {action.label}
              </Button>
            ))}
            <Button variant="transparent" onClick={onDeselectAll}>Clear</Button>
          </Flex>
        )}
      />
    </Flex>
  );
};

// Custom filters — a filterFn bucket alongside a standard select filter
const FeatureFilterDemo = () => {
  const filters = [
    { name: "status", label: "Status", placeholder: "Any status", options: STATUS_OPTIONS },
    {
      name: "size",
      label: "Deal size",
      placeholder: "Any size",
      options: [
        { label: "≥ $100k", value: "high" },
        { label: "$50k–$100k", value: "mid" },
        { label: "< $50k", value: "low" },
      ],
      filterFn: (row, value) =>
        value === "high" ? row.amount >= 100000 : value === "mid" ? row.amount >= 50000 && row.amount < 100000 : row.amount < 50000,
    },
  ];
  return (
    <Flex direction="column" gap="sm">
      <Text>
        A standard select filter next to a filterFn filter — "Deal size" buckets rows by amount with custom logic.
      </Text>
      <DataTable data={SAMPLE_DATA} columns={FEATURE_COLUMNS} filters={filters} searchFields={["name", "contact"]} pageSize={8} />
    </Flex>
  );
};

// Titled header + toolbar toggles + i18n labels
const ToolbarI18nDemo = ({ actions }) => {
  const [showSearch, setShowSearch] = useState(true);
  return (
    <Flex direction="column" gap="sm">
      <Text>
        A title above the toolbar, a showSearch toggle,
        a custom recordLabel, and i18n labels overrides (select rows to see them).
      </Text>
      <Button variant="secondary" onClick={() => setShowSearch((s) => !s)}>
        {showSearch ? "Hide search" : "Show search"}
      </Button>
      <DataTable
        title="Top accounts"
        data={SAMPLE_DATA}
        columns={FEATURE_COLUMNS}
        rowIdField="id"
        selectable
        showSearch={showSearch}
        searchFields={["name", "contact"]}
        recordLabel={{ singular: "account", plural: "accounts" }}
        selectionActions={[{ label: "Export", onClick: (ids) => dtNotify(actions, `Exporting ${ids.length} accounts`) }]}
        labels={{
          selected: (count, label) => `${count} ${label} flagged`,
          selectAll: (total, label) => `Flag all ${total} ${label}`,
          deselectAll: "Unflag all",
        }}
      />
    </Flex>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Demo registry entries
// ═══════════════════════════════════════════════════════════════════════════

export const DATATABLE_DEMOS = [
  {
    id: "dt-playground",
    name: "Interactive Table Playground",
    description: "Storybook-style table preview with presets, a pull-out customization drawer, and live component controls.",
    package: "datatable",
    Component: DataTablePlaygroundDemo,
    githubUrl: "https://github.com/05bmckay/hs-uix/tree/main/packages/datatable",
    sourceCode: `// Interactive Table Playground
// Presets + a drawer-backed control surface for live DataTable configuration.
// Package: hs-uix/datatable
//
// The "Customize" button is registered into the shared DemoDetail header slot
// (see useDemoHeaderSlot in ./demoHeader.jsx) so it sits alongside View code /
// Copy code. The demo body is just the live DataTable.

import { Button, Flex, Panel, PanelBody, PanelFooter, PanelSection, Select } from "@hubspot/ui-extensions";
import { DataTable } from "hs-uix/datatable";
import { useDemoHeaderSlot } from "./demoHeader.jsx";

const [controls, setControls] = useState(createPlaygroundState("overview"));

const controlsOverlay = useMemo(() => (
  <Panel id="datatable-playground-controls" title="Customize table" width="sm">
    <PanelBody>
      <PanelSection>
        <Select label="Preset" value={controls.presetId} options={PLAYGROUND_PRESET_OPTIONS} onChange={applyPreset} />
      </PanelSection>
      <PanelSection>
        <Select label="Editing mode" value={controls.editing} options={PLAYGROUND_EDIT_MODE_OPTIONS} onChange={(value) => updateControls("editing", value)} />
      </PanelSection>
    </PanelBody>
    <PanelFooter>
      <Flex direction="row" justify="end">
        <Button variant="secondary" onClick={() => applyPreset(controls.presetId)}>Reset preset</Button>
      </Flex>
    </PanelFooter>
  </Panel>
), [controls, applyPreset, updateControls]);

const customizeButton = useMemo(() => (
  <Button variant="secondary" overlay={controlsOverlay}>Customize</Button>
), [controlsOverlay]);

useDemoHeaderSlot(customizeButton);

<DataTable
  data={data}
  columns={buildPlaygroundColumns(controls)}
  filters={controls.filters ? buildPlaygroundFilters(controls) : []}
  selectable={controls.selectable}
  groupBy={groupBy}
  editMode={controls.editing === "row" ? undefined : controls.editing}
/>`,
  },
  {
    id: "dt-advanced-sorting",
    name: "Advanced sorting",
    description: "Per-column sortComparator (case-insensitive) and sortOrder (rank by a fixed business order instead of alphabetically).",
    package: "datatable",
    Component: SortingDemo,
    githubUrl: DT_GITHUB,
    sourceCode: `import { DataTable } from "hs-uix/datatable";

const columns = [
  { field: "name", label: "Account", sortable: true,
    sortComparator: (a, b) => String(a).localeCompare(String(b), undefined, { sensitivity: "base" }) },
  { field: "status", label: "Status", sortable: true,
    sortOrder: ["active", "at-risk", "churned"] }, // ranked, not alphabetical
  { field: "amount", label: "Amount", align: "right", sortable: true },
];

<DataTable data={data} columns={columns} defaultSort={{ status: "ascending" }} />`,
  },
  {
    id: "dt-edit-lifecycle",
    name: "Edit lifecycle & validation",
    description: "Click-to-edit cells with editValidate plus the onEditStart / onEditCancel lifecycle hooks.",
    package: "datatable",
    Component: EditLifecycleDemo,
    githubUrl: DT_GITHUB,
    sourceCode: `import { DataTable } from "hs-uix/datatable";

<DataTable
  data={rows}
  columns={[
    { field: "name", label: "Account", editable: true, editType: "text",
      editValidate: (value) => (value?.trim() ? true : "Name can't be empty") },
    { field: "status", label: "Status", editable: true, editType: "select", editOptions },
    { field: "amount", label: "Amount", editable: true, editType: "currency" },
  ]}
  editMode="discrete"
  onRowEdit={(row, field, value) => update(row, field, value)}
  onEditStart={(row, field) => addAlert({ type: "info", message: \`Editing \${field}\` })}
  onEditCancel={(row, field) => addAlert({ type: "info", message: \`Cancelled \${field}\` })}
/>`,
  },
  {
    id: "dt-render-overrides",
    name: "Render overrides",
    description: "Replace the empty, loading, error, and selection-bar UI with renderEmptyState / renderLoadingState / renderErrorState / renderSelectionBar.",
    package: "datatable",
    Component: RenderOverridesDemo,
    githubUrl: DT_GITHUB,
    sourceCode: `import { DataTable } from "hs-uix/datatable";

<DataTable
  data={data}
  columns={columns}
  selectable
  loading={loading}
  error={error}
  selectionActions={[{ label: "Archive", onClick: (ids) => archive(ids) }]}
  renderEmptyState={({ title }) => <CustomEmpty title={title} />}
  renderLoadingState={({ label }) => <Text>⏳ {label}</Text>}
  renderErrorState={({ error }) => <CustomError error={error} />}
  renderSelectionBar={({ selectedIds, selectedCount, onDeselectAll, selectionActions }) => (
    <Flex gap="sm" align="center">
      <Text>{selectedCount} picked</Text>
      {selectionActions.map((a) => (
        <Button key={a.label} onClick={() => a.onClick([...selectedIds])}>{a.label}</Button>
      ))}
      <Button variant="transparent" onClick={onDeselectAll}>Clear</Button>
    </Flex>
  )}
/>`,
  },
  {
    id: "dt-custom-filters",
    name: "Custom filters (filterFn)",
    description: "A standard select filter alongside a filterFn filter that buckets rows with arbitrary logic.",
    package: "datatable",
    Component: FeatureFilterDemo,
    githubUrl: DT_GITHUB,
    sourceCode: `import { DataTable } from "hs-uix/datatable";

const filters = [
  { name: "status", label: "Status", options: STATUS_OPTIONS },
  {
    name: "size",
    label: "Deal size",
    options: [
      { label: "≥ $100k", value: "high" },
      { label: "$50k–$100k", value: "mid" },
      { label: "< $50k", value: "low" },
    ],
    filterFn: (row, value) =>
      value === "high" ? row.amount >= 100000
        : value === "mid" ? row.amount >= 50000 && row.amount < 100000
        : row.amount < 50000,
  },
];

<DataTable data={data} columns={columns} filters={filters} searchFields={["name", "contact"]} />`,
  },
  {
    id: "dt-toolbar-i18n",
    name: "Titled header, toggles & i18n",
    description: "A toolbar title, a showSearch toggle, custom recordLabel, and i18n labels overrides for the selection bar.",
    package: "datatable",
    Component: ToolbarI18nDemo,
    githubUrl: DT_GITHUB,
    sourceCode: `import { DataTable } from "hs-uix/datatable";

<DataTable
  title="Top accounts"
  data={data}
  columns={columns}
  selectable
  showSearch={showSearch}
  recordLabel={{ singular: "account", plural: "accounts" }}
  selectionActions={[{ label: "Export", onClick: (ids) => exportRows(ids) }]}
  labels={{
    selected: (count, label) => \`\${count} \${label} flagged\`,
    selectAll: (total, label) => \`Flag all \${total} \${label}\`,
    deselectAll: "Unflag all",
  }}
/>`,
  },
];
