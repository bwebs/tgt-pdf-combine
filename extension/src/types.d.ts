import { IArtifact } from "@looker/sdk/lib/4.0/models";

type TNamesSpaces =
  | "combine-dashboards-tool-runs"
  | "combine-dashboards-tool-run-dashboards";

interface RunArtifact extends Omit<IArtifact, "created_at"> {
  created_at: string;
  run_id: string;
  folder_id?: string;
  dashboard_ids?: string[];
  errors?: string[];
  finished_at?: string;
  status?: "running" | "finished" | "failed";
  [key: string]: any;
}

interface RunDashboardArtifact extends Omit<IArtifact, "created_at"> {
  created_at: string;
  dashboard_id: string;
  run_id: string;
  error?: string;
  finished_at?: string;
  result_task_id?: string;
  status?: string;
  [key: string]: any;
}
