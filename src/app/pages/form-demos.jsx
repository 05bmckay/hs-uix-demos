import React, { useState, useRef, useMemo, useCallback } from "react";
import {
  Alert,
  Button,
  Flex,
  Icon,
  MultiSelect,
  NumberInput,
  Panel,
  PanelBody,
  PanelFooter,
  PanelSection,
  Select,
  Tag,
  Text,
  ToggleGroup,
} from "@hubspot/ui-extensions";
import { FormBuilder } from "hs-uix";
import { useDemoHeaderSlot } from "./demoHeader.jsx";
import {
  STATUS_OPTIONS,
  CATEGORY_OPTIONS,
  ROLE_OPTIONS,
  INDUSTRY_OPTIONS,
  SUB_CATEGORIES,
  GITHUB_BASE_URL,
} from "./data.jsx";

// ═══════════════════════════════════════════════════════════════════════════
// Interactive FormBuilder Playground
// ═══════════════════════════════════════════════════════════════════════════

const BASE_PRESET = {
  layoutMode: "columns",
  columns: 2,
  columnWidth: 220,
  maxColumns: 2,
  submitPosition: "bottom",
  submitVariant: "primary",
  submitLabelStyle: "create",
  showCancel: false,
  readOnly: false,
  includeSections: false,
  includeDependentFields: false,
  showInlineAlerts: true,
  showRequiredIndicator: true,
  showGroupLabels: true,
  showGroupDescriptions: false,
  showSectionInfo: true,
  validateOnChange: false,
  validateOnBlur: true,
  validateOnSubmit: true,
  // Expanded feature toggles — all default off; presets opt in.
  wizardMode: false,
  autoSave: false,
  lifecycleAlerts: false,
  showDirty: false,
  customFieldTypes: false,
  asyncEmailCheck: false,
};

const FORM_PLAYGROUND_PRESETS = {
  lead: {
    ...BASE_PRESET,
    label: "Lead Capture",
    description: "A practical lead form with a 2-column layout, core validation, and a simple submit flow.",
    fieldNames: ["name", "email", "status", "category", "amount", "role", "notes"],
  },
  settings: {
    ...BASE_PRESET,
    label: "Settings",
    description: "Denser settings-style form with responsive auto-grid layout, toggles, multi-select industries, and save-style actions.",
    fieldNames: ["status", "industries", "meetingTime", "notify", "marketingOptIn", "channels", "notes"],
    layoutMode: "autoGrid",
    submitVariant: "secondary",
    submitLabelStyle: "save",
    showCancel: true,
    showRequiredIndicator: false,
    validateOnChange: true,
  },
  dependent: {
    ...BASE_PRESET,
    label: "Dependent + Sections",
    description: "Pipeline form with explicit row layout, accordion sections, and cascading sub-category dependent on segment.",
    fieldNames: ["name", "category", "subCategory", "status", "amount", "role", "notes"],
    layoutMode: "layout",
    submitLabelStyle: "update",
    showCancel: true,
    includeSections: true,
    includeDependentFields: true,
  },
  wizard: {
    ...BASE_PRESET,
    label: "Multi-step Wizard",
    description: "Three-step wizard (Contact → Deal → Preferences) with per-step validation via the steps prop.",
    fieldNames: ["name", "email", "status", "category", "amount", "notify", "marketingOptIn", "channels", "notes"],
    wizardMode: true,
  },
  async: {
    ...BASE_PRESET,
    label: "Async + Lifecycle",
    description: "Async email-uniqueness validation, submit lifecycle alerts, and a star-rating custom field type plugin.",
    fieldNames: ["name", "email", "rating", "status", "amount", "closeDate", "notes"],
    asyncEmailCheck: true,
    lifecycleAlerts: true,
    customFieldTypes: true,
    validateOnChange: true,
  },
  readonly: {
    ...BASE_PRESET,
    label: "Read-only + Auto-save",
    description: "Read-only review mode plus auto-save and dirty tracking. Toggle read-only off in the drawer to edit.",
    fieldNames: ["name", "email", "status", "category", "amount", "closeDate", "notes"],
    readOnly: true,
    autoSave: true,
    showDirty: true,
    submitLabelStyle: "save",
    showCancel: true,
  },
};

const FORM_PLAYGROUND_PRESET_OPTIONS = Object.entries(FORM_PLAYGROUND_PRESETS).map(
  ([value, preset]) => ({
    label: preset.label,
    value,
  })
);

const FORM_PLAYGROUND_FIELD_OPTIONS = [
  { label: "Company name (text)",                  value: "name" },
  { label: "Contact email (text + validate)",      value: "email" },
  { label: "Status (select)",                      value: "status" },
  { label: "Segment (select)",                     value: "category" },
  { label: "Sub-category (dependent select)",      value: "subCategory" },
  { label: "Amount (currency)",                    value: "amount" },
  { label: "Close date (date)",                    value: "closeDate" },
  { label: "First contact (datetime)",             value: "firstContact" },
  { label: "Role (radioGroup)",                    value: "role" },
  { label: "Priority (radioButtonList)",           value: "priority" },
  { label: "Industries (multiSelect)",             value: "industries" },
  { label: "Notifications (toggle)",               value: "notify" },
  { label: "Marketing opt-in (checkbox)",          value: "marketingOptIn" },
  { label: "Meeting time (time)",                  value: "meetingTime" },
  { label: "Channels (checkboxGroup)",             value: "channels" },
  { label: "Rating (custom field)",                value: "rating" },
  { label: "Notes (textarea)",                     value: "notes" },
];

const FORM_PLAYGROUND_LAYOUT_OPTIONS = [
  { label: "Columns", value: "columns" },
  { label: "Auto-grid", value: "autoGrid" },
  { label: "Explicit layout", value: "layout" },
];

