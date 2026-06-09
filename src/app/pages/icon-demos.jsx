import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  ButtonRow,
  Divider,
  Flex,
  Icon as HubSpotIcon,
  Image,
  Input,
  Link,
  Text,
  Tile,
  ToggleGroup,
} from "@hubspot/ui-extensions";
import { Icon, ICON_NAMES, makeIconDataUri } from "hs-uix/common-components";

// ---------------------------------------------------------------------------
// Icon demo — a superset of HubSpot's native <Icon>. The native component is
// boxed in three ways (fixed name whitelist, 4 colors, 3 sizes); this renders
// any registered glyph at any color and any pixel size by inlining SVG through
// <Image>. The registry is built from icons scraped out of HubSpot's web app
// (see hs-uix/scripts/scrape-hs-icons.console.js + build-icons.mjs).
// ---------------------------------------------------------------------------

const ICON_SOURCE =
  "https://github.com/05bmckay/hs-uix/blob/main/src/common-components/Icon.js";

// Every icon in the gallery is a scraped/custom glyph rendered through our SVG
// path, so they all share sizing and weight. (The Icon component itself still
// delegates to native <Icon> for native-expressible requests — that's the
// right runtime behavior — we just don't mix render paths in this gallery.)
const CUSTOM_NAMES = [...ICON_NAMES].sort((a, b) => a.localeCompare(b));

// Fixed columns per row → equal-width cells (Box flex={1}), so rows don't go
// ragged when labels vary in length.
const COLS = 6;

const SIZE_OPTIONS = [
  { label: "sm", value: "sm" },
  { label: "md", value: "md" },
  { label: "lg", value: "lg" },
  { label: "xl", value: "xl" },
  { label: "32px", value: 32 },
  { label: "48px", value: 48 },
];

// Native semantic tokens + a few brand hexes native can't express.
const COLOR_OPTIONS = [
  { label: "inherit", value: "inherit" },
  { label: "success", value: "success" },
  { label: "warning", value: "warning" },
  { label: "alert", value: "alert" },
  { label: "orange", value: "#E66E50" },
  { label: "teal", value: "#0091ae" },
  { label: "slate", value: "#516f90" },
];

// PascalCase → lowercased word tokens ("CRMDevelopment" → ["crm","development"],
// "chevronDown" → ["chevron","down"]). Used for semantic categorization so a
// substring like "down" in "Download" doesn't false-match the arrows group.
const tokenize = (name) =>
  name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

// Ordered categories. An icon joins the FIRST category whose `tokens` intersect
// its word tokens, or whose exact `names` include it; otherwise → "Other".
// Tweak freely — this is purely presentational grouping for the gallery.
const CATEGORIES = [
  {
    label: "Arrows & navigation",
    names: ["Down", "Up", "Left", "Right"],
    tokens: ["chevron", "carat", "caret", "forward", "backward", "undo", "redo", "enlarge", "shrink", "expand", "collapse", "arrow", "external", "move", "sidebar"],
  },
  {
    label: "AI & Breeze",
    tokens: ["artificial", "intelligence", "breeze", "robot", "spark", "generate", "chart", "bot"],
  },
  {
    label: "CRM objects",
    tokens: ["crm", "contact", "contacts", "company", "companies", "deal", "deals", "ticket", "tickets", "quote", "invoice", "product", "order", "lead", "leads", "account", "payment", "subscription", "commerce", "cart", "rotate", "bank", "credit", "card", "enrichment"],
  },
  {
    label: "Communication",
    tokens: ["call", "calling", "email", "mail", "comment", "comments", "message", "messages", "inbox", "send", "notification", "chat", "mention", "video", "transcript", "communication"],
  },
  {
    label: "Marketing & hubs",
    tokens: ["marketing", "sales", "service", "marketplace", "reporting", "report", "reports", "campaign", "campaigns", "audience", "targeting", "social", "credits", "gauge", "goal", "gift", "registration", "test"],
  },
  {
    label: "Media & playback",
    tokens: ["play", "pause", "stop", "record"],
  },
  {
    label: "Integrations & apps",
    tokens: ["office365", "office", "quickbooks", "integration", "integrations", "plugin", "connect", "oauth"],
  },
  {
    label: "Automation & workflows",
    tokens: ["automation", "automations", "workflow", "workflows", "sequence", "sequences", "conditional", "developer", "projects", "github", "branch", "tasks", "enroll", "enrollment", "guided"],
  },
  {
    label: "Data model",
    names: ["HubDB"],
    tokens: ["object", "associations", "association", "estate", "listing", "schema", "dataset"],
  },
  {
    label: "Time & scheduling",
    tokens: ["date", "time", "snooze", "sleep", "recently", "recent", "meeting", "meetings", "schedule", "calendar", "clock", "appointment", "delay"],
  },
  {
    label: "Content & files",
    tokens: ["blog", "book", "bookmark", "clipboard", "content", "document", "documents", "file", "folder", "code", "database", "databases", "datamanagement", "data", "management", "image", "page", "template", "snippet", "description", "knowledge", "base", "attach", "tag", "cap", "lesson", "presentation", "signature", "text", "styles", "strike", "color"],
  },
  {
    label: "Devices",
    tokens: ["mobile", "tablet", "desktop", "device", "signal", "screen"],
  },
  {
    label: "Layout & views",
    names: ["MoreCircle"],
    tokens: ["home", "view", "grid", "table", "list", "lists", "listview", "kanban", "section", "menu", "vertical", "ellipses", "website", "link", "pin", "share", "rule", "horizontal", "hide", "zoom", "globe", "location", "read", "site", "tree"],
  },
  {
    label: "Editing & actions",
    names: ["LessCircle"],
    tokens: ["add", "edit", "delete", "duplicate", "copy", "save", "editable", "replace", "clean", "cleanup", "remove", "plus", "minus", "close", "cancel", "print", "publish", "trash", "rename", "drag", "handle", "download", "upload", "export", "import", "refresh", "upgrade"],
  },
  {
    label: "Filters & sorting",
    tokens: ["filter", "filters", "sort", "search", "advanced", "dynamic"],
  },
  {
    label: "Status & feedback",
    names: ["CircleFilled", "CircleHollow", "XCircle", "FilledXCircleIcon"],
    tokens: ["approval", "approvals", "block", "success", "warning", "error", "info", "check", "emoji", "star", "favorite", "heart", "flag", "alert", "lock", "locked", "unlocked", "exclamation", "question", "thumbs", "trophy", "partial", "help", "bulb"],
  },
  {
    label: "System & config",
    names: ["Light", "Dark"],
    tokens: ["settings", "setting", "config", "preferences", "sprocket", "gear", "language", "translate", "locale", "key"],
  },
];

