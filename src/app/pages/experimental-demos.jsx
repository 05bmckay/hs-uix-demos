import React, { useMemo, useState } from "react";
import {
  Accordion,
  Alert,
  Button,
  Divider,
  Flex,
  Heading,
  Input,
  NumberInput,
  Select,
  Tab,
  Tabs,
  Tag,
  Text,
  TextArea,
  Tile,
  hubspot,
  useExtensionContext,
} from "@hubspot/ui-extensions";
import {
  Center,
  ExpandableText,
  FileInput,
  FileUpload,
  FileViewer,
  Grid,
  GridItem,
  Iframe,
  MediaObject,
  Popover,
  SettingsView,
  Stack2,
  useAssociations,
  useCrmProperties,
  Button as XpButton,
  Input as XpInput,
  Select as XpSelect,
  Toggle as XpToggle,
} from "@hubspot/ui-extensions/experimental";
import { fetchHubSpotApi } from "@hubspot/ui-extensions/experimental/api-client";
import {
  PageBreadcrumbs,
  PageLink,
  PageRoutes,
  PageTitle,
  createPageRouter,
} from "@hubspot/ui-extensions/pages";
import { createRemoteComponentInternal } from "@hubspot/ui-extensions/hs-internal";
import { STATUS_OPTIONS } from "./data.jsx";
import { ESCAPE_HATCH_DEMOS } from "./escape-hatch-demos.jsx";

const EXPERIMENTAL_DOCS =
  "https://developers.hubspot.com/docs/platform/ui-components";
const GRID_GAPS = ["small", "medium", "large"];
const DISTANCE_VALUES = ["small", "medium", "large"];

const LAB_DOCS = {
  expandable: {
    title: "ExpandableText",
    learn: "Renders long-form copy with truncation and expand/collapse controls.",
    useWhen: "Use for potentially lengthy text that should stay compact until a user opts into more detail.",
    keyProps: ["maxHeight", "expanded", "expandButtonText", "collapseButtonText"],
    guidelines: [
      "Use concise button labels.",
      "Prefer this over manually clipping text blocks.",
      "Keep critical information visible before expansion.",
    ],
    related: ["Text", "Tile"],
  },
  settings: {
    title: "SettingsView",
    learn: "Provides settings-page layout plus save bar UX with Save/Cancel callbacks.",
    useWhen: "Use for app settings workflows where users edit multiple values before committing.",
    keyProps: ["saveBarVisible", "numberOfSettingsChanged", "onSave", "onCancel"],
    guidelines: [
      "Show save bar only when edits exist.",
      "Keep changed-count accurate.",
      "Log save/cancel outcomes for easier testing.",
    ],
    related: ["Form", "Alert"],
  },
  grid: {
    title: "Grid + GridItem",
    learn: "Defines explicit column-based layout where each item gets a size allocation.",
    useWhen: "Use for dashboard/panel layouts where spatial ratios matter and should be testable.",
    keyProps: ["Grid.size", "Grid.gap", "GridItem.size", "GridItem.offset"],
    guidelines: [
      "Track total assigned columns vs grid size.",
      "Use preset ratios (e.g., 3/6/3) to validate real layout scenarios.",
      "Pair with Tile wrappers to make boundaries obvious.",
    ],
    related: ["Box", "Flex", "Tile"],
  },
  layout: {
    title: "Center + Stack2 + MediaObject",
    learn: "Composable layout primitives for centering content, vertical spacing, and left/right media slots.",
    useWhen: "Use when you need readable content rails plus icon/badge side slots without custom CSS.",
    keyProps: ["Center.maxContentSize", "Center.gutter", "Stack2.gap", "MediaObject.itemLeft", "MediaObject.itemRight"],
    guidelines: [
      "Use Center to control readable line-length.",
      "Use Stack2 for consistent vertical rhythm.",
      "Use MediaObject for title/body rows with optional side affordances.",
    ],
    related: ["Flex", "Box", "Text"],
  },
};

const safeStringify = (value) => {
  try {
    return JSON.stringify(value, null, 2);
  } catch (error) {
    return String(error);
  }
};

const JsonPanel = ({ title, data }) => (
  <Tile>
    <Flex direction="column" gap="flush">
      <Text format={{ fontWeight: "demibold" }}>{title}</Text>
      <Text>{safeStringify(data)}</Text>
    </Flex>
  </Tile>
);

const LabDocAccordion = ({ doc }) => (
  <Accordion title={`${doc.title} docs`} size="small">
    <Flex direction="column" gap="xs">
      <Text>{doc.learn}</Text>
      <Text format={{ fontWeight: "demibold" }}>Use when</Text>
      <Text>{doc.useWhen}</Text>
      <Text format={{ fontWeight: "demibold" }}>Key props</Text>
      <Flex direction="column" gap="flush">
        {doc.keyProps.map((prop) => (
          <Text key={prop} variant="microcopy">• {prop}</Text>
        ))}
      </Flex>
      <Text format={{ fontWeight: "demibold" }}>Guidelines</Text>
      <Flex direction="column" gap="flush">
        {doc.guidelines.map((guideline) => (
          <Text key={guideline} variant="microcopy">• {guideline}</Text>
        ))}
      </Flex>
      <Text format={{ fontWeight: "demibold" }}>Related</Text>
      <Text variant="microcopy">{doc.related.join(" · ")}</Text>
    </Flex>
  </Accordion>
);

const getNextValue = (list, current) => {
  const currentIndex = list.indexOf(current);
  const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % list.length;
  return list[nextIndex];
};

// ───────────────────────────────────────────────────────────────────────────
// Host component render probe
//
// createRemoteComponentInternal(name) mints host-known component names that the
// public package doesn't export. HeaderActions is one such: it reads the host's
// HeaderActionsContextProvider, which IS mounted at the app-home (location:
// "home") extension point — so it works here — but is absent on a crm.record.tab
// card, where it crashes host-side (uncatchable). It's location-gated by where
// the provider lives, not globally unusable.
// ───────────────────────────────────────────────────────────────────────────

const mintHostComponent = (name, options) => {
  try {
    return createRemoteComponentInternal(name, options);
  } catch {
    return null;
  }
};

const HeaderActions = mintHostComponent("HeaderActions");
const PrimaryHeaderActionButton = mintHostComponent("PrimaryHeaderActionButton", {
  fragmentProps: ["overlay"],
});
const SecondaryHeaderActionButton = mintHostComponent("SecondaryHeaderActionButton", {
  fragmentProps: ["overlay"],
});

class ProbeErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  render() {
    if (this.state.error) {
      return (
        <Alert variant="danger" title="Synchronous render error">
          {this.state.error instanceof Error ? this.state.error.message : String(this.state.error)}
        </Alert>
      );
    }
    return this.props.children;
  }
}