const FORM_PLAYGROUND_SUBMIT_POSITION_OPTIONS = [
  { label: "Bottom actions", value: "bottom" },
  { label: "External buttons", value: "none" },
];

const FORM_PLAYGROUND_SUBMIT_VARIANT_OPTIONS = [
  { label: "Primary", value: "primary" },
  { label: "Secondary", value: "secondary" },
  { label: "Destructive", value: "destructive" },
];

const FORM_PLAYGROUND_SUBMIT_LABEL_OPTIONS = [
  { label: "Create deal", value: "create" },
  { label: "Save settings", value: "save" },
  { label: "Update record", value: "update" },
];

const FORM_PLAYGROUND_BEHAVIOR_OPTIONS = [
  { label: "Show cancel", value: "showCancel" },
  { label: "Read-only", value: "readOnly" },
  { label: "Accordion sections", value: "includeSections" },
  { label: "Dependent fields", value: "includeDependentFields" },
  { label: "Inline alerts", value: "showInlineAlerts" },
  { label: "Required indicators", value: "showRequiredIndicator" },
  { label: "Group labels",        value: "showGroupLabels" },
  { label: "Group descriptions",  value: "showGroupDescriptions" },
  { label: "Section info icons",  value: "showSectionInfo" },
];

// Field-level group names used by fieldMap above — used by the "Group labels"
// toggle to hide every group header at once when the flag is off.
const FORM_PLAYGROUND_GROUP_NAMES = ["contact", "deal", "preferences"];

// Short microcopy shown beneath each group label when "Group descriptions" is
// on, driven by the native groups[name].description option (added in the form
// package alongside label / showLabel / showDivider / renderHeader).
const FORM_PLAYGROUND_GROUP_DESCRIPTIONS = {
  contact:     "Primary buyer details — who the deal is with.",
  deal:        "Pipeline and segment metadata.",
  preferences: "Communication, follow-up, and notification preferences.",
};

const FORM_PLAYGROUND_VALIDATION_OPTIONS = [
  { label: "Validate on change", value: "validateOnChange" },
  { label: "Validate on blur", value: "validateOnBlur" },
  { label: "Validate on submit", value: "validateOnSubmit" },
];

const FORM_PLAYGROUND_EXTRAS_OPTIONS = [
  { label: "Multi-step wizard",                    value: "wizardMode" },
  { label: "Auto-save (debounced)",                value: "autoSave" },
  { label: "Submit lifecycle alerts",              value: "lifecycleAlerts" },
  { label: "Show dirty-tracking indicator",        value: "showDirty" },
  { label: "Register custom field types",          value: "customFieldTypes" },
  { label: "Async email uniqueness check",         value: "asyncEmailCheck" },
];

const createFormPlaygroundState = (presetId = "lead") => ({
  presetId,
  ...FORM_PLAYGROUND_PRESETS[presetId],
});

const buildFormPlaygroundFields = (controls) => {
  const fieldMap = {
    name: {
      name: "name",
      type: "text",
      label: "Company Name",
      required: true,
      placeholder: "Enter company name",
      group: "contact",
    },
    email: {
      name: "email",
      type: "text",
      label: "Contact Email",
      required: true,
      placeholder: "name@company.com",
      group: "contact",
      validate: (value) => (value && value.includes("@")) || "Enter a valid email address",
    },
    status: {
      name: "status",
      type: "select",
      label: "Status",
      options: STATUS_OPTIONS,
      group: "deal",
    },
    category: {
      name: "category",
      type: "select",
      label: "Segment",
      options: CATEGORY_OPTIONS,
      group: "deal",
    },
    subCategory: {
      name: "subCategory",
      type: "select",
      label: "Sub-Category",
      group: "deal",
      dependsOnConfig: { field: "category" },
      visible: (values) => controls.includeDependentFields && !!values.category,
      options: (values) => SUB_CATEGORIES[values.category] || [],
    },
    amount: {
      name: "amount",
      type: "currency",
      label: "Deal Amount",
      currency: "USD",
      min: 0,
      placeholder: "0",
      group: "deal",
    },
    role: {
      name: "role",
      type: "radioGroup",
      label: "Contact Role",
      options: ROLE_OPTIONS.slice(0, 3),
      group: "contact",
    },
    notify: {
      name: "notify",
      type: "toggle",
      label: "Notifications",
      group: "preferences",
    },
    meetingTime: {
      name: "meetingTime",
      type: "time",
      label: "Meeting Time",
      interval: 15,
      group: "preferences",
    },
    channels: {
      name: "channels",
      type: "checkboxGroup",
      label: "Preferred Channels",
      inline: true,
      colSpan: "full",
      group: "preferences",
      options: [
        { label: "Email", value: "email" },
        { label: "Phone", value: "phone" },
        { label: "Chat", value: "chat" },
      ],
    },
    closeDate: {
      name: "closeDate",
      type: "date",
      label: "Close date",
      group: "deal",
    },
    firstContact: {
      name: "firstContact",
      type: "dateTime",
      label: "First contact",
      group: "deal",
    },
    priority: {
      name: "priority",
      type: "radioButtonList",
      label: "Priority",
      options: [
        { label: "Low",    value: "low" },
        { label: "Normal", value: "normal" },
        { label: "High",   value: "high" },
      ],
      group: "deal",
    },
    industries: {
      name: "industries",
      type: "multiSelect",
      label: "Industries",
      options: INDUSTRY_OPTIONS,
      group: "preferences",
    },
    marketingOptIn: {
      name: "marketingOptIn",
      type: "checkbox",
      label: "Opt in to marketing emails",
      group: "preferences",
    },
    rating: {
      name: "rating",
      type: "rating",
      label: "Qualification score",
      group: "deal",
      description: "Custom field type registered via fieldTypes={{ rating }}",
    },
    notes: {
      name: "notes",
      type: "textarea",
      label: "Notes",
      rows: 3,
      colSpan: 2,
      placeholder: "Any additional context...",
      group: "preferences",
    },
  };

  // Async email uniqueness check — applied on the email field when enabled.
  // Simulated via setTimeout so validation lifecycle UI (loading / error) is
  // visible in the preview.
  if (controls.asyncEmailCheck && fieldMap.email) {
    fieldMap.email = {
      ...fieldMap.email,
      asyncValidate: (value) =>
        new Promise((resolve) => {
          setTimeout(() => {
            if (!value) return resolve(true);
            if (TAKEN_EMAILS.has(value.toLowerCase())) {
              resolve("That email is already taken");
            } else {
              resolve(true);
            }
          }, 600);
        }),
    };
  }

  const selected = new Set(controls.fieldNames);
  return FORM_PLAYGROUND_FIELD_OPTIONS.map((option) => option.value)
    .filter((name) => selected.has(name))
    .map((name) => fieldMap[name])
    .filter(Boolean);
};