const OTHER = "Other";
const GROUP_ORDER = [...CATEGORIES.map((c) => c.label), OTHER];

// Within a group, pull these names to the front in this exact order so related
// icons sit together (up/down, redo/undo, asc/desc, open/closed variants…).
// Anything not listed falls back to alphabetical after the ordered names.
const GROUP_SORT = {
  "Arrows & navigation": [
    "Up", "Down", "Left", "Right",
    "UpCarat", "DownCarat",
    "Undo", "Redo",
    "Forward", "Backward",
    "SidebarCollapse", "SidebarExpand",
    "Enlarge", "Shrink", "ExternalLink", "Move",
  ],
  "Communication": [
    "Calling", "CallingMade", "CallingMissed", "CallingHangup", "CallingVoicemail", "CallTranscript",
    "Email", "EmailOpen", "EmailThreadedReplies",
    "Messages", "Comments", "Mention", "Inbox", "Send",
    "Notification", "NotificationOff",
    "Video", "VideoFile", "VideoPlayerSubtitles", "InsertVideo",
  ],
  "Content & files": [
    "Folder", "FolderOpen", "File", "Documents",
    "ImageGallery", "InsertImage",
    "TextSnippet", "TextDataType", "NumericDataType",
    "Databases", "DataManagement", "DataSync",
  ],
  "Layout & views": [
    "View", "ViewDetails", "ReadOnlyView", "SaveEditableView",
    "Lists", "ListView", "Grid", "Table", "Kanban",
    "SortTable", "SortTableAsc", "SortTableAscNew", "SortTableDesc", "SortTableDescNew",
  ],
  "Media & playback": [
    "Play", "Pause", "Stop", "Record", "StopRecord",
  ],
  "Editing & actions": [
    "Add", "Edit", "Delete", "Duplicate", "Copy",
    "Download", "Upload", "Export", "Import",
    "Print", "Refresh", "Close",
  ],
  "System & config": [
    "Light", "Dark", "Settings", "Sprocket", "Key", "Language", "Translate",
  ],
  "Filters & sorting": [
    "Filter", "AdvancedFilters", "DynamicFilter", "Search",
    "SortAlpAsc", "SortAlpDesc",
    "SortAmtAsc", "SortAmtDesc",
    "SortNumAsc", "SortNumDesc",
  ],
  "Status & feedback": [
    "Success", "Warning", "Block",
    "Locked", "Unlocked",
    "CheckCircle", "checkBare", "SpellCheck",
    "Exclamation", "ExclamationCircle",
    "Info", "InfoNoCircle",
    "Question", "QuestionCircle", "QuestionAnswer",
    "ThumbsUp", "ThumbsDown",
    "Favorite", "FavoriteHollow", "Heart",
    "CircleFilled", "CircleHollow",
    "Emoji", "EmojiFillHappy", "EmojiLineNeutral", "EmojiFillNeutral", "EmojiLineSad", "EmojiFillSad",
  ],
};

