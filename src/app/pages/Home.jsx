import React from "react";
import { Flex, Heading, Link, Text, hubspot } from "@hubspot/ui-extensions";
import { DemoBrowser } from "./DemoBrowser.jsx";

hubspot.extend(({ actions }) => <HomePage actions={actions} />);

const HomePage = ({ actions }) => (
  <>
    <Flex direction="column" gap="sm">
      <Flex direction="column" gap="flush">
        <Heading>hs-uix Component Demos</Heading>
        <Text>
          Interactive demos for the hs-uix family of HubSpot UI Extension
          components. Click a demo to try it, view the source on GitHub, or copy
          the code.
        </Text>
        <Link href={{ url: "https://github.com/05bmckay/hs-uix", external: true }}>
          GitHub repo
        </Link>
      </Flex>
      <DemoBrowser actions={actions} />
    </Flex>
  </>
);