// Live outbound-fetch probe. Proves two things end to end:
//   1. hubspot.fetch can reach a permitted external URL from the worker.
//   2. The FileInput selection is a real File whose bytes we can read with
//      .arrayBuffer() and ship out — i.e. you CAN upload files yourself.
// The webhook.site URL must be listed in the app config permittedUrls.fetch.
const WEBHOOK_URL = "https://webhook.site/f64e50a1-a0eb-43a5-beca-24944528751b";

// The standalone interactive app we embed via <Iframe>. Set this to the
// deployed Cloudflare Worker URL (also add the origin to permittedUrls.iframe).
const IFRAME_APP_URL = "https://hs-uix-iframe.05bmckay.workers.dev";

// Card-side iframe embed. HubSpot's <Iframe> has no message bridge and height is
// limited to sm/md/lg, so the only "context in" is URL query params built here;
// ongoing sync must go through the app's own backend.
const IframeProbe = () => {
  const ctx = useExtensionContext();
  const params = new URLSearchParams({
    portalId: String(ctx?.portal?.id ?? ""),
    userId: String(ctx?.user?.id ?? ""),
    userEmail: ctx?.user?.email ?? "",
    appId: String(ctx?.extension?.appId ?? ""),
  }).toString();
  const src = `${IFRAME_APP_URL}/?${params}`;

  return (
    <Flex direction="column" gap="xs">
      <Text variant="microcopy">
        Embeds our own hosted app. Portal/user context is passed via URL query
        params (the only inbound channel). Inside the frame you get a real DOM —
        pointer drag, hover, canvas. No live card↔iframe bridge; sync through the
        app's backend. Height is fixed to sm/md/lg.
      </Text>
      <Iframe src={src} height="lg" />
    </Flex>
  );
};

const toHex = (buffer, max = 16) => {
  const bytes = new Uint8Array(buffer).slice(0, max);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(" ");
};

