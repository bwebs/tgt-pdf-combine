import {
  Box,
  IconButton,
  ListItem,
  Space,
  SpaceVertical,
  Span,
  Tooltip,
} from "@looker/components";
import { Download } from "@looker/icons";
import { Warning } from "@styled-icons/material";
import startCase from "lodash/startCase";
import { DateTime } from "luxon";
import React, { useRef } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import { useExtensionContext } from "../App";
import { ITEMS } from "../Config";
import { useSearchParams } from "../hooks/useSearchParams";
import { RunArtifact } from "../types";
import DashboardBadge from "./DashboardBadge";
import FolderBadge from "./FolderBadge";
const StyledListItem = styled(ListItem)<{
  has_error?: boolean;
  status?: string;
}>`
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-left: 3px solid transparent;
  display: flex;
  flex-direction: row;
  justify-content: space-between;

  & > button[aria-selected="true"] {
    background-color: #f0f0f0;
    border-left: 3px solid
      ${(props) =>
        props.has_error
          ? props.theme.colors.critical
          : props.status === "finished"
          ? props.theme.colors.positive
          : props.theme.colors.key};
  }

  & > button {
    padding: 0px;
  }
`;

const StyledSpaceVertical = styled(SpaceVertical)`
  visibility: hidden;
  ${StyledListItem}:hover & {
    visibility: visible;
  }
`;

const StatusSpan = styled(Span)`
  font-weight: 500;
`;

const DashboardList = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin-top: 0.25rem;
`;

const TimeSpan = styled(Span)``;

const DashboardLabel = styled(Span)`
  color: #707781;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 0.5rem;
  display: block;
`;

interface RunListItemProps {
  run: RunArtifact;
}

export const RunListItem: React.FC<RunListItemProps> = ({ run }) => {
  const error = run.errors?.length ? run.errors[0] : null;
  const statusColor = error
    ? "critical"
    : run?.status === "finished"
    ? "positive"
    : "inherit";
  const createdDate = DateTime.fromISO(run.created_at);
  const relativeTime = createdDate.toRelative();
  const { search_params, setSearchParams } = useSearchParams();
  const selectedRunId = search_params.get("run_id");
  const has_error = Boolean(run.errors?.length);
  const is_selected = selectedRunId === run.run_id;
  const { extensionSDK } = useExtensionContext();
  const shareButtonRef = useRef<HTMLDivElement>(null);

  const handleDownloadClick = async () => {
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
          run_id: run.run_id,
        }),
      }
    );

    if (response.status === 200) {
      const signed_url = decodeURIComponent(response.body.signed_url);
      extensionSDK.openBrowserWindow(signed_url, "_blank");
    }
  };

  return (
    <>
      <StyledListItem
        status={run.status}
        selected={is_selected}
        onClick={() => {
          setSearchParams({ run_id: run.run_id });
        }}
        has_error={has_error}
      >
        <Space gap="none">
          <Space color={statusColor} gap="xsmall" ml="small">
            <Tooltip
              content={
                <Span style={{ whiteSpace: "pre" }}>
                  {run.errors?.join("\n")}
                </Span>
              }
            >
              <Warning
                name="Error"
                color="critical"
                size={16}
                style={{ visibility: error ? "visible" : "hidden" }}
              />
            </Tooltip>

            <SpaceVertical gap="xsmall">
              <Space between gap="none">
                <Space flexGrow={1}>
                  <Tooltip
                    content={createdDate.toLocaleString(DateTime.DATETIME_FULL)}
                  >
                    <TimeSpan fontSize="small" color="text2">
                      {relativeTime}
                    </TimeSpan>
                  </Tooltip>
                  <StatusSpan color={statusColor}>
                    {startCase(run.status) || "Unknown Status"}
                  </StatusSpan>
                </Space>
                <FolderBadge folder_id={run.folder_id} />
              </Space>
              {run.dashboard_ids && run.dashboard_ids.length > 0 && (
                <>
                  <DashboardLabel>Dashboards</DashboardLabel>
                  <DashboardList>
                    {run.dashboard_ids.map((dashboardId) => (
                      <DashboardBadge
                        key={dashboardId}
                        dashboardId={dashboardId}
                      />
                    ))}
                  </DashboardList>
                </>
              )}
            </SpaceVertical>
          </Space>
          <Box alignSelf="flex-start" ref={shareButtonRef} />
        </Space>
      </StyledListItem>
      {shareButtonRef.current &&
        createPortal(
          <StyledSpaceVertical flexGrow={0}>
            <IconButton
              icon={<Download />}
              label="Download"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                e.preventDefault();
                handleDownloadClick();
              }}
            />
          </StyledSpaceVertical>,
          shareButtonRef.current
        )}
    </>
  );
};
