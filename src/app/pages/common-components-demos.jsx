import React, { useState } from "react";
import {
  Box,
  Button,
  Divider,
  Flex,
  Text,
  Tile,
  ToggleGroup,
} from "@hubspot/ui-extensions";
import {
  AutoStatusTag,
  AutoTag,
  AvatarStack,
  formatCurrency,
  KeyValueList,
  SectionHeader,
  StyledText,
} from "hs-uix";

// ---------------------------------------------------------------------------
// Shared sample data
// ---------------------------------------------------------------------------

const STATUS_SAMPLES = [
  "Active",
  "In Progress",
  "At Risk",
  "On Hold",
  "Completed",
  "Failed",
  "New",
  "Pending",
  "Cancelled",
  "Draft",
];

const SEGMENT_SAMPLES = [
  "Enterprise",
  "Mid-market",
  "SMB",
  "Startup",
  "Partner",
  "Internal",
];

const AVATAR_SAMPLES = ["AR", "JK", "SP", "MB", "LM", "DT", "QW", "RH"];

const COMMON_DOCS =
  "https://github.com/05bmckay/hs-uix/blob/main/src/common-components/README.md";

// ═══════════════════════════════════════════════════════════════════════════
// AutoTag demo — free-form strings → inferred Tag variants
// ═══════════════════════════════════════════════════════════════════════════

const AutoTagDemo = () => (
  <Flex direction="column" gap="md">
    <Tile>
      <Flex direction="column" gap="xs">
        <Text format={{ fontWeight: "demibold" }}>Inferred variants</Text>
        <Text variant="microcopy">
          Pass a status/label value; AutoTag picks success / warning / error / info /
          default based on case-insensitive matching. Underscores, dashes, and
          multi-word phrases all resolve ("in_progress", "on hold", "at-risk").
        </Text>
        <Flex direction="row" wrap="wrap" gap="xs">
          {STATUS_SAMPLES.map((value) => (
            <AutoTag key={value} value={value} />
          ))}
        </Flex>
      </Flex>
    </Tile>

    <Tile>
      <Flex direction="column" gap="xs">
        <Text format={{ fontWeight: "demibold" }}>With overrides + fallback</Text>
        <Text variant="microcopy">
          Force specific values with `overrides`, and change the unmatched
          default via `fallback`.
        </Text>
        <Flex direction="row" wrap="wrap" gap="xs">
          {SEGMENT_SAMPLES.map((value) => (
            <AutoTag
              key={value}
              value={value}
              overrides={{ Enterprise: "success", Startup: "warning" }}
              fallback="info"
            />
          ))}
        </Flex>
      </Flex>
    </Tile>
  </Flex>
);

// ═══════════════════════════════════════════════════════════════════════════
// AutoStatusTag demo — same inference, rendered as StatusTag
// ═══════════════════════════════════════════════════════════════════════════

const AutoStatusTagDemo = () => (
  <Flex direction="column" gap="md">
    <Tile>
      <Flex direction="column" gap="xs">
        <Text format={{ fontWeight: "demibold" }}>Status tag variants</Text>
        <Text variant="microcopy">
          Same variant inference as AutoTag, but returns HubSpot's StatusTag
          (with danger instead of error).
        </Text>
        <Flex direction="row" wrap="wrap" gap="xs">
          {STATUS_SAMPLES.map((value) => (
            <AutoStatusTag key={value} value={value} />
          ))}
        </Flex>
      </Flex>
    </Tile>

    <Tile>
      <Flex direction="column" gap="xs">
        <Text format={{ fontWeight: "demibold" }}>Boolean display values</Text>
        <Text variant="microcopy">
          Boolean inputs are normalized to "True" / "False" display text —
          handy when a flag column becomes a tag cell.
        </Text>
        <Flex direction="row" gap="xs">
          <AutoStatusTag value={true} />
          <AutoStatusTag value={false} />
        </Flex>
      </Flex>
    </Tile>
  </Flex>
);

// ═══════════════════════════════════════════════════════════════════════════
// AvatarStack demo — sizes, overlap, overflow, mixed images
// ═══════════════════════════════════════════════════════════════════════════

