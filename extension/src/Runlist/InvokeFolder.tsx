import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  FieldSelect,
  SelectOptionObject,
} from "@looker/components";
import { IFolderBase } from "@looker/sdk";
import orderBy from "lodash/orderBy";
import React, { useMemo, useState } from "react";
import useSWR from "swr";
import { useBoolean, useDebounceValue } from "usehooks-ts";
import { useCore40SDK, useExtensionContext } from "../App";
import { ITEMS } from "../Config";
import { useRunArtifacts } from "../hooks/useArtifacts";
import { swr_sdk_fetcher } from "../utils";

export const InvokeFolder: React.FC = () => {
  const open = useBoolean(false);
  const [search, setSearch] = useState("");
  const [debounced_search, setDebouncedSearch] = useDebounceValue(search, 500);
  const { delayedRefresh } = useRunArtifacts();
  const [selected_folder, setSelectedFolder] =
    useState<SelectOptionObject | null>(null);
  const sdk = useCore40SDK();
  const { extensionSDK } = useExtensionContext();

  const { data, isLoading, isValidating } = useSWR<IFolderBase[]>(
    [
      sdk,
      "search_folders",
      { name: debounced_search?.length ? debounced_search : undefined },
    ],
    swr_sdk_fetcher
  );

  const filtered_data = useMemo(
    () =>
      data?.reduce((acc, d) => {
        if (debounced_search.length) {
          if (d.name?.toLowerCase().includes(debounced_search.toLowerCase())) {
            acc.push({
              label: d.name ?? "",
              value: d.id ?? "",
            });
          }
        } else {
          acc.push({
            label: d.name ?? "",
            value: d.id ?? "",
          });
        }
        return acc;
      }, [] as SelectOptionObject[]),
    [data, debounced_search]
  );

  const handleCombine = async () => {
    const config = await extensionSDK.getContextData();
    const pdf_combiner_url = config[ITEMS.pdf_combiner_url];

    if (!selected_folder) {
      return;
    } else {
      try {
        const response = await extensionSDK.serverProxy(
          `${pdf_combiner_url}/?do=execute_workflow`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization:
                extensionSDK.createSecretKeyTag("pdf_combine_secret"),
            },
            body: JSON.stringify({
              folder_id: selected_folder.value,
            }),
          }
        );

        if (response.status === 200) {
          open.setFalse();
          setSearch("");
          setSelectedFolder(null);
          delayedRefresh();
        }
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <>
      <Button onClick={open.setTrue}>Combine Folder</Button>
      <Dialog isOpen={open.value} onClose={open.setFalse}>
        <DialogHeader>Combine Folder</DialogHeader>
        <DialogContent>
          <FieldSelect
            label="Search"
            isFilterable
            onFilter={(value: string) => {
              setSearch(value);
              setDebouncedSearch(value);
            }}
            value={selected_folder?.value?.length ? selected_folder.value : ""}
            onChange={(value: string) => {
              const found_folder = filtered_data?.find(
                (d) => d.value === value
              );
              setSelectedFolder(found_folder ?? null);
              setSearch(found_folder?.label ?? "");
              setDebouncedSearch(found_folder?.label ?? "");
            }}
            options={orderBy(filtered_data, "label", "asc")}
          />
        </DialogContent>
        <DialogFooter>
          <Button
            type="button"
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.preventDefault();
              e.stopPropagation();
              open.setFalse();
              handleCombine();
            }}
          >
            Combine
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
};