const FetchProbe = ({ log }) => {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const ping = async () => {
    setBusy(true);
    try {
      // hubspot.fetch only allows the 'Authorization' request header — any
      // other header (incl. Content-Type) is rejected with VALIDATION_ERROR.
      const res = await hubspot.fetch(WEBHOOK_URL, {
        method: "POST",
        body: JSON.stringify({ probe: "ping", at: new Date().toISOString() }),
      });
      setStatus({ kind: "ping", ok: true, httpStatus: res.status });
      log(`fetch ping -> ${res.status}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus({ kind: "ping", ok: false, error: message });
      log(`fetch ping error: ${message}`);
    }
    setBusy(false);
  };

  const sendFile = async () => {
    if (!file) {
      setStatus({ kind: "upload", ok: false, error: "Select a file first." });
      return;
    }
    setBusy(true);
    try {
      const buffer = await file.arrayBuffer();
      const res = await hubspot.fetch(WEBHOOK_URL, {
        method: "POST",
        body: JSON.stringify({
          probe: "file-bytes",
          name: file.name,
          size: file.size,
          type: file.type,
          bytesRead: buffer.byteLength,
          firstBytesHex: toHex(buffer),
        }),
      });
      setStatus({
        kind: "upload",
        ok: true,
        httpStatus: res.status,
        bytesRead: buffer.byteLength,
        fileName: file.name,
      });
      log(`fetch file ${file.name} (${buffer.byteLength} bytes) -> ${res.status}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus({ kind: "upload", ok: false, error: message });
      log(`fetch file error: ${message}`);
    }
    setBusy(false);
  };

  return (
    <Flex direction="column" gap="sm">
      <Text variant="microcopy">
        POSTs to a webhook.site endpoint via hubspot.fetch. Watch the webhook
        dashboard for incoming requests to confirm the call left the sandbox.
        Requires the URL in app config permittedUrls.fetch.
      </Text>
      <Flex direction="row" gap="xs">
        <Button variant="secondary" disabled={busy} onClick={ping}>
          Send ping
        </Button>
      </Flex>
      <Divider />
      <Text variant="microcopy">
        Select a file, then ship its real bytes (read via File.arrayBuffer) to
        the webhook — proving files are extractable from the worker.
      </Text>
      <FileInput
        name="fetch-probe-file"
        value={file ? { name: file.name } : undefined}
        onChange={(event) => {
          const candidate = event?.target?.files?.[0] ?? event?.file ?? event;
          setFile(candidate || null);
          log(`FetchProbe file selected: ${candidate?.name || "(none)"}`);
        }}
      />
      <Flex direction="row" gap="xs">
        <Button variant="primary" disabled={busy || !file} onClick={sendFile}>
          Read bytes + POST to webhook
        </Button>
      </Flex>
      <JsonPanel title="Last fetch result" data={status || { note: "No request sent yet" }} />
    </Flex>
  );
};

// FileInput is a controlled picker that does NOT upload. It only hands the
// selection to onChange. This probe captures whatever onChange delivers so we
// can see the real payload shape (a File with bytes? or just {name} after the
// worker RPC strips it?) — the type is `any`, so it's undocumented.
const FileInputProbe = ({ log }) => {
  const [value, setValue] = useState(null);
  const [shape, setShape] = useState(null);

  const handleChange = (event) => {
    let summary;
    try {
      const candidate =
        event?.target?.files?.[0] ?? event?.file ?? event?.value ?? event;
      summary = {
        eventTypeof: typeof event,
        eventKeys:
          event && typeof event === "object" ? Object.keys(event) : null,
        fileName: candidate?.name ?? null,
        fileSize: typeof candidate?.size === "number" ? candidate.size : null,
        fileType: candidate?.type ?? null,
        hasArrayBuffer: typeof candidate?.arrayBuffer === "function",
      };
      setValue(candidate?.name ? { name: candidate.name } : null);
    } catch (error) {
      summary = { error: error instanceof Error ? error.message : String(error) };
    }
    setShape(summary);
    log(`FileInput.onChange ${summary.fileName || "(no name)"}`);
  };

  return (
    <Flex direction="column" gap="sm">
      <FileInput name="probe-file" value={value || undefined} onChange={handleChange} />
      <Text variant="microcopy">
        FileInput does not upload — it only reports the selection. To persist a
        file you must read its bytes and POST to the File Manager API (typically
        from a serverless function). The panel below shows exactly what onChange
        handed us.
      </Text>
      <JsonPanel
        title="onChange payload shape"
        data={shape || { note: "No file selected yet" }}
      />
    </Flex>
  );
};

// FileUpload is the higher-level sibling of FileInput: it actually uploads to
// HubSpot's File Manager and hands back an UploadedFile ({ id, name, url }) via
// onChange. Passing attachToRecord (a CrmRecord = { objectTypeId, objectId })
// also drops the file onto that record's activity timeline. We feed the returned
// id straight into FileViewer below to prove the round-trip.
const FileUploadProbe = ({ log, onUploaded }) => {
  const ctx = useExtensionContext();
  const crmRecord = ctx?.crm?.objectId
    ? { objectTypeId: ctx.crm.objectTypeId, objectId: ctx.crm.objectId }
    : null;
  const [uploaded, setUploaded] = useState(null);
  const [attach, setAttach] = useState(false);
  const [viewing, setViewing] = useState(false);

  const handleChange = (file) => {
    setUploaded(file);
    if (!file) setViewing(false);
    // Share the real id with the standalone FileViewer probe so it can be
    // tested without hand-typing a (likely non-existent) id.
    if (file && onUploaded) onUploaded(file);
    log(`FileUpload.onChange ${file ? `#${file.id} ${file.name}` : "(cleared)"}`);
  };

  return (
    <Flex direction="column" gap="sm">
      <Text variant="microcopy">
        Unlike FileInput, this uploads to the File Manager and returns
        {" "}
        <Text format={{ fontWeight: "demibold" }}>{"{ id, name, url }"}</Text> on
        completion. Toggle attach-to-record to also pin it to this record's
        timeline (needs a CRM record context).
      </Text>
      <Flex direction="row" gap="xs" align="center">
        <Button
          variant="secondary"
          disabled={!crmRecord}
          onClick={() => {
            setAttach((prev) => !prev);
            log(`FileUpload.attachToRecord ${!attach ? "on" : "off"}`);
          }}
        >
          {attach ? "Attach to record: ON" : "Attach to record: OFF"}
        </Button>
        <Text variant="microcopy">
          {crmRecord
            ? `${crmRecord.objectTypeId} / ${crmRecord.objectId}`
            : "No CRM record context here"}
        </Text>
      </Flex>
      <FileUpload
        value={uploaded || undefined}
        onChange={handleChange}
        attachToRecord={attach && crmRecord ? crmRecord : undefined}
      />
      <JsonPanel
        title="UploadedFile (onChange payload)"
        data={uploaded || { note: "No file uploaded yet" }}
      />
      {uploaded && (
        <Flex direction="column" gap="xs">
          <Flex direction="row" gap="xs">
            <Button
              variant="secondary"
              onClick={() => {
                setViewing((prev) => !prev);
                log(`FileViewer ${!viewing ? "show" : "hide"} #${uploaded.id}`);
              }}
            >
              {viewing ? "Hide in FileViewer" : `View #${uploaded.id} in FileViewer`}
            </Button>
            <Button variant="secondary" onClick={() => handleChange(null)}>
              Clear
            </Button>
          </Flex>
          {viewing && (
            <Tile>
              <FileViewer fileId={uploaded.id} />
            </Tile>
          )}
        </Flex>
      )}
    </Flex>
  );
};

// FileViewer renders an existing File Manager asset by numeric id — no upload,
// no picker. This probe lets you punch in any file id to confirm what the host
// renders (inline preview vs. download chip) for different file types.
const FileViewerProbe = ({ log, lastUpload }) => {
  const [draftId, setDraftId] = useState(null);
  const [fileId, setFileId] = useState(null);

  return (
    <Flex direction="column" gap="sm">
      <Text variant="microcopy">
        Renders a File Manager asset by id. The id must be a real file in this
        portal — a made-up number renders nothing. Easiest test: upload via the
        FileUpload probe first, then use its id here.
      </Text>
      {lastUpload && (
        <Button
          variant="secondary"
          onClick={() => {
            setDraftId(lastUpload.id);
            setFileId(lastUpload.id);
            log(`FileViewer.render (last upload) #${lastUpload.id}`);
          }}
        >
          Use last uploaded #{lastUpload.id} ({lastUpload.name})
        </Button>
      )}
      <Flex direction="row" gap="xs" align="end">
        <NumberInput
          label="File id"
          name="file-viewer-id"
          value={draftId ?? undefined}
          onChange={(value) => setDraftId(value)}
        />
        <Button
          variant="primary"
          disabled={!Number.isFinite(draftId)}
          onClick={() => {
            setFileId(draftId);
            log(`FileViewer.render #${draftId}`);
          }}
        >
          Render
        </Button>
      </Flex>
      {fileId !== null && Number.isFinite(fileId) ? (
        <Tile>
          <FileViewer fileId={fileId} />
        </Tile>
      ) : (
        <JsonPanel title="FileViewer" data={{ note: "Enter a real file id and click Render" }} />
      )}
    </Flex>
  );
};

// fetchHubSpotApi (new in 0.13.2, from @hubspot/ui-extensions/experimental/
// api-client) is an authenticated proxy to HubSpot's OWN REST API — relative
// path, rides the app's auth/scopes, no serverless function and no
// permittedUrls entry. Unlike hubspot.fetch (arbitrary external URLs, only the
// Authorization header allowed), this only hits HubSpot endpoints but handles
// auth for you and validates the request shape with typed errors.
const HS_API_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"].map((m) => ({
  label: m,
  value: m,
}));

const HS_API_PRESETS = [
  { label: "Account details", method: "GET", path: "/account-info/v3/details", body: "" },
  {
    label: "Contacts (3)",
    method: "GET",
    path: "/crm/v3/objects/contacts?limit=3&properties=email,firstname,lastname",
    body: "",
  },
  {
    label: "Contact search (POST)",
    method: "POST",
    path: "/crm/v3/objects/contacts/search",
    body: '{\n  "limit": 3,\n  "sorts": [{ "propertyName": "createdate", "direction": "DESCENDING" }]\n}',
  },
  // Path with no leading slash trips the client-side validator before any
  // network call, surfacing a typed InvalidApiPathError.
  { label: "Bad path → typed error", method: "GET", path: "account-info/v3/details", body: "" },
];

