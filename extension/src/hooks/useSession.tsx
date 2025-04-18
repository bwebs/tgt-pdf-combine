import { IApiSession } from "@looker/sdk";
import useSWR from "swr";
import { useCore40SDK } from "../App";
import { swr_sdk_fetcher } from "../utils";

export const useSession = () => {
  const sdk = useCore40SDK();
  return useSWR<IApiSession>([sdk, "session"], swr_sdk_fetcher);
};