const ORDER_INDEX = Object.fromEntries(
  Object.entries(GROUP_SORT).map(([label, names]) => [
    label,
    new Map(names.map((n, i) => [n, i])),
  ])
);

// Sort a group's names: explicitly-ordered ones first (in order), rest A–Z.
const sortGroup = (label, names) => {
  const index = ORDER_INDEX[label];
  return [...names].sort((a, b) => {
    const ia = index && index.has(a) ? index.get(a) : Infinity;
    const ib = index && index.has(b) ? index.get(b) : Infinity;
    return ia !== ib ? ia - ib : a.localeCompare(b);
  });
};

const classify = (name) => {
  const tokens = new Set(tokenize(name));
  for (const cat of CATEGORIES) {
    if (cat.names && cat.names.includes(name)) return cat.label;
    if (cat.tokens && cat.tokens.some((t) => tokens.has(t))) return cat.label;
  }
  return OTHER;
};

// Classify every name once; group the gallery from this lookup.
const GROUP_OF = (() => {
  const map = {};
  for (const name of CUSTOM_NAMES) map[name] = classify(name);
  return map;
})();

const IconCell = ({ name, size, color }) => (
  <Box flex={1}>
    <Tile>
      <Flex direction="column" align="center" gap="xs">
        <Icon name={name} size={size} color={color} screenReaderText={name} />
        <Text variant="microcopy">{name}</Text>
      </Flex>
    </Tile>
  </Box>
);

const IconRows = ({ names, size, color }) => {
  const rows = [];
  for (let i = 0; i < names.length; i += COLS) rows.push(names.slice(i, i + COLS));
  return (
    <Flex direction="column" gap="sm">
      {rows.map((row, ri) => (
        <Flex key={ri} direction="row" gap="sm">
          {row.map((name) => (
            <IconCell key={name} name={name} size={size} color={color} />
          ))}
          {/* pad the final row so the last cells keep their column width */}
          {Array.from({ length: COLS - row.length }).map((_, i) => (
            <Box key={`pad-${i}`} flex={1} />
          ))}
        </Flex>
      ))}
    </Flex>
  );
};