const FetchHubSpotApiProbe = ({ log }) => {
  const [method, setMethod] = useState("GET");
  const [path, setPath] = useState("/account-info/v3/details");
  const [bodyText, setBodyText] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const applyPreset = (preset) => {
    setMethod(preset.method);
    setPath(preset.path);
    setBodyText(preset.body);
    setResult(null);
    log(`fetchHubSpotApi preset: ${preset.label}`);
  };

  const send = async () => {
    setBusy(true);
    setResult(null);
    // Default an Accept header — testing whether the client only serializes the
    // response body back across the worker boundary on explicit content negotiation.
    const request = { path, method, headers: { Accept: "application/json" } };
    if (method !== "GET" && bodyText.trim()) {
      try {
        request.body = JSON.parse(bodyText);
        request.contentType = "application/json";
      } catch (error) {
        setResult({ ok: false, kind: "client", error: `Body is not valid JSON: ${error.message}` });
        setBusy(false);
        return;
      }
    }
    try {
      const res = await fetchHubSpotApi(request);
      // typeof null === "object", so distinguish null explicitly; dump all keys
      // in case the body is delivered under a different/non-obvious field.
      setResult({
        ok: true,
        status: res?.status,
        headers: res?.headers,
        responseKeys: res && typeof res === "object" ? Object.keys(res) : null,
        bodyType: res?.body === null ? "null" : typeof res?.body,
        body: res?.body,
      });
      log(
        `fetchHubSpotApi ${method} ${path} -> ${res?.status} (body ${
          res?.body === null ? "null" : typeof res?.body
        })`
      );
    } catch (error) {
      // Validation errors set error.name (InvalidApiPathError, etc.); API/network
      // failures surface here too. Show the class name to prove the typed errors.
      setResult({
        ok: false,
        kind: "thrown",
        errorName: error?.name || "Error",
        error: error instanceof Error ? error.message : String(error),
      });
      log(`fetchHubSpotApi error [${error?.name}]: ${error?.message || error}`);
    }
    setBusy(false);
  };

  return (
    <Flex direction="column" gap="sm">
      <Text variant="microcopy">
        Authenticated proxy to HubSpot's own REST API — no serverless function,
        no permittedUrls. The path must start with "/" and uses the app's
        scopes. Body applies to non-GET requests.
      </Text>
      <Flex direction="row" gap="xs">
        {HS_API_PRESETS.map((preset) => (
          <Button key={preset.label} variant="secondary" onClick={() => applyPreset(preset)}>
            {preset.label}
          </Button>
        ))}
      </Flex>
      <Select
        label="Method"
        name="hs-api-method"
        value={method}
        options={HS_API_METHODS}
        onChange={(value) => setMethod(value)}
      />
      <Input
        label="Path"
        name="hs-api-path"
        value={path}
        onChange={(value) => setPath(value)}
      />
      {method !== "GET" && (
        <TextArea
          label="Body (JSON)"
          name="hs-api-body"
          value={bodyText}
          onChange={(value) => setBodyText(value)}
        />
      )}
      <Flex direction="row" gap="xs">
        <Button variant="primary" disabled={busy || !path} onClick={send}>
          {busy ? "Sending…" : `Send ${method}`}
        </Button>
      </Flex>
      <JsonPanel title="Response / error" data={result || { note: "No request sent yet" }} />
      {result?.ok &&
        result.status >= 200 &&
        result.status < 300 &&
        result.bodyType === "null" && (
          <Alert variant="warning" title="Status only — no response body">
            The call reached HubSpot and returned {result.status} (so auth +
            scopes work), but this SDK build surfaces only the status line —
            headers and body come back empty/null even with an Accept header.
            Confirmed limitation of the experimental client at platformVersion
            2026.03 / @hubspot/ui-extensions 0.14.2. Use it to check status/side
            effects; for response data you still need a serverless function or
            hubspot.fetch.
          </Alert>
        )}
    </Flex>
  );
};

const PROBES = [
  {
    id: "header-actions",
    group: "App Home header",
    name: "HeaderActions + Primary/Secondary buttons",
    note:
      "Minted by name (not publicly exported). Works at the app-home (location: \"home\") extension point because the host mounts HeaderActionsContextProvider here; it crashes on a crm.record.tab card where that provider is absent.",
    available: () =>
      Boolean(HeaderActions && PrimaryHeaderActionButton && SecondaryHeaderActionButton),
    render: (log) => (
      <HeaderActions>
        <PrimaryHeaderActionButton onClick={() => log("PrimaryHeaderActionButton.onClick")}>
          Primary action
        </PrimaryHeaderActionButton>
        <SecondaryHeaderActionButton onClick={() => log("SecondaryHeaderActionButton.onClick")}>
          Secondary action
        </SecondaryHeaderActionButton>
      </HeaderActions>
    ),
  },
  {
    id: "page-breadcrumbs",
    group: "App Page chrome",
    name: "PageBreadcrumbs + Current",
    note: "Breadcrumb trail. Expects page-router context to resolve links.",
    available: () => Boolean(PageBreadcrumbs),
    render: () => (
      <PageBreadcrumbs>
        <PageBreadcrumbs.Current>Current page</PageBreadcrumbs.Current>
      </PageBreadcrumbs>
    ),
  },
  {
    id: "page-title",
    group: "App Page chrome",
    name: "PageTitle",
    note: "Renders a page title region.",
    available: () => Boolean(PageTitle),
    render: () => <PageTitle>Just made this up</PageTitle>,
  },
  {
    id: "popover",
    group: "Experimental",
    name: "Popover (overlay trigger)",
    note:
      "Overlay shown from a Button's `overlay` prop, same slot as Modal/Panel. The renderer wraps children in a compact Tile, so don't add your own.",
    available: () => Boolean(Popover),
    render: (log) => (
      <Button
        variant="secondary"
        onClick={() => log("Popover trigger clicked")}
        overlay={
          <Popover id="probe-popover" title="Probe popover">
            <Text>Popover body content rendered from the overlay slot.</Text>
          </Popover>
        }
      >
        Open popover
      </Button>
    ),
  },
  {
    id: "fetch-webhook",
    group: "Live fetch",
    name: "hubspot.fetch → webhook.site (+ file bytes)",
    note:
      "Live outbound test: POSTs to a permitted webhook.site URL, and ships a selected file's real bytes (File.arrayBuffer) out. Watch the webhook dashboard.",
    available: () => typeof hubspot?.fetch === "function",
    render: (log) => <FetchProbe log={log} />,
  },
  {
    id: "fetch-hubspot-api",
    group: "Live fetch",
    name: "fetchHubSpotApi (experimental REST API client)",
    note:
      "New in 0.13.2, from @hubspot/ui-extensions/experimental/api-client. Authenticated proxy to HubSpot's own API straight from the card — relative path, app-scoped auth, no serverless function and no permittedUrls. KNOWN LIMITATION (0.14.2): returns the status line only — response headers/body come back empty/null, so it's status/side-effect only for now. Typed validation errors (InvalidApiPathError, etc.) work — try the 'Bad path' preset.",
    available: () => typeof fetchHubSpotApi === "function",
    render: (log) => <FetchHubSpotApiProbe log={log} />,
  },
  {
    id: "file-input",
    group: "Experimental",
    name: "FileInput (controlled picker — does NOT upload)",
    note:
      "Captures a file selection only; no upload happens. This probe logs the exact onChange payload so we can see whether file bytes survive the worker boundary or degrade to {name}.",
    available: () => Boolean(FileInput),
    render: (log) => <FileInputProbe log={log} />,
  },
  {
    id: "file-upload",
    group: "Experimental",
    name: "FileUpload (uploads + returns { id, name, url })",
    note:
      "The uploading sibling of FileInput. Pushes the file to the File Manager and returns an UploadedFile on onChange; optional attachToRecord pins it to the record timeline. The returned id is fed into FileViewer to confirm the round-trip.",
    available: () => Boolean(FileUpload && FileViewer),
    render: (log, shared) => (
      <FileUploadProbe log={log} onUploaded={shared?.setLastUpload} />
    ),
  },
  {
    id: "file-viewer",
    group: "Experimental",
    name: "FileViewer (renders an existing file by id)",
    note:
      "Renders a File Manager asset by numeric id — no picker, no upload. Punch in any file id (or reuse one from FileUpload) to see how the host presents different file types.",
    available: () => Boolean(FileViewer),
    render: (log, shared) => (
      <FileViewerProbe log={log} lastUpload={shared?.lastUpload} />
    ),
  },
  {
    id: "iframe",
    group: "Iframe (custom UI)",
    name: "Iframe → our own interactive app",
    note:
      "Embeds a hosted app (Cloudflare Worker) with portal/user context in the URL. Real DOM inside = pointer drag/canvas. Requires IFRAME_APP_URL deployed and its origin in permittedUrls.iframe.",
    available: () => Boolean(Iframe),
    render: () => <IframeProbe />,
  },
  {
    id: "xp-primitives",
    group: "Experimental primitives",
    name: "Experimental Button/Input/Select/Toggle",
    note:
      "Next-gen variants of the standard form primitives from @hubspot/ui-extensions/experimental.",
    available: () => Boolean(XpButton && XpInput && XpSelect && XpToggle),
    render: (log) => (
      <Flex direction="column" gap="sm">
        <XpButton onClick={() => log("Experimental.Button.onClick")}>Experimental button</XpButton>
        <XpInput
          label="Experimental input"
          name="xp-input"
          onInput={() => log("Experimental.Input.onInput")}
        />
        <XpSelect
          label="Experimental select"
          name="xp-select"
          options={STATUS_OPTIONS}
          onChange={() => log("Experimental.Select.onChange")}
        />
        <XpToggle label="Experimental toggle" onChange={() => log("Experimental.Toggle.onChange")} />
      </Flex>
    ),
  },
];

