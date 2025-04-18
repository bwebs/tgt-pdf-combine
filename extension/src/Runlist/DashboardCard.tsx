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
import { ITEMS } from "../Config";
import { swr_sdk_fetcher } from "../utils";

interface DashboardCardProps {
  status?: string;
  dashboard_id: string;
  error?: string;
  finished_at?: string;
  run_id: string | null;
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
  run_id,
}) => {
  const sdk = useCore40SDK();
  const { extensionSDK } = useExtensionContext();
  const { data, isLoading } = useSWR<IDashboard>(
    [sdk, "dashboard", dashboard_id],
    swr_sdk_fetcher
  );

  const handleDownloadClick = async (e: React.MouseEvent) => {
    if (!run_id) return;
    const config = await extensionSDK.getContextData();
    const pdf_combiner_url = config[ITEMS.pdf_combiner_url];

    const response = await extensionSDK.serverProxy(
      `${pdf_combiner_url}/?do=get_signed_url`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: extensionSDK.createSecretKeyTag("pdf_combine_secret"),
        },
        body: JSON.stringify({
          run_id,
          dashboard_id,
        }),
      }
    );

    if (response.status === 200) {
      const signed_url = decodeURIComponent(response.body.signed_url);
      extensionSDK.openBrowserWindow(signed_url, "_blank");
    }
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
            e.preventDefault();
            handleDownloadClick(e);
          }}
        />
      </StyledCard>
    );
  }
};

export default DashboardCard;
