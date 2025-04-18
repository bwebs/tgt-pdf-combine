import { useCore40SDK } from "../App";

import orderBy from "lodash/orderBy";
import useSWR from "swr";
import { RunArtifact, RunDashboardArtifact } from "../types";
import { swr_sdk_fetcher } from "../utils";

export const useRunArtifacts = () => {
  const sdk = useCore40SDK();

  const search_artifacts = useSWR<RunArtifact[]>(
    [sdk, "search_artifacts", { namespace: "combine-dashboards-tool-runs" }],
    swr_sdk_fetcher,
    {
      refreshInterval: 10000,
    }
  );

  return {
    ...search_artifacts,
    data: orderBy(search_artifacts.data, ["updated_at"], ["desc"]).map(
      (artifact) => {
        try {
          const value = JSON.parse(artifact.value);
          return {
            ...artifact,
            ...value,
          };
        } catch (error) {
          console.error(error);
          return artifact;
        }
      }
    ),
    refresh: () => {
      search_artifacts.mutate(search_artifacts.data);
    },
    delayedRefresh: () => {
      setTimeout(() => {
        search_artifacts.mutate(search_artifacts.data);
      }, 3000);
    },
  };
};

export const useDashboardArtifacts = (run_id: string | null | undefined) => {
  const sdk = useCore40SDK();
  const search_dashboard_artifacts = useSWR<RunDashboardArtifact[]>(
    run_id
      ? [
          sdk,
          "search_artifacts",
          {
            namespace: "combine-dashboards-tool-run-dashboards",
            key: [run_id, "-", "%"].join(""),
          },
        ]
      : null,
    swr_sdk_fetcher,
    {
      refreshInterval: 10000,
    }
  );

  return {
    ...search_dashboard_artifacts,
    data: search_dashboard_artifacts.data?.map((artifact) => {
      try {
        const value = JSON.parse(artifact.value);
        return {
          ...artifact,
          ...value,
        };
      } catch (error) {
        console.error(error);
        return artifact;
      }
    }),
    refresh: () => {
      search_dashboard_artifacts.mutate(search_dashboard_artifacts.data);
    },
    delayedRefresh: () => {
      setTimeout(() => {
        search_dashboard_artifacts.mutate(search_dashboard_artifacts.data);
      }, 1000);
    },
  };
};