const ExperimentalInteractiveLabDemo = () => {
  const [activeLabTab, setActiveLabTab] = useState("expandable");
  const [events, setEvents] = useState([]);
  const [labProps, setLabProps] = useState({
    expandable: {
      maxHeight: 42,
      expanded: false,
      expandButtonText: "Show more",
      collapseButtonText: "Show less",
    },
    settings: {
      saveBarVisible: true,
      numberOfSettingsChanged: 1,
    },
    grid: {
      size: 12,
      leftSize: 4,
      centerSize: 4,
      rightSize: 4,
      gap: "small",
    },
    layout: {
      stackGap: "small",
      centerGutter: "small",
      maxContentSize: 640,
      showRightSlot: true,
    },
  });

  const activeProps = labProps[activeLabTab];
  const gridSummary = useMemo(() => {
    const { size, leftSize, centerSize, rightSize, gap } = labProps.grid;
    const totalAssigned = leftSize + centerSize + rightSize;
    const remaining = size - totalAssigned;

    return {
      size,
      gap,
      leftSize,
      centerSize,
      rightSize,
      totalAssigned,
      remaining,
      overflow: totalAssigned > size,
    };
  }, [labProps.grid]);

  const logEvent = (name, payload) => {
    setEvents((existing) => [
      {
        time: new Date().toLocaleTimeString(),
        name,
        payload,
      },
      ...existing,
    ].slice(0, 25));
  };

  const updateLabProps = (subject, updater) => {
    setLabProps((current) => ({
      ...current,
      [subject]: {
        ...current[subject],
        ...updater(current[subject]),
      },
    }));
  };

  const applyGridPreset = (name, preset) => {
    updateLabProps("grid", () => preset);
    logEvent("Grid.preset", { name, preset });
  };

  const cycleGridGap = () => {
    updateLabProps("grid", (prev) => {
      const currentIndex = GRID_GAPS.indexOf(prev.gap);
      const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % GRID_GAPS.length;
      const nextGap = GRID_GAPS[nextIndex];
      logEvent("Grid.gap", { previous: prev.gap, next: nextGap });
      return { gap: nextGap };
    });
  };

  return (
    <Flex direction="column" gap="md">
      <Tile>
        <Flex direction="column" gap="flush">
          <Text format={{ fontWeight: "demibold" }}>Working components lab</Text>
          <Text variant="microcopy">
            Streamlined to the components currently behaving well in your runtime.
          </Text>
        </Flex>
      </Tile>

      <Tabs selected={activeLabTab} onSelectedChange={setActiveLabTab}>
        <Tab tabId="expandable" title="ExpandableText">
          <Flex direction="column" gap="md">
            <LabDocAccordion doc={LAB_DOCS.expandable} />
            <Tile>
              <Flex direction="row" gap="xs" align="center" justify="between">
                <Text format={{ fontWeight: "demibold" }}>Controls</Text>
                <Flex direction="row" gap="xs">
                  <Button
                    variant="secondary"
                    onClick={() => updateLabProps("expandable", (prev) => ({
                      expanded: !prev.expanded,
                    }))}
                  >
                    Toggle expanded
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => updateLabProps("expandable", (prev) => ({
                      maxHeight: Math.max(24, prev.maxHeight - 10),
                    }))}
                  >
                    Max height -10
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => updateLabProps("expandable", (prev) => ({
                      maxHeight: prev.maxHeight + 10,
                    }))}
                  >
                    Max height +10
                  </Button>
                </Flex>
              </Flex>
            </Tile>
            <Tile>
              <ExpandableText
                maxHeight={labProps.expandable.maxHeight}
                expanded={labProps.expandable.expanded}
                expandButtonText={labProps.expandable.expandButtonText}
                collapseButtonText={labProps.expandable.collapseButtonText}
              >
                This preview intentionally includes a long body so you can test expansion behavior,
                overflow clipping, and the effect of changing maxHeight. Use the controls above and
                compare active props and emitted output data below.
              </ExpandableText>
            </Tile>
          </Flex>
        </Tab>

        <Tab tabId="settings" title="SettingsView">
          <Flex direction="column" gap="md">
            <LabDocAccordion doc={LAB_DOCS.settings} />
            <Tile>
              <Flex direction="row" gap="xs" align="center" justify="between">
                <Text format={{ fontWeight: "demibold" }}>Controls</Text>
                <Flex direction="row" gap="xs">
                  <Button
                    variant="secondary"
                    onClick={() => updateLabProps("settings", (prev) => ({
                      saveBarVisible: !prev.saveBarVisible,
                    }))}
                  >
                    Toggle save bar
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => updateLabProps("settings", (prev) => ({
                      numberOfSettingsChanged: Math.max(0, prev.numberOfSettingsChanged - 1),
                    }))}
                  >
                    Changed -1
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => updateLabProps("settings", (prev) => ({
                      numberOfSettingsChanged: prev.numberOfSettingsChanged + 1,
                    }))}
                  >
                    Changed +1
                  </Button>
                </Flex>
              </Flex>
            </Tile>
            <Center maxContentSize={640} gutter="small">
              <SettingsView
                saveBarVisible={labProps.settings.saveBarVisible}
                numberOfSettingsChanged={labProps.settings.numberOfSettingsChanged}
                onSave={() => logEvent("SettingsView.onSave", {
                  numberOfSettingsChanged: labProps.settings.numberOfSettingsChanged,
                })}
                onCancel={() => logEvent("SettingsView.onCancel", {
                  numberOfSettingsChanged: labProps.settings.numberOfSettingsChanged,
                })}
              >
                <Stack2 gap="small">
                  <Heading>SettingsView preview</Heading>
                  <Text>Use the save bar controls above, then click Save/Cancel in the preview.</Text>
                  <Text variant="microcopy">
                    Save/Cancel event payloads appear in the output log panel below.
                  </Text>
                </Stack2>
              </SettingsView>
            </Center>
          </Flex>
        </Tab>

        <Tab tabId="grid" title="Grid">
          <Flex direction="column" gap="md">
            <LabDocAccordion doc={LAB_DOCS.grid} />
            <Tile>
              <Flex direction="column" gap="xs">
                <Text format={{ fontWeight: "demibold" }}>Test bed controls</Text>
                <Flex direction="row" gap="sm" align="center">
                  <Button
                    variant="secondary"
                    onClick={() => applyGridPreset("Equal columns", {
                      size: 12,
                      leftSize: 4,
                      centerSize: 4,
                      rightSize: 4,
                      gap: "small",
                    })}
                  >
                    Preset: 4/4/4
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => applyGridPreset("Sidebar", {
                      size: 12,
                      leftSize: 3,
                      centerSize: 6,
                      rightSize: 3,
                      gap: "medium",
                    })}
                  >
                    Preset: 3/6/3
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => applyGridPreset("Feature center", {
                      size: 12,
                      leftSize: 2,
                      centerSize: 8,
                      rightSize: 2,
                      gap: "large",
                    })}
                  >
                    Preset: 2/8/2
                  </Button>
                </Flex>
                <Flex direction="row" gap="sm" align="center">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      updateLabProps("grid", (prev) => ({ size: Math.max(6, prev.size - 1) }));
                      logEvent("Grid.size", { direction: "decrease" });
                    }}
                  >
                    Size -
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      updateLabProps("grid", (prev) => ({ size: Math.min(16, prev.size + 1) }));
                      logEvent("Grid.size", { direction: "increase" });
                    }}
                  >
                    Size +
                  </Button>
                  <Button variant="secondary" onClick={cycleGridGap}>
                    Cycle gap
                  </Button>
                </Flex>
                <Flex direction="row" gap="sm" align="center">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      updateLabProps("grid", (prev) => ({ leftSize: Math.max(1, prev.leftSize - 1) }));
                      logEvent("Grid.leftSize", { direction: "decrease" });
                    }}
                  >
                    Left -
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      updateLabProps("grid", (prev) => ({ leftSize: Math.min(16, prev.leftSize + 1) }));
                      logEvent("Grid.leftSize", { direction: "increase" });
                    }}
                  >
                    Left +
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      updateLabProps("grid", (prev) => ({ centerSize: Math.max(1, prev.centerSize - 1) }));
                      logEvent("Grid.centerSize", { direction: "decrease" });
                    }}
                  >
                    Center -
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      updateLabProps("grid", (prev) => ({ centerSize: Math.min(16, prev.centerSize + 1) }));
                      logEvent("Grid.centerSize", { direction: "increase" });
                    }}
                  >
                    Center +
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      updateLabProps("grid", (prev) => ({ rightSize: Math.max(1, prev.rightSize - 1) }));
                      logEvent("Grid.rightSize", { direction: "decrease" });
                    }}
                  >
                    Right -
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      updateLabProps("grid", (prev) => ({ rightSize: Math.min(16, prev.rightSize + 1) }));
                      logEvent("Grid.rightSize", { direction: "increase" });
                    }}
                  >
                    Right +
                  </Button>
                </Flex>
              </Flex>
            </Tile>

            <Tile>
              <Text variant="microcopy">
                {gridSummary.overflow
                  ? `Assigned ${gridSummary.totalAssigned} columns in a grid size of ${gridSummary.size} (overflow expected).`
                  : `Assigned ${gridSummary.totalAssigned} of ${gridSummary.size} columns. Remaining: ${gridSummary.remaining}.`}
              </Text>
            </Tile>

            <Tile>
              <Text format={{ fontWeight: "demibold" }}>Tile-based live preview</Text>
              <Grid size={labProps.grid.size} gap={labProps.grid.gap}>
                <GridItem size={labProps.grid.leftSize}>
                  <Tile>
                    <Flex direction="column" gap="flush">
                      <Text format={{ fontWeight: "demibold" }}>Left</Text>
                      <Text>size={labProps.grid.leftSize}</Text>
                    </Flex>
                  </Tile>
                </GridItem>
                <GridItem size={labProps.grid.centerSize}>
                  <Tile>
                    <Flex direction="column" gap="flush">
                      <Text format={{ fontWeight: "demibold" }}>Center</Text>
                      <Text>size={labProps.grid.centerSize}</Text>
                    </Flex>
                  </Tile>
                </GridItem>
                <GridItem size={labProps.grid.rightSize}>
                  <Tile>
                    <Flex direction="column" gap="flush">
                      <Text format={{ fontWeight: "demibold" }}>Right</Text>
                      <Text>size={labProps.grid.rightSize}</Text>
                    </Flex>
                  </Tile>
                </GridItem>
              </Grid>
            </Tile>

            <JsonPanel title="Grid math" data={gridSummary} />
          </Flex>
        </Tab>

        <Tab tabId="layout" title="Layout + MediaObject">
          <Flex direction="column" gap="md">
            <LabDocAccordion doc={LAB_DOCS.layout} />
            <Tile>
              <Flex direction="column" gap="sm">
                <Text format={{ fontWeight: "demibold" }}>Controls</Text>
                <Flex direction="row" gap="sm" align="center">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      updateLabProps("layout", (prev) => ({
                        stackGap: getNextValue(DISTANCE_VALUES, prev.stackGap),
                      }));
                      logEvent("Layout.stackGap", {
                        next: getNextValue(DISTANCE_VALUES, labProps.layout.stackGap),
                      });
                    }}
                  >
                    Cycle stack gap
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      updateLabProps("layout", (prev) => ({
                        centerGutter: getNextValue(DISTANCE_VALUES, prev.centerGutter),
                      }));
                      logEvent("Layout.centerGutter", {
                        next: getNextValue(DISTANCE_VALUES, labProps.layout.centerGutter),
                      });
                    }}
                  >
                    Cycle center gutter
                  </Button>
                </Flex>
                <Flex direction="row" gap="sm" align="center">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      updateLabProps("layout", (prev) => ({
                        maxContentSize: Math.max(320, prev.maxContentSize - 80),
                      }));
                      logEvent("Layout.maxContentSize", { direction: "decrease" });
                    }}
                  >
                    Width -
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      updateLabProps("layout", (prev) => ({
                        maxContentSize: Math.min(960, prev.maxContentSize + 80),
                      }));
                      logEvent("Layout.maxContentSize", { direction: "increase" });
                    }}
                  >
                    Width +
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      updateLabProps("layout", (prev) => ({ showRightSlot: !prev.showRightSlot }));
                      logEvent("MediaObject.rightSlot", { enabled: !labProps.layout.showRightSlot });
                    }}
                  >
                    Toggle right slot
                  </Button>
                </Flex>
              </Flex>
            </Tile>

            <Flex direction="column" gap="md" align="start">
              <Tile>
                <Flex direction="column" gap="flush">
                  <Text format={{ fontWeight: "demibold" }}>Experimental preview</Text>
                  <Center
                    maxContentSize={labProps.layout.maxContentSize}
                    gutter={labProps.layout.centerGutter}
                  >
                    <Stack2 gap={labProps.layout.stackGap}>
                      <Tile>
                        <Text>Stack row A</Text>
                      </Tile>
                      <Tile>
                        <Text>Stack row B</Text>
                      </Tile>
                      <Tile>
                        <Text>Stack row C</Text>
                      </Tile>
                      <MediaObject
                        itemLeft={
                          <Tile>
                            <Text variant="microcopy">Left slot</Text>
                          </Tile>
                        }
                        itemRight={
                          labProps.layout.showRightSlot
                            ? (
                              <Tile>
                                <Text variant="microcopy">Right slot</Text>
                              </Tile>
                            )
                            : undefined
                        }
                      >
                        <Tile>
                          <Text>
                            MediaObject body area. Toggle right slot and adjust spacing controls to verify behavior.
                          </Text>
                        </Tile>
                      </MediaObject>
                    </Stack2>
                  </Center>
                </Flex>
              </Tile>

              <Tile>
                <Flex direction="column" gap="flush">
                  <Text format={{ fontWeight: "demibold" }}>Baseline reference</Text>
                  <Text variant="microcopy">
                    Static layout for side-by-side comparison. If only this side changes, the experimental components are likely not rendering in this runtime.
                  </Text>
                  <Tile>
                    <Text>Reference row A</Text>
                  </Tile>
                  <Tile>
                    <Text>Reference row B</Text>
                  </Tile>
                  <Tile>
                    <Text>Reference row C</Text>
                  </Tile>
                </Flex>
              </Tile>
            </Flex>

            <JsonPanel title="Layout props" data={labProps.layout} />
          </Flex>
        </Tab>


      </Tabs>

      <Divider />

      <Flex direction="row" gap="sm" align="start">
        <JsonPanel title="Active props" data={activeProps} />
        <JsonPanel title="Latest output" data={events[0] || { message: "No events emitted yet" }} />
      </Flex>

      <Tile>
        <Flex direction="column" gap="flush">
          <Flex direction="row" justify="between" align="center">
            <Text format={{ fontWeight: "demibold" }}>Event log</Text>
            <Button variant="secondary" onClick={() => setEvents([])}>
              Clear log
            </Button>
          </Flex>
          {events.length === 0 ? (
            <Text variant="microcopy">No events captured yet.</Text>
          ) : (
            <Flex direction="column" gap="flush">
              {events.map((entry, index) => (
                <Text key={`${entry.time}-${entry.name}-${index}`} variant="microcopy">
                  [{entry.time}] {entry.name}: {safeStringify(entry.payload)}
                </Text>
              ))}
            </Flex>
          )}
        </Flex>
      </Tile>
    </Flex>
  );
};