const TAKEN_EMAILS = new Set([
  "alex@example.com",
  "taken@hs-uix.dev",
  "admin@hubspot.com",
]);

const buildFormExplicitLayout = (fieldNames) => {
  const rows = [
    ["name", "email"],
    ["status", "category"],
    ["subCategory", "amount"],
    ["closeDate", "firstContact"],
    ["role", "priority"],
    ["industries"],
    ["meetingTime", "rating"],
    ["notify", "marketingOptIn", "channels"],
    ["notes"],
  ];
  const selected = new Set(fieldNames);

  return rows
    .map((row) => row.filter((field) => selected.has(field)))
    .filter((row) => row.length > 0);
};

const buildFormSections = (fieldNames) => {
  const selected = new Set(fieldNames);
  const sections = [
    {
      id: "contact",
      label: "Contact",
      info: "Primary buyer details",
      fields: ["name", "email", "role", "priority"].filter((field) => selected.has(field)),
      defaultOpen: true,
    },
    {
      id: "deal",
      label: "Deal context",
      info: "Pipeline and segment metadata",
      fields: ["status", "category", "subCategory", "amount", "closeDate", "firstContact", "rating"].filter((field) => selected.has(field)),
      defaultOpen: true,
    },
    {
      id: "preferences",
      label: "Preferences",
      info: "Communication and follow-up fields",
      fields: ["notify", "marketingOptIn", "industries", "meetingTime", "channels", "notes"].filter((field) => selected.has(field)),
      defaultOpen: false,
    },
  ];

  return sections.filter((section) => section.fields.length > 0);
};

// Wizard step grouping for the Multi-step preset. Only includes fields that
// are actually selected in `controls.fieldNames` — empty steps are dropped so
// a user can trim a step out via the Visible fields picker.
const buildFormSteps = (fieldNames) => {
  const selected = new Set(fieldNames);
  const steps = [
    {
      title: "Contact",
      description: "Who is the deal with?",
      fields: ["name", "email"].filter((f) => selected.has(f)),
      validate: (values) => {
        const errors = {};
        if (selected.has("name") && !values.name) errors.name = "Name is required";
        if (selected.has("email") && !values.email) errors.email = "Email is required";
        return Object.keys(errors).length === 0 ? true : errors;
      },
    },
    {
      title: "Deal",
      description: "Deal metadata and value",
      fields: ["status", "category", "subCategory", "amount", "closeDate", "role", "priority", "rating"].filter((f) => selected.has(f)),
    },
    {
      title: "Preferences",
      description: "Communication + follow-up",
      fields: ["notify", "marketingOptIn", "industries", "meetingTime", "channels", "notes"].filter((f) => selected.has(f)),
    },
  ];
  return steps.filter((step) => step.fields.length > 0);
};

const getSubmitLabel = (style) => {
  if (style === "save") return "Save settings";
  if (style === "update") return "Update record";
  return "Create deal";
};

// Minimal star-rating custom field — demonstrates the fieldTypes={{ rating }}
// plugin registry. Not storybook-worthy on its own but shows the hook.
const StarRating = ({ value, onChange, readOnly }) => {
  const current = Number(value) || 0;
  return (
    <Flex direction="row" gap="xs">
      {[1, 2, 3, 4, 5].map((n) => (
        <Button
          key={n}
          variant={n <= current ? "primary" : "secondary"}
          disabled={readOnly}
          onClick={() => onChange?.(n)}
        >
          {n <= current ? "★" : "☆"}
        </Button>
      ))}
    </Flex>
  );
};

const CUSTOM_FIELD_TYPES = {
  rating: {
    render: ({ value, setValue, field, readOnly }) => (
      <Flex direction="column" gap="xs">
        {field.label && (
          <Text format={{ fontWeight: "demibold" }}>{field.label}</Text>
        )}
        {field.description && (
          <Text variant="microcopy">{field.description}</Text>
        )}
        <StarRating value={value} onChange={setValue} readOnly={readOnly} />
      </Flex>
    ),
  },
};

