import { createContext, useContext, useEffect } from "react";

// ---------------------------------------------------------------------------
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