const ExperimentalHooksDemo = () => {
  const crm = useCrmProperties(["firstname", "lastname", "email"]);
  const associations = useAssociations(
    {
      toObjectType: "companies",
      properties: ["name"],
      pageLength: 5,
    },
    {
      propertiesToFormat: ["name"],
    }
  );

  const summary = useMemo(
    () => ({
      crmLoading: crm.isLoading,
      crmError: crm.error?.message || null,
      crmProperties: crm.properties,
      associationsLoading: associations.isLoading,
      associationsError: associations.error?.message || null,
      associationsCount: associations.results.length,
      currentPage: associations.pagination.currentPage,
      hasNextPage: associations.pagination.hasNextPage,
      hasPreviousPage: associations.pagination.hasPreviousPage,
    }),
    [associations, crm]
  );

  return (
    <Flex direction="column" gap="sm">
      <Text>
        This probe calls useCrmProperties and useAssociations from the experimental API.
      </Text>
      <Flex direction="row" gap="xs">
        <Button variant="secondary" onClick={() => crm.refetch()}>
          Refetch properties
        </Button>
        <Button variant="secondary" onClick={() => associations.refetch()}>
          Refetch associations
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            if (associations.pagination.hasNextPage) {
              associations.pagination.nextPage();
            }
          }}
        >
          Next page
        </Button>
      </Flex>
      <Text>{JSON.stringify(summary, null, 2)}</Text>
    </Flex>
  );
};