export const FormBuilderPlaygroundDemo = ({ actions: alertActions }) => {
  const [controls, setControls] = useState(() => createFormPlaygroundState());
  const [result, setResult] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState(null); // {at: Date, count: number}
  const formRef = useRef(null);

  const addAlert = alertActions?.addAlert || (() => {});

  const fields = useMemo(() => buildFormPlaygroundFields(controls), [controls]);
  const explicitLayout = useMemo(
    () => buildFormExplicitLayout(controls.fieldNames),
    [controls.fieldNames]
  );
  const sections = useMemo(() => {
    const built = buildFormSections(controls.fieldNames);
    if (controls.showSectionInfo) return built;
    return built.map(({ info, ...rest }) => rest);
  }, [controls.fieldNames, controls.showSectionInfo]);
  const steps = useMemo(
    () => buildFormSteps(controls.fieldNames),
    [controls.fieldNames]
  );
  const behaviorValues = useMemo(
    () =>
      FORM_PLAYGROUND_BEHAVIOR_OPTIONS.filter((option) => controls[option.value]).map(
        (option) => option.value
      ),
    [controls]
  );
  const validationValues = useMemo(
    () =>
      FORM_PLAYGROUND_VALIDATION_OPTIONS.filter((option) => controls[option.value]).map(
        (option) => option.value
      ),
    [controls]
  );
  const extrasValues = useMemo(
    () =>
      FORM_PLAYGROUND_EXTRAS_OPTIONS.filter((option) => controls[option.value]).map(
        (option) => option.value
      ),
    [controls]
  );

  const applyPreset = useCallback((presetId) => {
    setControls(createFormPlaygroundState(presetId));
    setResult(null);
    setIsDirty(false);
    setAutoSaveStatus(null);
  }, []);

  const updateControls = useCallback((key, value) => {
    setControls((current) => ({ ...current, [key]: value }));
  }, []);

  const handleFieldSetChange = useCallback(
    (nextFields) => {
      if (!nextFields.length) return;
      const nextSet = new Set(nextFields);
      const orderedFields = FORM_PLAYGROUND_FIELD_OPTIONS.map((option) => option.value).filter(
        (value) => nextSet.has(value)
      );
      updateControls("fieldNames", orderedFields);
    },
    [updateControls]
  );

  const makeOptionHandler = (options) =>
    (values) => {
      const selected = new Set(values);
      options.forEach((option) => {
        const nextValue = selected.has(option.value);
        if (controls[option.value] !== nextValue) {
          updateControls(option.value, nextValue);
        }
      });
    };

  const handleBehaviorChange   = useCallback(makeOptionHandler(FORM_PLAYGROUND_BEHAVIOR_OPTIONS),   [controls, updateControls]);
  const handleValidationChange = useCallback(makeOptionHandler(FORM_PLAYGROUND_VALIDATION_OPTIONS), [controls, updateControls]);
  const handleExtrasChange     = useCallback(makeOptionHandler(FORM_PLAYGROUND_EXTRAS_OPTIONS),     [controls, updateControls]);

  const formProps =
    controls.layoutMode === "autoGrid"
      ? { columnWidth: controls.columnWidth, maxColumns: controls.maxColumns }
      : controls.layoutMode === "layout"
        ? { layout: explicitLayout }
        : { columns: controls.columns };

  // ---- Lifecycle / auto-save / ref-api handlers --------------------------

  const handleSubmit = useCallback((values) => {
    setResult(JSON.stringify(values, null, 2));
    // Simulate a tiny async so onSubmitSuccess/Error chain fires visibly.
    return new Promise((resolve) => setTimeout(resolve, 400));
  }, []);

  const handleSubmitSuccess = useCallback(() => {
    if (!controls.lifecycleAlerts) return;
    addAlert({ type: "success", title: "Submit success", message: "onSubmitSuccess fired after the async submit handler resolved." });
  }, [controls.lifecycleAlerts, addAlert]);

  const handleSubmitError = useCallback((error) => {
    if (!controls.lifecycleAlerts) return;
    addAlert({ type: "danger", title: "Submit error", message: String(error?.message || error) });
  }, [controls.lifecycleAlerts, addAlert]);

  const handleAutoSave = useCallback((values) => {
    setAutoSaveStatus((prev) => ({
      at: new Date(),
      count: (prev?.count || 0) + 1,
      snapshot: values,
    }));
  }, []);

  const runRefAction = useCallback((action) => {
    const ref = formRef.current;
    if (!ref) return;
    switch (action) {
      case "submit":
        ref.submit();
        break;
      case "reset":
        ref.reset();
        setResult(null);
        setIsDirty(false);
        setAutoSaveStatus(null);
        break;
      case "validate": {
        const out = ref.validate();
        addAlert({
          type: out.valid ? "success" : "danger",
          title: out.valid ? "Form is valid" : "Validation errors",
          message: out.valid
            ? "FormBuilderRef.validate() returned { valid: true }."
            : Object.entries(out.errors).map(([k, v]) => `${k}: ${v}`).join(", "),
        });
        break;
      }
      case "getValues":
        addAlert({
          type: "info",
          title: "Current values",
          message: JSON.stringify(ref.getValues()),
        });
        break;
      default:
        break;
    }
  }, [addAlert]);

  const controlsOverlay = useMemo(() => (
    <Panel id="form-playground-controls" title="Customize form" width="sm">
      <PanelBody>
        <PanelSection>
          <Flex direction="column" gap="sm">
            <Text>
              Start from a preset, then adjust layout, validation, and field composition against the same live form.
            </Text>
            <Select
              label="Preset"
              name="form-playground-preset-panel"
              value={controls.presetId}
              options={FORM_PLAYGROUND_PRESET_OPTIONS}
              onChange={applyPreset}
            />
          </Flex>
        </PanelSection>
        <PanelSection>
          <Flex direction="column" gap="sm">
            <Text format={{ fontWeight: "demibold" }}>Layout</Text>
            <Select
              label="Layout mode"
              name="form-playground-layout-mode"
              value={controls.layoutMode}
              options={FORM_PLAYGROUND_LAYOUT_OPTIONS}
              onChange={(value) => updateControls("layoutMode", value)}
            />
            {controls.layoutMode === "columns" && (
              <NumberInput
                label="Columns"
                name="form-playground-columns"
                min={1}
                max={3}
                value={controls.columns}
                onChange={(value) => updateControls("columns", value)}
              />
            )}
            {controls.layoutMode === "autoGrid" && (
              <>
                <NumberInput
                  label="Column width"
                  name="form-playground-column-width"
                  min={160}
                  max={320}
                  value={controls.columnWidth}
                  onChange={(value) => updateControls("columnWidth", value)}
                />
                <NumberInput
                  label="Max columns"
                  name="form-playground-max-columns"
                  min={1}
                  max={4}
                  value={controls.maxColumns}
                  onChange={(value) => updateControls("maxColumns", value)}
                />
              </>
            )}
            <MultiSelect
              label="Visible fields"
              name="form-playground-visible-fields"
              value={controls.fieldNames}
              options={FORM_PLAYGROUND_FIELD_OPTIONS}
              onChange={handleFieldSetChange}
            />
          </Flex>
        </PanelSection>
        <PanelSection>
          <Flex direction="column" gap="sm">
            <ToggleGroup
              toggleType="checkboxList"
              name="form-playground-behavior"
              label="Behavior"
              value={behaviorValues}
              options={FORM_PLAYGROUND_BEHAVIOR_OPTIONS}
              onChange={handleBehaviorChange}
            />
            <ToggleGroup
              toggleType="checkboxList"
              name="form-playground-validation"
              label="Validation timing"
              value={validationValues}
              options={FORM_PLAYGROUND_VALIDATION_OPTIONS}
              onChange={handleValidationChange}
            />
            <ToggleGroup
              toggleType="checkboxList"
              name="form-playground-extras"
              label="Extras (wizard / auto-save / lifecycle / custom / async)"
              value={extrasValues}
              options={FORM_PLAYGROUND_EXTRAS_OPTIONS}
              onChange={handleExtrasChange}
            />
          </Flex>
        </PanelSection>
        <PanelSection>
          <Flex direction="column" gap="sm">
            <Text format={{ fontWeight: "demibold" }}>Actions</Text>
            <Select
              label="Submit position"
              name="form-playground-submit-position"
              value={controls.submitPosition}
              options={FORM_PLAYGROUND_SUBMIT_POSITION_OPTIONS}
              onChange={(value) => updateControls("submitPosition", value)}
            />
            <Select
              label="Submit variant"
              name="form-playground-submit-variant"
              value={controls.submitVariant}
              options={FORM_PLAYGROUND_SUBMIT_VARIANT_OPTIONS}
              onChange={(value) => updateControls("submitVariant", value)}
            />
            <Select
              label="Submit label"
              name="form-playground-submit-label"
              value={controls.submitLabelStyle}
              options={FORM_PLAYGROUND_SUBMIT_LABEL_OPTIONS}
              onChange={(value) => updateControls("submitLabelStyle", value)}
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
    handleFieldSetChange,
    handleBehaviorChange,
    handleValidationChange,
    handleExtrasChange,
    behaviorValues,
    validationValues,
    extrasValues,
  ]);

  const customizeButton = useMemo(() => (
    <Button variant="secondary" overlay={controlsOverlay}>
      Customize
    </Button>
  ), [controlsOverlay]);

  useDemoHeaderSlot(customizeButton);

  return (
    <Flex direction="column" gap="sm">
      {(controls.showDirty || controls.autoSave) && (
        <Flex direction="row" gap="sm" align="center" wrap="wrap">
          {controls.showDirty && (
            <Tag variant={isDirty ? "warning" : "default"}>
              {isDirty ? "Dirty (unsaved changes)" : "Clean"}
            </Tag>
          )}
          {controls.autoSave && autoSaveStatus && (
            <Text variant="microcopy">
              {`Auto-saved ${autoSaveStatus.count} time(s). Last: ${autoSaveStatus.at.toLocaleTimeString()}`}
            </Text>
          )}
        </Flex>
      )}

      <FormBuilder
        ref={formRef}
        fields={fields}
        initialValues={{
          status: "active",
          category: "enterprise",
          notify: true,
          channels: ["email"],
        }}
        onSubmit={handleSubmit}
        onSubmitSuccess={handleSubmitSuccess}
        onSubmitError={handleSubmitError}
        onDirtyChange={setIsDirty}
        labels={{ submit: getSubmitLabel(controls.submitLabelStyle), cancel: "Discard" }}
        submitVariant={controls.submitVariant}
        submitPosition={controls.submitPosition}
        showCancel={controls.showCancel}
        onCancel={() => formRef.current?.reset()}
        readOnly={controls.readOnly}
        readOnlyMessage="This preview is locked. Disable read-only in the customization panel to edit fields."
        showInlineAlerts={controls.showInlineAlerts}
        showRequiredIndicator={controls.showRequiredIndicator}
        validateOnChange={controls.validateOnChange}
        validateOnBlur={controls.validateOnBlur}
        validateOnSubmit={controls.validateOnSubmit}
        sections={controls.includeSections ? sections : undefined}
        groups={
          !controls.showGroupLabels || controls.showGroupDescriptions
            ? Object.fromEntries(
                FORM_PLAYGROUND_GROUP_NAMES.map((name) => {
                  const opts = {};
                  if (!controls.showGroupLabels) opts.showLabel = false;
                  if (controls.showGroupDescriptions)
                    opts.description = FORM_PLAYGROUND_GROUP_DESCRIPTIONS[name];
                  return [name, opts];
                }),
              )
            : undefined
        }
        steps={controls.wizardMode ? steps : undefined}
        showStepIndicator={controls.wizardMode}
        validateStepOnNext={controls.wizardMode}
        autoSave={controls.autoSave ? { debounce: 800, onAutoSave: handleAutoSave } : undefined}
        fieldTypes={controls.customFieldTypes ? CUSTOM_FIELD_TYPES : undefined}
        {...formProps}
      />

      <Flex direction="row" gap="sm" wrap="wrap">
        <Button variant="transparent" onClick={() => runRefAction("validate")}>
          Ref.validate()
        </Button>
        <Button variant="transparent" onClick={() => runRefAction("getValues")}>
          Ref.getValues()
        </Button>
        <Button variant="transparent" onClick={() => runRefAction("reset")}>
          Ref.reset()
        </Button>
        {controls.submitPosition === "none" && (
          <Button
            variant={controls.submitVariant}
            disabled={controls.readOnly}
            onClick={() => runRefAction("submit")}
          >
            Ref.submit()
          </Button>
        )}
      </Flex>

      {result && (
        <Alert title="Submitted values" variant="success">
          {result}
        </Alert>
      )}
    </Flex>
  );
};


