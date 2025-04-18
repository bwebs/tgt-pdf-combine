import {
  ExtensionContext,
  ExtensionProvider,
} from "@looker/extension-sdk-react";
import React, { Suspense, useContext, useState } from "react";

import { Box, ComponentsProvider } from "@looker/components";
import styled from "styled-components";
import Main from "./Main";

const StyledBox = styled(Box)`
  height: 100%;
  width: 100%;
  & > div {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
  }
`;

export const App: React.FC = () => {
  const [route, setRoute] = useState("");
  const [routeState, setRouteState] = useState();

  const onRouteChange = (route: string, routeState?: any) => {
    setRoute(route);
    setRouteState(routeState);
  };

  return (
    <Suspense fallback={<></>}>
      <StyledBox>
        <ComponentsProvider>
          <ExtensionProvider onRouteChange={onRouteChange}>
            <Main route={route} routeState={routeState} />
          </ExtensionProvider>
        </ComponentsProvider>
      </StyledBox>
    </Suspense>
  );
};

export const useExtensionContext = () => {
  const extension = useContext(ExtensionContext);
  if (!extension) {
    throw new Error("ExtensionContext not found");
  }
  return extension;
};

export const useCore40SDK = () => {
  const { core40SDK } = useExtensionContext();
  if (!core40SDK) {
    throw new Error("ExtensionContext not found");
  }
  return core40SDK;
};