const ClickableIconTestBed = () => {
  const [counts, setCounts] = useState({});
  const bump = (key) => setCounts((prev) => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
  const downImage = makeIconDataUri("Down", { size: "md", color: "#33475b" });
  const rightImage = makeIconDataUri("Right", { size: "md", color: "#33475b" });

  const Row = ({ label, countKey, children }) => (
    <Flex direction="row" align="center" gap="md" wrap="wrap">
      <Box flex={2}><Text>{label}</Text></Box>
      <Box flex={1}>{children}</Box>
      <Box flex={1}><Text variant="microcopy">{`clicks: ${counts[countKey] || 0}`}</Text></Box>
    </Flex>
  );

  return (
    <Tile>
      <Flex direction="column" gap="sm">
        <Text format={{ fontWeight: "demibold" }}>Clickable custom icon test bed</Text>
        <Text variant="microcopy">
          Testing the scraped custom chevrons (`Down` / `Right`) in the contexts we need for Feed card collapse.
          The expected behavior is: visible icon plus click count increment.
        </Text>

        <Row label="hs-uix Icon custom Down + onClick" countKey="custom-direct">
          <Icon name="Down" size="md" onClick={() => bump("custom-direct")} screenReaderText="Custom Down direct" />
        </Row>

        <Row label="hs-uix Icon custom Right + onClick" countKey="custom-right-direct">
          <Icon name="Right" size="md" onClick={() => bump("custom-right-direct")} screenReaderText="Custom Right direct" />
        </Row>

        <Row label="Direct HubSpot Image data URI + onClick" countKey="image-direct">
          {downImage ? (
            <Image
              src={downImage.src}
              width={downImage.width}
              height={downImage.height}
              alt="Direct Image Down"
              onClick={() => bump("image-direct")}
            />
          ) : <Text variant="microcopy">No data URI</Text>}
        </Row>

        <Row label="HubSpot Link wrapping direct Image" countKey="link-image">
          {rightImage ? (
            <Link onClick={() => bump("link-image")}>
              <Image
                src={rightImage.src}
                width={rightImage.width}
                height={rightImage.height}
                alt="Link Image Right"
              />
            </Link>
          ) : <Text variant="microcopy">No data URI</Text>}
        </Row>

        <Row label="HubSpot Link wrapping hs-uix Icon custom Down" countKey="link-custom">
          <Link onClick={() => bump("link-custom")}>
            <Icon name="Down" size="md" screenReaderText="Link custom Down" />
          </Link>
        </Row>

        <Row label="HubSpot Button with hs-uix Icon custom Down child" countKey="button-custom">
          <Button variant="transparent" size="sm" onClick={() => bump("button-custom")}>
            <Icon name="Down" size="md" screenReaderText="Button custom Down" />
          </Button>
        </Row>

        <Row label="HubSpot ButtonRow with custom icon action" countKey="buttonrow-custom">
          <ButtonRow dropDownButtonOptions={{ text: "More", size: "sm", variant: "transparent" }}>
            <Button variant="transparent" size="sm" onClick={() => bump("buttonrow-custom")}>
              <Icon name="Down" size="md" screenReaderText="ButtonRow custom Down" />
              Custom Down
            </Button>
            <Button variant="transparent" size="sm" onClick={() => bump("buttonrow-native")}>
              <HubSpotIcon name="downCarat" size="sm" screenReaderText="ButtonRow native downCarat" />
              Native downCarat
            </Button>
          </ButtonRow>
        </Row>

        <Row label="Control: native HubSpot Icon in Link" countKey="native-link">
          <Link onClick={() => bump("native-link")}>
            <HubSpotIcon name="downCarat" size="sm" screenReaderText="Native Down" />
          </Link>
        </Row>
      </Flex>
    </Tile>
  );
};

const IconGalleryDemo = () => {
  const [size, setSize] = useState("lg");
  const [color, setColor] = useState("inherit");
  const [query, setQuery] = useState("");

  // Group → filtered names, preserving category order and dropping empties.
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const buckets = {};
    for (const name of CUSTOM_NAMES) {
      if (q && !name.toLowerCase().includes(q)) continue;
      (buckets[GROUP_OF[name]] ||= []).push(name);
    }
    return GROUP_ORDER.map((label) => ({
      label,
      names: sortGroup(label, buckets[label] || []),
    })).filter((g) => g.names.length > 0);
  }, [query]);

  const shown = groups.reduce((sum, g) => sum + g.names.length, 0);

  return (
    <Flex direction="column" gap="md">
      <Tile>
        <Flex direction="column" gap="sm">
          <Text format={{ fontWeight: "demibold" }}>Interactive gallery</Text>
          <Text variant="microcopy">
            {`Any glyph, any color, any size — every icon rendered through one SVG`}
            {` path, scraped from HubSpot's web app. Pick a size and color to see`}
            {` them all update uniformly.`}
          </Text>

          <Flex direction="row" gap="md" align="end" wrap="wrap">
            <Flex direction="column" gap="flush">
              <Text variant="microcopy">size</Text>
              <ToggleGroup
                name="icon-size"
                toggleType="radioButtonList"
                options={SIZE_OPTIONS}
                value={size}
                onChange={setSize}
              />
            </Flex>
            <Flex direction="column" gap="flush">
              <Text variant="microcopy">color</Text>
              <ToggleGroup
                name="icon-color"
                toggleType="radioButtonList"
                options={COLOR_OPTIONS}
                value={color}
                onChange={setColor}
              />
            </Flex>
          </Flex>

          <Box>
            <Input
              label="Filter by name"
              name="icon-filter"
              value={query}
              onChange={setQuery}
              placeholder="e.g. mail, chart, user…"
            />
          </Box>

          <Text variant="microcopy">
            {`Showing ${shown} of ${CUSTOM_NAMES.length} icons`}
          </Text>
        </Flex>
      </Tile>

      {groups.map((group) => (
        <Flex key={group.label} direction="column" gap="xs">
          <Text format={{ fontWeight: "demibold" }}>
            {`${group.label} (${group.names.length})`}
          </Text>
          <Divider />
          <IconRows names={group.names} size={size} color={color} />
        </Flex>
      ))}

      {groups.length === 0 && (
        <Text variant="microcopy">{`No icons match "${query}".`}</Text>
      )}
    </Flex>
  );
};

export const ICON_DEMOS = [
  {
    id: "common-icon-clickable-test-bed",
    name: "Icon clickable test bed",
    description:
      "Matrix for testing custom scraped icons as clickable controls, Link children, Button children, ButtonRow children, and direct Image data URIs.",
    package: "common",
    Component: ClickableIconTestBed,
    githubUrl: ICON_SOURCE,
    sourceCode: `<Icon name="Down" onClick={() => console.log("clicked")} />`,
  },
  {
    id: "common-icon",
    name: "Icon",
    description:
      "Superset of native <Icon>: any registered glyph, any CSS color, any pixel size — rendered as inline SVG via <Image>. Registry built from icons scraped out of HubSpot's web app. Delegates to native <Icon> when the request is natively expressible.",
    package: "common",
    Component: IconGalleryDemo,
    githubUrl: ICON_SOURCE,
    sourceCode: `<Icon name="Settings" color="#E66E50" size={24} />`,
  },
];