const ExperimentalPagesDemo = () => {
  const canCreateRouter = typeof createPageRouter === "function";
  const hasRouteDescriptors = Boolean(PageRoutes?.Route && PageRoutes?.IndexRoute && PageRoutes?.AnyRoute);

  return (
    <Flex direction="column" gap="sm">
      <Text>
        Experimental pages exports are available in this runtime:
      </Text>
      <Text>
        {JSON.stringify(
          {
            createPageRouter: canCreateRouter,
            pageRoutesDescriptorApi: hasRouteDescriptors,
          },
          null,
          2
        )}
      </Text>
      <PageLink to="/experimental/sandbox">Try PageLink to /experimental/sandbox</PageLink>
    </Flex>
  );
};

const ProbeMatrixDemo = () => {
  const [mounted, setMounted] = useState({});
  const [results, setResults] = useState({});
  const [events, setEvents] = useState([]);
  // Shared across probe cards: the last file uploaded via the FileUpload probe,
  // so the standalone FileViewer probe can render a real id. Lives here (not in
  // a probe) so it survives individual cards mounting/unmounting.
  const [lastUpload, setLastUpload] = useState(null);

  const logEvent = (message) =>
    setEvents((existing) =>
      [{ time: new Date().toLocaleTimeString(), message }, ...existing].slice(0, 25)
    );

  const toggleMount = (id) =>
    setMounted((current) => ({ ...current, [id]: !current[id] }));

  const recordVerdict = (id, verdict, message) =>
    setResults((current) => ({
      ...current,
      [id]: {
        verdict,
        message: message || null,
        time: new Date().toLocaleTimeString(),
      },
    }));

  const groups = PROBES.reduce((acc, probe) => {
    (acc[probe.group] = acc[probe.group] || []).push(probe);
    return acc;
  }, {});

  return (
    <Flex direction="column" gap="md">
      <Alert variant="warning" title="How this probe works">
        Each card mounts one host component by name. Names the host knows render;
        unknown names can crash the whole card with an "Unsupported component"
        error. Mount one at a time, watch the live area, then record whether it
        rendered. Async host failures can take the card down even though the
        in-page error boundary only catches synchronous React errors.
      </Alert>

      {Object.entries(groups).map(([group, probes]) => (
        <Flex key={group} direction="column" gap="sm">
          <Flex direction="row" gap="xs" align="center">
            <Tag>{group}</Tag>
          </Flex>
          {probes.map((probe) => {
            const isMounted = !!mounted[probe.id];
            const result = results[probe.id];
            const available = probe.available ? probe.available() : true;
            return (
              <Tile key={probe.id}>
                <Flex direction="column" gap="sm">
                  <Flex direction="row" justify="between" align="center" gap="sm">
                    <Flex direction="column" gap="flush">
                      <Text format={{ fontWeight: "demibold" }}>{probe.name}</Text>
                      <Text variant="microcopy">{probe.note}</Text>
                    </Flex>
                    <Button
                      variant={isMounted ? "destructive" : "secondary"}
                      disabled={!available}
                      onClick={() => toggleMount(probe.id)}
                    >
                      {isMounted ? "Unmount" : "Mount"}
                    </Button>
                  </Flex>

                  {!available && (
                    <Text variant="microcopy">
                      {probe.blocked
                        ? "Blocked — see note above. Mounting would crash the card."
                        : "Component reference unavailable in this SDK build."}
                    </Text>
                  )}

                  {isMounted && available && (
                    <Tile>
                      <Flex direction="column" gap="sm">
                        <Text variant="microcopy">Live render:</Text>
                        <ProbeErrorBoundary
                          key={`${probe.id}-boundary`}
                          onError={(error) =>
                            recordVerdict(
                              probe.id,
                              "error",
                              error instanceof Error ? error.message : String(error)
                            )
                          }
                        >
                          {probe.render(logEvent, { lastUpload, setLastUpload })}
                        </ProbeErrorBoundary>
                        <Flex direction="row" gap="xs">
                          <Button
                            variant="secondary"
                            onClick={() => recordVerdict(probe.id, "renders")}
                          >
                            ✓ Renders
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => recordVerdict(probe.id, "broken")}
                          >
                            ✗ Doesn't render
                          </Button>
                        </Flex>
                      </Flex>
                    </Tile>
                  )}

                  {result && (
                    <Text variant="microcopy">
                      Last verdict: {result.verdict}
                      {result.message ? ` — ${result.message}` : ""} ({result.time})
                    </Text>
                  )}
                </Flex>
              </Tile>
            );
          })}
        </Flex>
      ))}

      <Divider />
      <Flex direction="row" gap="sm" align="start">
        <JsonPanel title="Recorded results" data={results} />
        <JsonPanel
          title="Latest event"
          data={events[0] || { message: "No events captured yet" }}
        />
      </Flex>
    </Flex>
  );
};

