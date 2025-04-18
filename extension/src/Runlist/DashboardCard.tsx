import { Card, Heading, Icon, Space, Span, Tooltip } from "@looker/components";
import React from "react";
import styled from "styled-components";

interface DashboardCardProps {
  status?: string;
  dashboard_id: string;
  error?: string;
  finished_at?: string;
}

interface StatusSpanProps {
  status?: string;
}

const StyledCard = styled(Card)<DashboardCardProps>`
  margin-bottom: 1rem;
  border-left: 3px solid
    ${(props) => {
      if (props.status === "success") return props.theme.colors.positive;
      if (props.status === "failure") return props.theme.colors.critical;
      return props.theme.colors.key;
    }};
`;

const StatusSpan = styled(Span)<StatusSpanProps>`
  font-weight: 500;
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
  return (
    <StyledCard status={status}>
      <Space between>
        <SpaceVertical>
          <Heading as="h4">Dashboard {dashboard_id}</Heading>
          <Space>
            <StatusSpan status={status}>
              {status || "Unknown Status"}
            </StatusSpan>
            {error && (
              <Tooltip content={error}>
                <Icon name="Error" color="critical" />
              </Tooltip>
            )}
          </Space>
          {finished_at && (
            <Span fontSize="small" color="text2">
              Finished: {new Date(finished_at).toLocaleString()}
            </Span>
          )}
        </SpaceVertical>
      </Space>
    </StyledCard>
  );
};

export default DashboardCard;
