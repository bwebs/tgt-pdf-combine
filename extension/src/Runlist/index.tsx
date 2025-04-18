import {
  Box,
  Button,
  Heading,
  MenuList,
  Space,
  SpaceVertical,
} from "@looker/components";
import React from "react";
import { useHistory } from "react-router-dom";
import { useRunArtifacts } from "../hooks/useArtifacts";
import { useSession } from "../hooks/useSession";
import { InvokeFolder } from "./InvokeFolder";
import { RunListItem } from "./Item";
import SelectedRun from "./SelectedRun";

interface RunListProps {}

export const RunList: React.FC<RunListProps> = () => {
  const { data: run_artifacts, isLoading } = useRunArtifacts();
  const { data: session } = useSession();
  const history = useHistory();

  if (isLoading) {
    return <div>Loading...</div>;
  } else {
    return (
      <SpaceVertical id="run-list" py="xsmall">
        <Space between px="small">
          <Space>
            <Heading as="h2">PDF Combiner</Heading>
          </Space>
          <Space align="end" flexGrow={0} width="auto">
            <InvokeFolder />
            {session?.workspace_id === "dev" && (
              <Button
                onClick={() => {
                  history.push("/config");
                }}
              >
                Configure
              </Button>
            )}
          </Space>
        </Space>
        <Space>
          <Box flex="1" minWidth="300px">
            <MenuList>
              {run_artifacts?.map((run, index) => (
                <RunListItem key={index} run={run} />
              ))}
            </MenuList>
          </Box>
          <Box flex="2" border="1px solid #ccc" alignSelf="flex-start">
            <SelectedRun />
          </Box>
        </Space>
      </SpaceVertical>
    );
  }
};
