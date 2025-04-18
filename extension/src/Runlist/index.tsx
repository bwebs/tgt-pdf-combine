import { Box, Heading, List, Space, SpaceVertical } from "@looker/components";
import React from "react";
import { useRunArtifacts } from "../hooks/useArtifacts";
import { RunListItem } from "./Item";
import SelectedRun from "./SelectedRun";

interface RunListProps {}

export const RunList: React.FC<RunListProps> = () => {
  const { data: run_artifacts, isLoading } = useRunArtifacts();
  if (isLoading) {
    return <div>Loading...</div>;
  } else {
    return (
      <SpaceVertical>
        <Heading as="h3">PDF Combiner</Heading>
        <Space>
          <Box flex="1" minWidth="300px">
            <List>
              {run_artifacts?.map((run, index) => (
                <RunListItem key={index} run={run} />
              ))}
            </List>
          </Box>
          <Box flex="2" border="1px solid #ccc" alignSelf="flex-start">
            <SelectedRun />
          </Box>
        </Space>
      </SpaceVertical>
    );
  }
};