// ═══════════════════════════════════════════════════════════════════════════
// Isolated feature demos — one focused card per capability
// ═══════════════════════════════════════════════════════════════════════════

const notify = (actions, message, type = "success", title) =>
  actions?.addAlert?.({ type, title, message });

// alwaysEditable — a field that stays editable even when the form is readOnly
const AlwaysEditableDemo = ({ actions }) => {
  const fields = [
    { name: "company", type: "text", label: "Company", defaultValue: "Acme Corp" },
    { name: "stage", type: "select", label: "Lifecycle stage", defaultValue: "customer", options: STATUS_OPTIONS },
    {
      name: "internalNote",
      type: "textarea",
      label: "Internal note",
      alwaysEditable: true,
      description: "Stays editable even though the form is read-only.",
      placeholder: "Add a note for the account team...",
    },
  ];
  return (
    <Flex direction="column" gap="sm">
      <Text>
        The whole form is readOnly, but the internal note sets{" "}
        alwaysEditable so reps can still annotate the record.
      </Text>
      <FormBuilder
        readOnly
        fields={fields}
        onSubmit={(values) => notify(actions, `Note saved: "${values.internalNote || ""}"`)}
      />
    </Flex>
  );
};

// onValidationFail + openSectionOnValidationFail
const ValidationFailDemo = ({ actions }) => {
  const fields = [
    { name: "firstName", type: "text", label: "First name", required: true },
    { name: "lastName", type: "text", label: "Last name", required: true },
    { name: "email", type: "text", label: "Email", required: true, pattern: /^[^@\s]+@[^@\s]+$/, patternMessage: "Enter a valid email address" },
    { name: "plan", type: "select", label: "Plan", required: true, options: [{ label: "Starter", value: "starter" }, { label: "Pro", value: "pro" }] },
  ];
  const sections = [
    { id: "identity", label: "Identity", fields: ["firstName", "lastName"], defaultOpen: true },
    { id: "account", label: "Account", fields: ["email", "plan"], defaultOpen: false },
  ];
  return (
    <Flex direction="column" gap="sm">
      <Text>
        Collapse the Account section and submit with blanks.{" "}
        onValidationFail raises a toast, and{" "}
        openSectionOnValidationFail auto-opens the section holding the first error.
      </Text>
      <FormBuilder
        fields={fields}
        sections={sections}
        validateOnSubmit
        openSectionOnValidationFail
        onValidationFail={(info) =>
          notify(
            actions,
            `${info.fields.length} field(s) need attention — jumped to "${info.firstInvalidField?.label}".`,
            "warning",
            "Fix required fields"
          )
        }
        onSubmit={() => notify(actions, "Submitted!")}
      />
    </Flex>
  );
};

