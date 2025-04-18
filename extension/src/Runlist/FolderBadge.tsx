import { Badge, Box, IconButton, Span, Tooltip } from "@looker/components";
import { IFolder } from "@looker/sdk";
import { OpenInBrowser } from "@styled-icons/material";
import React from "react";
import styled from "styled-components";
import useSWR from "swr";
import { useCore40SDK, useExtensionContext } from "../App";
import { swr_sdk_fetcher } from "../utils";

export const StyledBadge = styled(Badge)`
  white-space: nowrap;
`;

const StyledIconButton = styled(IconButton)`
  display: none;

  ${StyledBadge}:hover & {
    display: flex;
  }
`;

const FolderBadge = ({ folder_id }: { folder_id: string | undefined }) => {
  const sdk = useCore40SDK();
  const { extensionSDK } = useExtensionContext();
  const { data: folder, isLoading } = useSWR<IFolder>(
    folder_id ? [sdk, "folder", folder_id, "name"] : null,
    swr_sdk_fetcher
  );

  if (isLoading) {
    return <StyledBadge intent="neutral">Loading...</StyledBadge>;
  } else if (!folder) {
    return <StyledBadge intent="neutral">No folder found</StyledBadge>;
  } else {
    return (
      <Tooltip
        content={
          <Box>
            <Span>Folder: {folder.name}</Span>
          </Box>
        }
      >
        <StyledBadge intent={"neutral"}>
          {folder.name}
          <StyledIconButton
            onMouseDown={(e: React.MouseEvent) => {
              e.stopPropagation();
              e.preventDefault();
              extensionSDK.openBrowserWindow(
                `/folders/${folder_id}`,
                e.shiftKey || e.metaKey ? "_blank" : "_self"
              );
            }}
            icon={<OpenInBrowser size="12px" />}
          />
        </StyledBadge>
      </Tooltip>
    );
  }
};

export default FolderBadge;
