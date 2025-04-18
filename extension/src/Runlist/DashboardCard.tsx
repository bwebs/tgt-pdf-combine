import {
  Card,
  Heading,
  Icon,
  IconButton,
  Link,
  Space,
  Span,
  Tooltip,
} from "@looker/components";
import { IDashboard } from "@looker/sdk";
import { Download } from "@styled-icons/material";
import startCase from "lodash/startCase";
import React from "react";
import styled from "styled-components";
import useSWR from "swr";
import { useCore40SDK, useExtensionContext } from "../App";
import { swr_sdk_fetcher } from "../utils";
interface DashboardCardProps {
  status?: string;
  dashboard_id: string;
  error?: string;
  finished_at?: string;
}

interface StatusSpanProps {
  status?: string;
}

const StyledIconButton = styled(IconButton)`
  position: absolute;
  right: 0;
  top: 0;
  visibility: hidden;
`;

const StyledCard = styled(Card)<{ status: string }>`
  margin-bottom: 1rem;
  position: relative;
  border-left: 3px solid
    ${(props) => {
      if (props.status === "success") return props.theme.colors.positive;
      if (props.status === "failure") return props.theme.colors.critical;
      return props.theme.colors.key;
    }};
  &:hover ${StyledIconButton} {
    visibility: visible;
  }
`;

const StatusSpan = styled(Span)<StatusSpanProps>`
  font-weight: 500;
  align-self: center;
  color: ${(props) => {
    if (props.status === "success") return props.theme.colors.positive;
    if (props.status === "failure") return props.theme.colors.critical;
    return props.theme.colors.key;
  }};
`;

const SpaceVertical = styled(Space)`
  flex-direction: column;
`;

const DashboardCard: React.FC<DashboardCardProps> = ({
  status,
  dashboard_id,
  error,
  finished_at,
}) => {
  const sdk = useCore40SDK();
  const { extensionSDK } = useExtensionContext();
  const { data, isLoading } = useSWR<IDashboard>(
    [sdk, "dashboard", dashboard_id],
    swr_sdk_fetcher
  );

  const handleDownloadClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    extensionSDK.openBrowserWindow(
      `/dashboards/${dashboard_id}/download`,
      e.shiftKey || e.metaKey ? "_blank" : "_self"
    );
  };

  if (isLoading) {
    return <StyledCard status={status || "unknown"}>Loading...</StyledCard>;
  } else {
    return (
      <StyledCard status={status || "unknown"}>
        <Space between>
          <SpaceVertical p="small">
            <Link
              href={`/dashboards/${dashboard_id}`}
              onMouseDown={(e: React.MouseEvent<HTMLAnchorElement>) => {
                e.preventDefault();
                e.stopPropagation();
                extensionSDK.openBrowserWindow(
                  `/dashboards/${dashboard_id}`,
                  e.shiftKey || e.metaKey ? "_blank" : "_self"
                );
              }}
            >
              <Heading as="h3">{data?.title || dashboard_id}</Heading>
            </Link>
            <StatusSpan status={status}>
              {startCase(status || "Unknown Status")}
            </StatusSpan>
            {error && (
              <Tooltip content={error}>
                <Icon name="Error" color="critical" />
              </Tooltip>
            )}

            {finished_at && (
              <Span fontSize="small" color="text2">
                Finished: {new Date(finished_at).toLocaleString()}
              </Span>
            )}
          </SpaceVertical>
        </Space>
        <StyledIconButton
          icon={<Download />}
          label="Download"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            handleDownloadClick();
          }}
        />
      </StyledCard>
    );
  }
};

export default DashboardCard;
