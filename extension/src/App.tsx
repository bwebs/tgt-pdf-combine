import {
  ExtensionContext,
  ExtensionProvider,
} from "@looker/extension-sdk-react";
import React, { Suspense, useContext, useState } from "react";

import { ComponentsProvider } from "@looker/components";
import Main from "./Main";

export const App: React.FC = () => {
  const [route, setRoute] = useState("");
  const [routeState, setRouteState] = useState();

  const onRouteChange = (route: string, routeState?: any) => {
    setRoute(route);
    setRouteState(routeState);
  };

  return (
    <Suspense fallback={<></>}>
      <ComponentsProvider>
        <ExtensionProvider onRouteChange={onRouteChange}>
          <Main route={route} routeState={routeState} />
        </ExtensionProvider>
      </ComponentsProvider>
    </Suspense>
  );
};

export const useExtensionContext = () => {
  const { core40SDK } = useContext(ExtensionContext);
  if (!core40SDK) {
    throw new Error("ExtensionContext not found");
  }
  return {
    core40SDK,
  };
};

export const useCore40SDK = () => {
  const { core40SDK } = useExtensionContext();
  if (!core40SDK) {
    throw new Error("ExtensionContext not found");
  }
  return core40SDK;
};