const AvatarStackDemo = () => {
  const [size, setSize] = useState("medium");
  const [maxVisible, setMaxVisible] = useState(4);
  const [overlap, setOverlap] = useState(8);

  return (
    <Flex direction="column" gap="md">
      <Tile>
        <Flex direction="column" gap="xs">
          <Text format={{ fontWeight: "demibold" }}>Size tokens</Text>
          <Text variant="microcopy">
            xs (16), sm (20), md (24), lg (32), xl (40) — or any pixel number.
          </Text>
          <Flex direction="row" gap="md" align="center">
            {["xs", "sm", "md", "lg", "xl"].map((token) => (
              <Flex key={token} direction="column" align="center" gap="flush">
                <AvatarStack items={AVATAR_SAMPLES.slice(0, 3)} size={token} />
                <Text variant="microcopy">{token}</Text>
              </Flex>
            ))}
          </Flex>
        </Flex>
      </Tile>

      <Tile>
        <Flex direction="column" gap="xs">
          <Text format={{ fontWeight: "demibold" }}>Overflow chip</Text>
          <Text variant="microcopy">
            Extras past maxVisible collapse into a neutral "+N" chip.
          </Text>
          <Flex direction="row" gap="md" align="center">
            {[2, 3, 4, 6].map((cap) => (
              <Flex key={cap} direction="column" align="center" gap="flush">
                <AvatarStack items={AVATAR_SAMPLES} size="medium" maxVisible={cap} />
                <Text variant="microcopy">maxVisible={cap}</Text>
              </Flex>
            ))}
          </Flex>
        </Flex>
      </Tile>

      <Tile>
        <Flex direction="column" gap="sm">
          <Text format={{ fontWeight: "demibold" }}>Interactive controls</Text>
          <Flex direction="row" gap="md" align="center" wrap="wrap">
            <Flex direction="column" gap="flush">
              <Text variant="microcopy">size</Text>
              <ToggleGroup
                name="avatar-size"
                toggleType="radioButtonList"
                options={[
                  { label: "xs", value: "xs" },
                  { label: "sm", value: "sm" },
                  { label: "md", value: "medium" },
                  { label: "lg", value: "lg" },
                  { label: "xl", value: "xl" },
                ]}
                value={size}
                onChange={setSize}
              />
            </Flex>
            <Flex direction="column" gap="flush">
              <Text variant="microcopy">maxVisible</Text>
              <ToggleGroup
                name="avatar-max"
                toggleType="radioButtonList"
                options={[
                  { label: "2", value: 2 },
                  { label: "3", value: 3 },
                  { label: "4", value: 4 },
                  { label: "6", value: 6 },
                ]}
                value={maxVisible}
                onChange={setMaxVisible}
              />
            </Flex>
            <Flex direction="column" gap="flush">
              <Text variant="microcopy">overlap (px)</Text>
              <ToggleGroup
                name="avatar-overlap"
                toggleType="radioButtonList"
                options={[
                  { label: "0", value: 0 },
                  { label: "4", value: 4 },
                  { label: "8", value: 8 },
                  { label: "12", value: 12 },
                ]}
                value={overlap}
                onChange={setOverlap}
              />
            </Flex>
          </Flex>
          <Divider />
          <Flex direction="row" gap="md" align="center">
            <AvatarStack
              items={AVATAR_SAMPLES}
              size={size}
              maxVisible={maxVisible}
              overlap={overlap}
            />
            <Text variant="microcopy">
              size={String(size)} · maxVisible={maxVisible} · overlap={overlap}px
            </Text>
          </Flex>
        </Flex>
      </Tile>
    </Flex>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// SectionHeader demo
// ═══════════════════════════════════════════════════════════════════════════

const SectionHeaderDemo = () => (
  <Flex direction="column" gap="md">
    <Tile>
      <SectionHeader title="Minimal — title only" />
    </Tile>

    <Tile>
      <SectionHeader
        title="With description"
        description="A subtitle rendered as microcopy beneath the title. Use for short explanatory blurbs."
      />
    </Tile>

    <Tile>
      <SectionHeader
        title="With actions"
        description="Actions render aligned to the right of the title row — good for section-level CTAs."
        actions={
          <Flex direction="row" gap="xs">
            <Button variant="secondary">Export</Button>
            <Button variant="primary">Create</Button>
          </Flex>
        }
      />
    </Tile>
  </Flex>
);

// ═══════════════════════════════════════════════════════════════════════════
// KeyValueList demo
// ═══════════════════════════════════════════════════════════════════════════

const KeyValueListDemo = () => (
  <Flex direction="column" gap="md">
    <Tile>
      <Flex direction="column" gap="xs">
        <Text format={{ fontWeight: "demibold" }}>Row layout (default)</Text>
        <Text variant="microcopy">
          Labels sit inline with values via DescriptionList. Values accept any
          JSX — tags, avatars, formatted currency.
        </Text>
        <KeyValueList
          items={[
            { label: "Status", value: <AutoStatusTag value="At risk" /> },
            { label: "Segment", value: <AutoTag value="Enterprise" /> },
            {
              label: "Owners",
              value: (
                <AvatarStack
                  items={AVATAR_SAMPLES.slice(0, 5)}
                  size="small"
                  maxVisible={4}
                />
              ),
            },
            { label: "Pipeline", value: formatCurrency(245000) },
            { label: "Deals open", value: 12 },
          ]}
        />
      </Flex>
    </Tile>

    <Tile>
      <Flex direction="column" gap="xs">
        <Text format={{ fontWeight: "demibold" }}>Column layout</Text>
        <Text variant="microcopy">
          direction="column" stacks label-on-top-of-value — useful in narrow
          rails or card footers.
        </Text>
        <KeyValueList
          direction="column"
          items={[
            { label: "Created", value: "Apr 15, 2026" },
            { label: "Last touched", value: "2 days ago" },
            { label: "Owner", value: "Alex Rivers" },
          ]}
        />
      </Flex>
    </Tile>
  </Flex>
);

// ═══════════════════════════════════════════════════════════════════════════
// StyledText demo — rotation, color, pill backgrounds
// ═══════════════════════════════════════════════════════════════════════════

const StyledTextDemo = () => (
  <Flex direction="column" gap="md">
    <Tile>
      <Flex direction="column" gap="xs">
        <Text format={{ fontWeight: "demibold" }}>Custom glyph color</Text>
        <Text variant="microcopy">
          Native &lt;Text&gt; can't override color — StyledText can.
        </Text>
        <Flex direction="row" gap="md" align="center">
          <StyledText
            text="High priority"
            color="#f2545b"
            format={{ fontWeight: "bold" }}
          />
          <StyledText
            text="Low priority"
            color="#516f90"
            format={{ fontWeight: "demibold" }}
          />
          <StyledText
            text="New"
            color="#00a4bd"
            variant="microcopy"
            format={{ fontWeight: "bold", textTransform: "uppercase" }}
          />
        </Flex>
      </Flex>
    </Tile>

    <Tile>
      <Flex direction="column" gap="xs">
        <Text format={{ fontWeight: "demibold" }}>Pill backgrounds</Text>
        <Text variant="microcopy">
          background=&#123;&#123; color, radius, paddingX, paddingY &#125;&#125;
          wraps the glyph in a colored pill.
        </Text>
        <Flex direction="row" gap="md" align="center">
          <StyledText
            text="339"
            variant="microcopy"
            format={{ fontWeight: "demibold" }}
            background={{ color: "#F5F8FA", radius: 3, paddingX: 6, paddingY: 3 }}
          />
          <StyledText
            text="Beta"
            variant="microcopy"
            color="#ffffff"
            format={{ fontWeight: "bold", textTransform: "uppercase" }}
            background={{ color: "#0091ae", radius: 10, paddingX: 8, paddingY: 3 }}
          />
          <StyledText
            text="+24%"
            variant="microcopy"
            color="#0e8a5f"
            format={{ fontWeight: "demibold" }}
            background={{ color: "#e6f7ef", radius: 10, paddingX: 8, paddingY: 3 }}
          />
        </Flex>
      </Flex>
    </Tile>

    <Tile>
      <Flex direction="column" gap="xs">
        <Text format={{ fontWeight: "demibold" }}>Rotation</Text>
        <Text variant="microcopy">
          orientation="vertical-up" / "vertical-down" — for collapsed rails or
          axis labels where native &lt;Text&gt; can't rotate.
        </Text>
        <Flex direction="row" gap="lg" align="center">
          <StyledText text="Horizontal" variant="bodytext" format={{ fontWeight: "demibold" }} />
          <StyledText
            text="Vertical up"
            variant="bodytext"
            format={{ fontWeight: "demibold" }}
            orientation="vertical-up"
          />
          <StyledText
            text="Vertical down"
            variant="bodytext"
            format={{ fontWeight: "demibold" }}
            orientation="vertical-down"
          />
        </Flex>
      </Flex>
    </Tile>

    <Tile>
      <Flex direction="column" gap="flush">
        <Text format={{ fontWeight: "demibold" }}>⚠️ Selection caveat</Text>
        <Text variant="microcopy">
          StyledText renders as an SVG data URI through &lt;Image&gt;, so the
          text is NOT user-selectable. Use native &lt;Text&gt; anywhere
          copy-paste matters.
        </Text>
      </Flex>
    </Tile>
  </Flex>
);

// ---------------------------------------------------------------------------
// Combined "all in one" demo — good for the overview screenshot
// ---------------------------------------------------------------------------

const OverviewDemo = () => (
  <Flex direction="column" gap="md">
    <Tile>
      <SectionHeader
        title="Deal summary"
        description="A compact summary built entirely from common-components."
        actions={
          <Flex direction="row" gap="xs">
            <Button variant="secondary">Edit</Button>
            <Button variant="primary">Open deal</Button>
          </Flex>
        }
      />
    </Tile>

    <Tile>
      <KeyValueList
        items={[
          { label: "Status", value: <AutoStatusTag value="At risk" /> },
          { label: "Segment", value: <AutoTag value="Enterprise" /> },
          {
            label: "Owners",
            value: <AvatarStack items={AVATAR_SAMPLES} size="medium" maxVisible={4} />,
          },
          { label: "Pipeline", value: formatCurrency(245000) },
          {
            label: "Badges",
            value: (
              <Flex direction="row" gap="xs" align="center">
                <StyledText
                  text="Beta"
                  variant="microcopy"
                  color="#ffffff"
                  format={{ fontWeight: "bold", textTransform: "uppercase" }}
                  background={{ color: "#0091ae", radius: 10, paddingX: 8, paddingY: 3 }}
                />
                <StyledText
                  text="+24%"
                  variant="microcopy"
                  color="#0e8a5f"
                  format={{ fontWeight: "demibold" }}
                  background={{ color: "#e6f7ef", radius: 10, paddingX: 8, paddingY: 3 }}
                />
              </Flex>
            ),
          },
        ]}
      />
    </Tile>
  </Flex>
);

// ---------------------------------------------------------------------------
// Demo registry
// ---------------------------------------------------------------------------

export const COMMON_COMPONENT_DEMOS = [
  {
    id: "common-overview",
    name: "Overview",
    description:
      "All the common-components composed into a single summary panel — the screenshot target for the README hero image.",
    package: "common",
    Component: OverviewDemo,
    githubUrl: COMMON_DOCS,
    sourceCode: `import { AutoStatusTag, AutoTag, AvatarStack, KeyValueList, SectionHeader, StyledText } from "hs-uix/common-components";`,
  },
  {
    id: "common-auto-tag",
    name: "AutoTag",
    description:
      "Tag with variant inferred from the value. Case-insensitive, tolerant of underscores/dashes/phrases. Overrides + fallback for non-default cases.",
    package: "common",
    Component: AutoTagDemo,
    githubUrl: COMMON_DOCS,
    sourceCode: `<AutoTag value="At risk" />`,
  },
  {
    id: "common-auto-status-tag",
    name: "AutoStatusTag",
    description:
      "StatusTag with the same inference as AutoTag (danger instead of error). Normalizes booleans to True/False display text.",
    package: "common",
    Component: AutoStatusTagDemo,
    githubUrl: COMMON_DOCS,
    sourceCode: `<AutoStatusTag value="Completed" />`,
  },
  {
    id: "common-avatar-stack",
    name: "AvatarStack",
    description:
      "Overlapping circular avatars as a single SVG via <Image>. T-shirt sizing, custom overlap, +N overflow chip past maxVisible.",
    package: "common",
    Component: AvatarStackDemo,
    githubUrl: COMMON_DOCS,
    sourceCode: `<AvatarStack items={["AR", "JK", "SP"]} size="medium" maxVisible={4} />`,
  },
  {
    id: "common-section-header",
    name: "SectionHeader",
    description:
      "Title + optional description + actions slot. Drops on top of any Tile or section container.",
    package: "common",
    Component: SectionHeaderDemo,
    githubUrl: COMMON_DOCS,
    sourceCode: `<SectionHeader title="..." description="..." actions={<Button />} />`,
  },
  {
    id: "common-key-value-list",
    name: "KeyValueList",
    description:
      "Vertical list of label/value rows via DescriptionList. Values accept any JSX — tags, avatars, formatted currency. Row or column layout.",
    package: "common",
    Component: KeyValueListDemo,
    githubUrl: COMMON_DOCS,
    sourceCode: `<KeyValueList items={[{ label, value }, ...]} />`,
  },
  {
    id: "common-styled-text",
    name: "StyledText",
    description:
      "SVG-rendered text with rotation, custom color, and pill backgrounds for cases native <Text> can't express. Caveat: not user-selectable.",
    package: "common",
    Component: StyledTextDemo,
    githubUrl: COMMON_DOCS,
    sourceCode: `<StyledText text="High priority" color="#f2545b" />`,
  },
];
