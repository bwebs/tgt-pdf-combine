import { Grid, Space } from "@looker/components";
import React from "react";
import styled from "styled-components";
import { useDashboardArtifacts } from "../hooks/useArtifacts";
import { useSearchParams } from "../hooks/useSearchParams";
import DashboardCard from "./DashboardCard";

const SpaceVertical = styled(Space)`
  flex-direction: column;
`;

const SelectedRun: React.FC = () => {
  const { get } = useSearchParams();
  const run_id = get("run_id");
  const { data: current_dashboard_artifact, isLoading } =
    useDashboardArtifacts(run_id);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!current_dashboard_artifact || current_dashboard_artifact.length === 0) {
    return <div>No dashboards found for this run.</div>;
  }

  return (
    <SpaceVertical>
      <Grid columns={2} gap="large">
        {current_dashboard_artifact.map((artifact) => (
          <DashboardCard
            run_id={run_id}
            key={artifact.dashboard_id}
            status={artifact.status}
            dashboard_id={artifact.dashboard_id}
            error={artifact.error}
            finished_at={artifact.finished_at}
          />
        ))}
      </Grid>
    </SpaceVertical>
  );
};

export default SelectedRun;
