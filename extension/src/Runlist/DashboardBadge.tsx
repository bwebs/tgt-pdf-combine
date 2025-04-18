import { Badge, Box, Span, Tooltip } from "@looker/components";
import { IDashboard } from "@looker/sdk";
import React from "react";
import styled from "styled-components";
import useSWR from "swr";
import { useCore40SDK, useExtensionContext } from "../App";
import { swr_sdk_fetcher } from "../utils";

export const StyledBadge = styled(Badge)`
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
`;

import { IconButton } from "@looker/components";
import { OpenInBrowser } from "@styled-icons/material";

const StyledIconButton = styled(IconButton)`
  display: none;
  margin-left: 4px;
  ${StyledBadge}:hover & {
    display: flex;
  }
`;

const DashboardBadge = ({ dashboardId }: { dashboardId: string }) => {
  const sdk = useCore40SDK();
  const { extensionSDK } = useExtensionContext();
  const { data: dashboard, isLoading } = useSWR<IDashboard>(
    [sdk, "dashboard", dashboardId],
    swr_sdk_fetcher
  );

  if (isLoading) {
    return <StyledBadge intent="neutral">Loading...</StyledBadge>;
  } else if (!dashboard) {
    return <StyledBadge intent="neutral">No dashboard found</StyledBadge>;
  } else {
    return (
      <Tooltip
        content={
          <Box>
            <Span>{dashboard.title}</Span>
            {dashboard.description && <Span>{dashboard.description}</Span>}
          </Box>
        }
      >
        <StyledBadge intent="key">
          {dashboard.title}
          <StyledIconButton
            onMouseDown={(e: React.MouseEvent) => {
              e.stopPropagation();
              e.preventDefault();
              extensionSDK.openBrowserWindow(
                `/dashboards/${dashboardId}`,
                e.shiftKey || e.metaKey ? "_blank" : "_self"
              );
            }}
            icon={<OpenInBrowser size="0.25rem" />}
          />
        </StyledBadge>
      </Tooltip>
    );
  }
};

export default DashboardBadge;
