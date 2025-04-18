import {
  Dialog,
  DialogContent,
  DialogHeader,
  SpaceVertical,
  Spinner,
} from "@looker/components";
import type { LookerEmbedDashboard } from "@looker/embed-sdk";
import { LookerEmbedSDK } from "@looker/embed-sdk";
import { ExtensionContext40 } from "@looker/extension-sdk-react";
import React, { useCallback, useContext, useState } from "react";
import styled from "styled-components";

const EmbedContainer = styled.div`
  width: 100%;
  height: 85vh;
  & > iframe {
    width: 100%;
    height: 100%;
  }
`;

interface DashboardModalProps {
  dashboardId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const DashboardModal: React.FC<DashboardModalProps> = ({
  dashboardId,
  isOpen,
  onClose,
}) => {
  const [dashboard, setDashboard] = useState<LookerEmbedDashboard>();
  const [isLoading, setIsLoading] = useState(true);
  const extensionContext = useContext(ExtensionContext40);

  const setupDashboard = (dashboard: LookerEmbedDashboard) => {
    setDashboard(dashboard);
    setIsLoading(false);
  };

  const embedCtrRef = useCallback(
    (el: HTMLDivElement) => {
      const hostUrl = extensionContext?.extensionSDK?.lookerHostData?.hostUrl;
      if (el && hostUrl && dashboardId) {
        el.innerHTML = "";
        LookerEmbedSDK.init(hostUrl);
        const db = LookerEmbedSDK.createDashboardWithId(parseInt(dashboardId))
          .withNext()
          .appendTo(el)
          .on("dashboard:loaded", () => setIsLoading(false))
          .on("dashboard:run:start", () => setIsLoading(true))
          .on("dashboard:run:complete", () => setIsLoading(false));

        db.build()
          .connect()
          .then(setupDashboard)
          .catch((error: Error) => {
            console.error("Connection error", error);
            setIsLoading(false);
          });
      }
    },
    [dashboardId, extensionContext]
  );

  return (
    <Dialog isOpen={isOpen} onClose={onClose} width="90vw">
      <DialogHeader>Dashboard {dashboardId}</DialogHeader>
      <DialogContent>
        <SpaceVertical>
          {isLoading && <Spinner />}
          <EmbedContainer ref={embedCtrRef} />
        </SpaceVertical>
      </DialogContent>
    </Dialog>
  );
};
