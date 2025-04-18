import {
  Icon,
  IconButton,
  ListItem,
  Space,
  SpaceVertical,
  Span,
  Tooltip,
} from "@looker/components";
import { DateTime } from "luxon";
import React from "react";
import styled from "styled-components";
import { useExtensionContext } from "../App";
import { useSearchParams } from "../hooks/useSearchParams";
import { RunArtifact } from "../types";
import DashboardBadge from "./DashboardBadge";

const StyledListItem = styled(ListItem)<{ has_error?: boolean }>`
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-left: 3px solid transparent;

  & > button[aria-selected="true"] {
    background-color: #f0f0f0;
    border-left: 3px solid
      ${(props) =>
        props.has_error ? props.theme.colors.critical : props.theme.colors.key};
  }

  & > button {
    padding: 0px;
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

const TimeSpan = styled(Span)`
  margin-left: 1rem;
`;

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
  const statusColor = error ? "critical" : "default";
  const createdDate = DateTime.fromISO(run.created_at);
  const relativeTime = createdDate.toRelative();
  const { search_params, setSearchParams } = useSearchParams();
  const selectedRunId = search_params.get("run_id");
  const has_error = Boolean(run.errors?.length);
  const is_selected = selectedRunId === run.run_id;
  const { extensionSDK } = useExtensionContext();

  const handleShareClick = async () => {
    const response = await extensionSDK.serverProxy(`/?do=get_signed_url`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorizaiton: extensionSDK.createSecretKeyTag("extension_secret_key"),
      },
      body: {},
    });
    if (!response.ok) {
      throw new Error("Failed to authorize");
    }
  };

  return (
    <StyledListItem
      selected={is_selected}
      onClick={() => {
        setSearchParams({ run_id: run.run_id });
      }}
      has_error={has_error}
    >
      <Space color={statusColor} gap="xsmall" ml="small">
        {error && (
          <Tooltip content={run.errors?.join("\n")}>
            <Icon
              name="Error"
              color="critical"
              style={{ visibility: error ? "visible" : "hidden" }}
            />
          </Tooltip>
        )}
        <SpaceVertical gap="xsmall">
          <Space>
            <StatusSpan color={statusColor}>
              {run.status || "Unknown Status"}
            </StatusSpan>
            <Tooltip
              content={createdDate.toLocaleString(DateTime.DATETIME_FULL)}
            >
              <TimeSpan fontSize="small" color="text2">
                {relativeTime}
              </TimeSpan>
            </Tooltip>
            <IconButton
              icon="Share"
              label="Share"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                handleShareClick();
              }}
            />
          </Space>
          {run.dashboard_ids && run.dashboard_ids.length > 0 && (
            <>
              <DashboardLabel>Dashboards</DashboardLabel>
              <DashboardList>
                {run.dashboard_ids.map((dashboardId) => (
                  <DashboardBadge key={dashboardId} dashboardId={dashboardId} />
                ))}
              </DashboardList>
            </>
          )}
        </SpaceVertical>
      </Space>
    </StyledListItem>
  );
};