// submitAlign — action-row alignment for single-step forms
const SUBMIT_ALIGN_OPTIONS = [
  { label: "between (default w/ cancel)", value: "between" },
  { label: "start", value: "start" },
  { label: "end", value: "end" },
];
const SubmitAlignDemo = ({ actions }) => {
  const [align, setAlign] = useState("between");
  const fields = [{ name: "title", type: "text", label: "Deal name", defaultValue: "Q2 Expansion" }];
  return (
    <Flex direction="column" gap="sm">
      <Text>
        submitAlign controls how the Submit/Cancel row is justified. Switch it and watch the footer.
      </Text>
      <Select name="submitAlign" label="submitAlign" value={align} options={SUBMIT_ALIGN_OPTIONS} onChange={setAlign} />
      <FormBuilder
        fields={fields}
        showCancel
        submitAlign={align}
        onCancel={() => notify(actions, "Cancelled", "info")}
        onSubmit={() => notify(actions, "Submitted")}
      />
    </Flex>
  );
};

// Repeater fields — add / remove / reorder line items
const RepeaterDemo = ({ actions }) => {
  const fields = [
    { name: "poNumber", type: "text", label: "PO number", defaultValue: "PO-1042" },
    {
      name: "lineItems",
      type: "repeater",
      label: "Line items",
      repeaterProps: {
        reorderable: true,
        addLabel: "Add line item",
        renderMoveUp: ({ onClick, disabled }) => (
          <Button variant="transparent" disabled={disabled} onClick={onClick}><Icon name="upCarat" /></Button>
        ),
        renderMoveDown: ({ onClick, disabled }) => (
          <Button variant="transparent" disabled={disabled} onClick={onClick}><Icon name="downCarat" /></Button>
        ),
        renderRemove: ({ onClick }) => (
          <Button variant="transparent" onClick={onClick}><Icon name="delete" /></Button>
        ),
      },
      fields: [
        { name: "sku", type: "text", label: "SKU", required: true },
        { name: "qty", type: "number", label: "Qty", defaultValue: 1, min: 1 },
        { name: "unitPrice", type: "currency", label: "Unit price" },
      ],
    },
  ];
  return (
    <Flex direction="column" gap="sm">
      <Text>
        A repeater field with add / remove / reorder. Each row validates its own sub-fields (SKU is required).
      </Text>
      <FormBuilder
        fields={fields}
        initialValues={{ lineItems: [{ sku: "WIDGET-1", qty: 2, unitPrice: 49 }, { sku: "WIDGET-2", qty: 1, unitPrice: 129 }] }}
        onSubmit={(values) => notify(actions, `${values.lineItems?.length || 0} line item(s) submitted`)}
      />
    </Flex>
  );
};