export const EXPERIMENTAL_DEMOS = [
  {
    id: "exp-components",
    name: "Interactive Experimental Lab",
    description:
      "Interactive prop controls + live previews + event/output logging for the confirmed working experimental components.",
    package: "experimental",
    Component: ExperimentalInteractiveLabDemo,
    githubUrl: EXPERIMENTAL_DOCS,
    sourceCode: `import { Center, ExpandableText, Grid, GridItem, MediaObject, SettingsView, Stack2 } from "@hubspot/ui-extensions/experimental";`,
  },
  {
    id: "exp-hooks",
    name: "Experimental CRM Hooks",
    description:
      "Calls useCrmProperties + useAssociations and exposes loading/error/refetch/pagination state.",
    package: "experimental",
    Component: ExperimentalHooksDemo,
    githubUrl: EXPERIMENTAL_DOCS,
    sourceCode: `import { useCrmProperties, useAssociations } from "@hubspot/ui-extensions/experimental";`,
  },
  {
    id: "exp-pages",
    name: "Experimental Pages API Surface",
    description:
      "Checks PageRoutes/createPageRouter availability and exercises PageLink navigation.",
    package: "experimental",
    Component: ExperimentalPagesDemo,
    githubUrl: EXPERIMENTAL_DOCS,
    sourceCode: `import { PageLink, PageRoutes, createPageRouter } from "@hubspot/ui-extensions/pages";`,
  },
  {
    id: "exp-render-probe",
    name: "Host Component Render Probe",
    description:
      "Mounts host-known-but-unexported components (app-home header actions, page chrome, experimental Iframe/Popover/FileInput/FileUpload/FileViewer, experimental primitives) and live data probes (hubspot.fetch, fetchHubSpotApi REST client) one at a time, recording what actually renders/works at this extension point.",
    package: "experimental",
    Component: ProbeMatrixDemo,
    githubUrl: EXPERIMENTAL_DOCS,
    sourceCode: `import { createRemoteComponentInternal } from "@hubspot/ui-extensions/hs-internal";
// Mint a host-known component by name:
const HeaderActions = createRemoteComponentInternal("HeaderActions");
const PrimaryHeaderActionButton = createRemoteComponentInternal("PrimaryHeaderActionButton", { fragmentProps: ["overlay"] });`,
  },
  ...ESCAPE_HATCH_DEMOS,
];
