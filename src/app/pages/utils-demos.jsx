import React, { useMemo, useState } from "react";
import {
  DescriptionList,
  DescriptionListItem,
  Divider,
  Flex,
  NumberInput,
  Select,
  Text,
  Input,
  Tile,
} from "@hubspot/ui-extensions";
import { AutoStatusTag, AutoTag } from "hs-uix/common-components";
import {
  buildOptions,
  findOptionLabel,
  formatCurrency,
  formatCurrencyCompact,
  formatDate,
  formatDateTime,
  formatPercentage,
  getAutoStatusTagVariant,
  getAutoTagVariant,
  sumBy,
} from "hs-uix/utils";

const UTILS_DOCS =
  "https://github.com/05bmckay/hs-uix/blob/main/src/utils/README.md";

// ═══════════════════════════════════════════════════════════════════════════
// Formatters demo — live input → every formatter's output
// ═══════════════════════════════════════════════════════════════════════════

const CURRENCIES = [
  { label: "USD ($)", value: "USD" },
  { label: "EUR (€)", value: "EUR" },
  { label: "GBP (£)", value: "GBP" },
  { label: "JPY (¥)", value: "JPY" },
];

const FormattersDemo = () => {
  const [amount, setAmount] = useState(1234567.89);
  const [currency, setCurrency] = useState("USD");
  const [ratio, setRatio] = useState(0.1567);
  const [dateStr, setDateStr] = useState("2026-04-15T14:30:00Z");

  const parsedDate = useMemo(() => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return Number.isNaN(d.getTime()) ? null : d;
  }, [dateStr]);

  return (
    <Flex direction="column" gap="md">
      <Tile>
        <Flex direction="column" gap="sm">
          <Text format={{ fontWeight: "demibold" }}>Controls</Text>
          <Flex direction="row" gap="md" wrap="wrap">
            <NumberInput
              label="Amount"
              value={amount}
              onChange={setAmount}
              min={0}
            />
            <Select
              label="Currency"
              options={CURRENCIES}
              value={currency}
              onChange={setCurrency}
            />
            <NumberInput
              label="Ratio (0–1)"
              value={ratio}
              onChange={setRatio}
              min={0}
              max={1}
              step={0.01}
            />
            <Input
              label="Date (ISO / Date-parseable)"
              value={dateStr}
              onChange={setDateStr}
            />
          </Flex>
        </Flex>
      </Tile>

      <Tile>
        <Flex direction="column" gap="xs">
          <Text format={{ fontWeight: "demibold" }}>Currency</Text>
          <DescriptionList direction="row">
            <DescriptionListItem label="formatCurrency(value)">
              {formatCurrency(amount, { currency })}
            </DescriptionListItem>
            <DescriptionListItem label="formatCurrency(value, { maximumFractionDigits: 2 })">
              {formatCurrency(amount, { currency, maximumFractionDigits: 2 })}
            </DescriptionListItem>
            <DescriptionListItem label="formatCurrencyCompact(value)">
              {formatCurrencyCompact(amount, { currency })}
            </DescriptionListItem>
            <DescriptionListItem label='formatCurrencyCompact(value, { compactDisplay: "long" })'>
              {formatCurrencyCompact(amount, { currency, compactDisplay: "long" })}
            </DescriptionListItem>
            <DescriptionListItem label="formatCurrency(null) — null-safe">
              {formatCurrency(null, { currency })}
            </DescriptionListItem>
          </DescriptionList>
        </Flex>
      </Tile>

      <Tile>
        <Flex direction="column" gap="xs">
          <Text format={{ fontWeight: "demibold" }}>Date & time</Text>
          <DescriptionList direction="row">
            <DescriptionListItem label="formatDate(value)">
              {formatDate(parsedDate) || "—"}
            </DescriptionListItem>
            <DescriptionListItem label='formatDate(value, { month: "numeric" })'>
              {formatDate(parsedDate, { month: "numeric" }) || "—"}
            </DescriptionListItem>
            <DescriptionListItem label="formatDateTime(value)">
              {formatDateTime(parsedDate) || "—"}
            </DescriptionListItem>
            <DescriptionListItem label='formatDate(null) — null-safe → ""'>
              {formatDate(null) || "(empty string)"}
            </DescriptionListItem>
          </DescriptionList>
        </Flex>
      </Tile>

      <Tile>
        <Flex direction="column" gap="xs">
          <Text format={{ fontWeight: "demibold" }}>Percentage (takes a ratio)</Text>
          <DescriptionList direction="row">
            <DescriptionListItem label="formatPercentage(ratio)">
              {formatPercentage(ratio)}
            </DescriptionListItem>
            <DescriptionListItem label="formatPercentage(ratio, { maximumFractionDigits: 1 })">
              {formatPercentage(ratio, { maximumFractionDigits: 1 })}
            </DescriptionListItem>
            <DescriptionListItem label="formatPercentage(ratio, { maximumFractionDigits: 2 })">
              {formatPercentage(ratio, { maximumFractionDigits: 2 })}
            </DescriptionListItem>
          </DescriptionList>
        </Flex>
      </Tile>
    </Flex>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Options demo — buildOptions + findOptionLabel
// ═══════════════════════════════════════════════════════════════════════════

const RAW_RECORDS = [
  { id: 101, firstName: "Alex", lastName: "Rivers", email: "alex@example.com" },
  { id: 102, firstName: "Jordan", lastName: "Kim", email: "jordan@example.com" },
  { id: 103, firstName: "Sam", lastName: "Patel", email: "sam@example.com" },
];

const OptionsDemo = () => {
  const simple = useMemo(() => buildOptions(["Draft", "Published", "Archived"]), []);
  const keyed = useMemo(
    () =>
      buildOptions(
        [
          { name: "Acme", id: 1 },
          { name: "Globex", id: 2 },
          { name: "Initech", id: 3 },
        ],
        { labelKey: "name", valueKey: "id" },
      ),
    [],
  );
  const mapped = useMemo(
    () =>
      buildOptions(RAW_RECORDS, {
        mapLabel: (u) => `${u.firstName} ${u.lastName}`,
        mapValue: (u) => u.id,
        mapDescription: (u) => u.email,
      }),
    [],
  );

  const [selected, setSelected] = useState(101);

  return (
    <Flex direction="column" gap="md">
      <Tile>
        <Flex direction="column" gap="xs">
          <Text format={{ fontWeight: "demibold" }}>buildOptions(strings)</Text>
          <Text variant="microcopy">Raw strings → &#123; label, value &#125;.</Text>
          <Text>{JSON.stringify(simple)}</Text>
        </Flex>
      </Tile>

      <Tile>
        <Flex direction="column" gap="xs">
          <Text format={{ fontWeight: "demibold" }}>buildOptions(records, &#123; labelKey, valueKey &#125;)</Text>
          <Text variant="microcopy">
            Pull label/value from named keys — the common case for CRM rows.
          </Text>
          <Text>{JSON.stringify(keyed)}</Text>
        </Flex>
      </Tile>

      <Tile>
        <Flex direction="column" gap="sm">
          <Text format={{ fontWeight: "demibold" }}>buildOptions(records, &#123; mapLabel, mapValue, mapDescription &#125;)</Text>
          <Text variant="microcopy">
            Custom accessors — full name, id, secondary description.
          </Text>
          <Select
            label="Assignee"
            options={mapped}
            value={selected}
            onChange={setSelected}
          />
          <Divider />
          <Text format={{ fontWeight: "demibold" }}>findOptionLabel(options, value)</Text>
          <DescriptionList direction="row">
            <DescriptionListItem label="Selected value">
              {String(selected)}
            </DescriptionListItem>
            <DescriptionListItem label='findOptionLabel(options, value, "—")'>
              {findOptionLabel(mapped, selected, "—")}
            </DescriptionListItem>
          </DescriptionList>
        </Flex>
      </Tile>
    </Flex>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Tag variants demo — input → variant mapping
// ═══════════════════════════════════════════════════════════════════════════

const VARIANT_SAMPLES = [
  "Active",
  "Running",
  "Completed",
  "Success",
  "In Progress",
  "Pending",
  "At Risk",
  "Warning",
  "on-hold",
  "Failed",
  "error",
  "Cancelled",
  "New",
  "Scheduled",
  "info",
  "Draft",
  "Wibble",
  "Xylophone",
];

const TagVariantsDemo = () => {
  const [input, setInput] = useState("at-risk");

  return (
    <Flex direction="column" gap="md">
      <Tile>
        <Flex direction="column" gap="sm">
          <Text format={{ fontWeight: "demibold" }}>Live inference</Text>
          <Input
            label="Status / label value"
            value={input}
            onChange={setInput}
          />
          <Divider />
          <DescriptionList direction="row">
            <DescriptionListItem label="getAutoTagVariant(value)">
              {getAutoTagVariant(input)}
            </DescriptionListItem>
            <DescriptionListItem label="getAutoStatusTagVariant(value)">
              {getAutoStatusTagVariant(input)}
            </DescriptionListItem>
            <DescriptionListItem label="<AutoTag value={...} />">
              <AutoTag value={input} />
            </DescriptionListItem>
            <DescriptionListItem label="<AutoStatusTag value={...} />">
              <AutoStatusTag value={input} />
            </DescriptionListItem>
          </DescriptionList>
        </Flex>
      </Tile>

      <Tile>
        <Flex direction="column" gap="xs">
          <Text format={{ fontWeight: "demibold" }}>Input → variant mapping</Text>
          <Text variant="microcopy">
            Case-insensitive, tolerant of underscores/dashes/phrases. Unmatched
            values fall through to "default".
          </Text>
          <DescriptionList direction="row">
            {VARIANT_SAMPLES.map((value) => (
              <DescriptionListItem key={value} label={value}>
                <Flex direction="row" gap="xs" align="center">
                  <AutoTag value={value} />
                  <AutoStatusTag value={value} />
                </Flex>
              </DescriptionListItem>
            ))}
          </DescriptionList>
        </Flex>
      </Tile>
    </Flex>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Collections demo — sumBy
// ═══════════════════════════════════════════════════════════════════════════

const DEALS = [
  { id: 1, name: "Acme expansion",   amount: 45_000, probability: 0.9 },
  { id: 2, name: "Globex renewal",   amount: 32_000, probability: 0.5 },
  { id: 3, name: "Initech migration", amount: 18_500, probability: 0.25 },
  { id: 4, name: "Umbrella upsell",  amount: 128_000, probability: 0.1 },
  { id: 5, name: "Wayne integration", amount: null,    probability: 0.4 },
];

const CollectionsDemo = () => (
  <Flex direction="column" gap="md">
    <Tile>
      <Flex direction="column" gap="xs">
        <Text format={{ fontWeight: "demibold" }}>Deals sample</Text>
        <DescriptionList direction="row">
          {DEALS.map((d) => (
            <DescriptionListItem key={d.id} label={d.name}>
              {formatCurrency(d.amount)} · {formatPercentage(d.probability)}
            </DescriptionListItem>
          ))}
        </DescriptionList>
      </Flex>
    </Tile>

    <Tile>
      <Flex direction="column" gap="xs">
        <Text format={{ fontWeight: "demibold" }}>sumBy aggregations</Text>
        <DescriptionList direction="row">
          <DescriptionListItem label='sumBy(deals, "amount") — null-safe'>
            {formatCurrency(sumBy(DEALS, "amount"))}
          </DescriptionListItem>
          <DescriptionListItem label="sumBy(deals, d => d.amount * d.probability) — weighted">
            {formatCurrency(sumBy(DEALS, (d) => (d.amount ?? 0) * d.probability))}
          </DescriptionListItem>
          <DescriptionListItem label="sumBy(null, ...) — null-safe input">
            {String(sumBy(null, "amount"))}
          </DescriptionListItem>
        </DescriptionList>
      </Flex>
    </Tile>
  </Flex>
);

// ---------------------------------------------------------------------------
// Demo registry
// ---------------------------------------------------------------------------

export const UTILS_DEMOS = [
  {
    id: "utils-formatters",
    name: "Formatters",
    description:
      "Locale-aware Intl wrappers for currency (standard + compact), date, date-time, and percentage. Null-safe across the board.",
    package: "utils",
    Component: FormattersDemo,
    githubUrl: UTILS_DOCS,
    sourceCode: `import { formatCurrency, formatCurrencyCompact, formatDate, formatDateTime, formatPercentage } from "hs-uix/utils";`,
  },
  {
    id: "utils-options",
    name: "buildOptions + findOptionLabel",
    description:
      "Shape raw arrays into { label, value } for HubSpot Select / MultiSelect, then reverse-lookup the label from a value.",
    package: "utils",
    Component: OptionsDemo,
    githubUrl: UTILS_DOCS,
    sourceCode: `import { buildOptions, findOptionLabel } from "hs-uix/utils";`,
  },
  {
    id: "utils-tag-variants",
    name: "Tag variants",
    description:
      "The same variant inference that powers AutoTag / AutoStatusTag, exposed as plain functions for custom cells and sort comparators.",
    package: "utils",
    Component: TagVariantsDemo,
    githubUrl: UTILS_DOCS,
    sourceCode: `import { getAutoTagVariant, getAutoStatusTagVariant, createStatusTagSortComparator } from "hs-uix/utils";`,
  },
  {
    id: "utils-collections",
    name: "sumBy",
    description:
      "Sum a numeric property (by key or accessor) across an array. Missing/null values count as 0 — safe for partial data.",
    package: "utils",
    Component: CollectionsDemo,
    githubUrl: UTILS_DOCS,
    sourceCode: `import { sumBy } from "hs-uix/utils";`,
  },
];