// Multi-step wizard with per-step validation
const WizardDemo = ({ actions }) => {
  const fields = [
    { name: "company", type: "text", label: "Company", required: true },
    { name: "website", type: "text", label: "Website" },
    { name: "contactName", type: "text", label: "Contact name", required: true },
    { name: "contactEmail", type: "text", label: "Email", required: true, pattern: /^[^@\s]+@[^@\s]+$/, patternMessage: "Enter a valid email" },
    { name: "plan", type: "select", label: "Plan", required: true, options: [{ label: "Starter", value: "starter" }, { label: "Pro", value: "pro" }] },
    { name: "seats", type: "stepper", label: "Seats", defaultValue: 5, min: 1 },
  ];
  const steps = [
    { title: "Company", fields: ["company", "website"] },
    { title: "Contact", fields: ["contactName", "contactEmail"] },
    { title: "Plan", fields: ["plan", "seats"] },
  ];
  return (
    <Flex direction="column" gap="sm">
      <Text>
        A multi-step wizard with a step indicator and validateStepOnNext — Next is blocked until the current step's required fields pass.
      </Text>
      <FormBuilder fields={fields} steps={steps} showStepIndicator validateStepOnNext onSubmit={() => notify(actions, "Wizard complete!")} />
    </Flex>
  );
};

