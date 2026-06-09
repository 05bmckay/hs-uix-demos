import React, { createContext, useContext, useEffect, useMemo } from "react";
import {
  Button,
  Flex,
  Panel,
  PanelBody,
  PanelFooter,
} from "@hubspot/ui-extensions";

// ---------------------------------------------------------------------------
// Shared playground plumbing.
//
// Demo header slot — playgrounds register their "Customize" button here so it
// sits alongside View code / Copy code in DemoDetail's header row.
//
// Callers MUST memoize the node they pass in (useMemo around the overlay),
// otherwise the effect re-fires every render and storms the tree.
// ---------------------------------------------------------------------------

export const DemoHeaderContext = createContext(null);

export const useDemoHeaderSlot = (node) => {
  const setHeaderNode = useContext(DemoHeaderContext);
  useEffect(() => {
    if (!setHeaderNode) return undefined;
    setHeaderNode(node);
    return () => setHeaderNode(null);
  }, [node, setHeaderNode]);
};

// ---------------------------------------------------------------------------
// useCustomizePanel — the standard playground "Customize" drawer.
//
// Renders `body` inside a small Panel with a reset button in the footer, and
// registers a "Customize" button in the demo header via useDemoHeaderSlot.
//
// `body` and `onReset` close over playground state and may be re-created every
// render; `deps` (same contract as useMemo) controls when the overlay — and
// therefore the header button — actually changes identity.
// ---------------------------------------------------------------------------

export const useCustomizePanel = (
  { id, title, body, onReset, resetLabel = "Reset preset" },
  deps
) => {
  const overlay = useMemo(
    () => (
      <Panel id={id} title={title} width="sm">
        <PanelBody>{body}</PanelBody>
        <PanelFooter>
          <Flex direction="row" justify="end">
            <Button variant="secondary" onClick={onReset}>
              {resetLabel}
            </Button>
          </Flex>
        </PanelFooter>
      </Panel>
    ),
    deps
  );

  const customizeButton = useMemo(
    () => (
      <Button variant="secondary" overlay={overlay}>
        Customize
      </Button>
    ),
    [overlay]
  );

  useDemoHeaderSlot(customizeButton);
};