// Dependent / cascading fields
const DependentFieldsDemo = ({ actions }) => {
  const fields = [
    { name: "category", type: "select", label: "Account category", options: CATEGORY_OPTIONS, defaultValue: "enterprise" },
    {
      name: "segment",
      type: "select",
      label: "Segment",
      dependsOnConfig: { field: "category", display: "grouped", label: "Segment", message: (parent) => `Pick a ${parent} segment` },
      options: (values) => SUB_CATEGORIES[values.category] || [],
    },
  ];
  return (
    <Flex direction="column" gap="sm">
      <Text>
        Segment options are derived from the selected Category via options(values) +{" "}
        dependsOnConfig. Switching Category auto-clears a now-invalid Segment.
      </Text>
      <FormBuilder fields={fields} onSubmit={(values) => notify(actions, `Saved: ${values.category} / ${values.segment || "—"}`)} />
    </Flex>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Demo registry entries
// ═══════════════════════════════════════════════════════════════════════════

const FB_GITHUB = `${GITHUB_BASE_URL}/form`;

export const FORM_DEMOS = [
  {
    id: "fb-playground",
    name: "Interactive Form Playground",
    description: "Storybook-style FormBuilder preview with 6 presets (Lead / Settings / Dependent+Sections / Multi-step Wizard / Async+Lifecycle / Read-only+Auto-save), a drawer of live controls for layout / validation / behavior / extras, and a Ref API action row.",
    package: "form",
    Component: FormBuilderPlaygroundDemo,
    githubUrl: FB_GITHUB,
    sourceCode: `// Interactive FormBuilder Playground
// 6 presets + a drawer-backed control surface exposing layout mode, validation
// timing, behavior flags, extras (wizard, auto-save, lifecycle alerts, dirty
// tracking, custom field types, async email check), and a Ref API action row.
// Package: hs-uix/form
//
// The "Customize" button is registered into the shared DemoDetail header slot
// (see useDemoHeaderSlot in ./demoHeader.jsx) so it sits alongside View code /
// Copy code.

import { Button, Flex, Panel, PanelBody, PanelSection, Select, Tag, ToggleGroup } from "@hubspot/ui-extensions";
import { FormBuilder } from "hs-uix/form";
import { useDemoHeaderSlot } from "./demoHeader.jsx";

const [controls, setControls] = useState(createFormPlaygroundState("lead"));
const [isDirty, setIsDirty] = useState(false);
const [autoSaveStatus, setAutoSaveStatus] = useState(null);

const controlsOverlay = useMemo(() => (
  <Panel id="form-playground-controls" title="Customize form" width="sm">
    <PanelBody>
      <PanelSection>
        <Select label="Preset" value={controls.presetId} options={FORM_PLAYGROUND_PRESET_OPTIONS} onChange={applyPreset} />
      </PanelSection>
      <PanelSection>
        <Select label="Layout mode" value={controls.layoutMode} options={FORM_PLAYGROUND_LAYOUT_OPTIONS} onChange={(v) => updateControls("layoutMode", v)} />
        <MultiSelect label="Visible fields" value={controls.fieldNames} options={FORM_PLAYGROUND_FIELD_OPTIONS} onChange={handleFieldSetChange} />
      </PanelSection>
      <PanelSection>
        <ToggleGroup toggleType="checkboxList" label="Behavior"   value={behaviorValues}   options={FORM_PLAYGROUND_BEHAVIOR_OPTIONS}   onChange={handleBehaviorChange} />
        <ToggleGroup toggleType="checkboxList" label="Validation" value={validationValues} options={FORM_PLAYGROUND_VALIDATION_OPTIONS} onChange={handleValidationChange} />
        <ToggleGroup toggleType="checkboxList" label="Extras"     value={extrasValues}     options={FORM_PLAYGROUND_EXTRAS_OPTIONS}     onChange={handleExtrasChange} />
      </PanelSection>
    </PanelBody>
  </Panel>
), [controls, applyPreset, updateControls, handleFieldSetChange, handleBehaviorChange, handleValidationChange, handleExtrasChange, behaviorValues, validationValues, extrasValues]);

useDemoHeaderSlot(useMemo(
  () => <Button variant="secondary" overlay={controlsOverlay}>Customize</Button>,
  [controlsOverlay],
));

<FormBuilder
  fields={buildFormPlaygroundFields(controls)}
  sections={controls.includeSections ? buildFormSections(controls.fieldNames) : undefined}
  steps={controls.wizardMode ? buildFormSteps(controls.fieldNames) : undefined}
  autoSave={controls.autoSave ? { debounce: 800, onAutoSave: handleAutoSave } : undefined}
  fieldTypes={controls.customFieldTypes ? CUSTOM_FIELD_TYPES : undefined}
  onSubmit={handleSubmit}
  onSubmitSuccess={handleSubmitSuccess}
  onSubmitError={handleSubmitError}
  onDirtyChange={setIsDirty}
  validateOnChange={controls.validateOnChange}
  validateOnBlur={controls.validateOnBlur}
  validateOnSubmit={controls.validateOnSubmit}
  readOnly={controls.readOnly}
/>`,
  },
  {
    id: "fb-always-editable",
    name: "alwaysEditable field",
    description: "A read-only form with one field that opts out via alwaysEditable — e.g. an internal note reps can always update.",
    package: "form",
    Component: AlwaysEditableDemo,
    githubUrl: FB_GITHUB,
    sourceCode: `import { FormBuilder } from "hs-uix/form";

<FormBuilder
  readOnly
  fields={[
    { name: "company", type: "text", label: "Company" },
    { name: "stage", type: "select", label: "Lifecycle stage", options },
    // Stays editable even though the form is readOnly:
    { name: "internalNote", type: "textarea", label: "Internal note", alwaysEditable: true },
  ]}
  onSubmit={(values) => save(values)}
/>`,
  },
  {
    id: "fb-validation-fail",
    name: "onValidationFail + auto-open section",
    description: "Surface submit-time validation with your own toast, and auto-open the accordion section holding the first invalid field.",
    package: "form",
    Component: ValidationFailDemo,
    githubUrl: FB_GITHUB,
    sourceCode: `import { FormBuilder } from "hs-uix/form";

<FormBuilder
  fields={fields}
  sections={[
    { id: "identity", label: "Identity", fields: ["firstName", "lastName"], defaultOpen: true },
    { id: "account", label: "Account", fields: ["email", "plan"], defaultOpen: false },
  ]}
  validateOnSubmit
  openSectionOnValidationFail
  onValidationFail={(info) =>
    addAlert({
      type: "warning",
      title: "Fix required fields",
      message: \`\${info.fields.length} field(s) need attention — jumped to "\${info.firstInvalidField?.label}".\`,
    })
  }
  onSubmit={submit}
/>`,
  },
  {
    id: "fb-submit-align",
    name: "submitAlign",
    description: "Control how the single-step Submit/Cancel action row is justified: start, end, or between.",
    package: "form",
    Component: SubmitAlignDemo,
    githubUrl: FB_GITHUB,
    sourceCode: `import { FormBuilder } from "hs-uix/form";

// submitAlign: "start" | "end" | "between"
// Defaults to "between" when showCancel is true, else "start".
<FormBuilder
  fields={fields}
  showCancel
  submitAlign="end"
  onCancel={cancel}
  onSubmit={submit}
/>`,
  },
  {
    id: "fb-repeater",
    name: "Repeater fields",
    description: "A dynamic array of rows with add / remove / reorder and per-row sub-field validation.",
    package: "form",
    Component: RepeaterDemo,
    githubUrl: FB_GITHUB,
    sourceCode: `import { FormBuilder } from "hs-uix/form";

<FormBuilder
  fields={[
    { name: "poNumber", type: "text", label: "PO number" },
    {
      name: "lineItems",
      type: "repeater",
      label: "Line items",
      repeaterProps: {
        reorderable: true,
        addLabel: "Add line item",
        renderMoveUp: ({ onClick, disabled }) => (
          <Button variant="transparent" disabled={disabled} onClick={onClick}><Icon name="upCarat" /></Button>
        ),
        renderMoveDown: ({ onClick, disabled }) => (
          <Button variant="transparent" disabled={disabled} onClick={onClick}><Icon name="downCarat" /></Button>
        ),
        renderRemove: ({ onClick }) => (
          <Button variant="transparent" onClick={onClick}><Icon name="delete" /></Button>
        ),
      },
      fields: [
        { name: "sku", type: "text", label: "SKU", required: true },
        { name: "qty", type: "number", label: "Qty", defaultValue: 1, min: 1 },
        { name: "unitPrice", type: "currency", label: "Unit price" },
      ],
    },
  ]}
  initialValues={{ lineItems: [{ sku: "WIDGET-1", qty: 2, unitPrice: 49 }] }}
  onSubmit={submit}
/>`,
  },
  {
    id: "fb-wizard",
    name: "Multi-step wizard",
    description: "A stepped form with a step indicator and per-step validation — Next is gated on the current step's required fields.",
    package: "form",
    Component: WizardDemo,
    githubUrl: FB_GITHUB,
    sourceCode: `import { FormBuilder } from "hs-uix/form";

<FormBuilder
  fields={fields}
  steps={[
    { title: "Company", fields: ["company", "website"] },
    { title: "Contact", fields: ["contactName", "contactEmail"] },
    { title: "Plan", fields: ["plan", "seats"] },
  ]}
  showStepIndicator
  validateStepOnNext
  onSubmit={submit}
/>`,
  },
  {
    id: "fb-dependent",
    name: "Dependent / cascading fields",
    description: "A child select whose options are computed from a parent field; changing the parent auto-clears an invalid child value.",
    package: "form",
    Component: DependentFieldsDemo,
    githubUrl: FB_GITHUB,
    sourceCode: `import { FormBuilder } from "hs-uix/form";

const SUB_CATEGORIES = { enterprise: [...], "mid-market": [...], smb: [...] };

<FormBuilder
  fields={[
    { name: "category", type: "select", label: "Account category", options: CATEGORY_OPTIONS },
    {
      name: "segment",
      type: "select",
      label: "Segment",
      dependsOnConfig: { field: "category", display: "grouped", message: (p) => \`Pick a \${p} segment\` },
      options: (values) => SUB_CATEGORIES[values.category] || [],
    },
  ]}
  onSubmit={submit}
/>`,
  },
];
