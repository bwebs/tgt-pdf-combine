import { ExtensionSDK } from "@looker/extension-sdk";
import { Looker40SDK } from "@looker/sdk";

const SERVER_URL = "https://lkr.dev/app/pdf_combine/api";

export const swr_sdk_fetcher = <T>(
  args: [Looker40SDK, keyof Looker40SDK, string]
) => {
  const [sdk, method, ...method_args] = args;
  const method_fn = sdk[method];
  // Need to type assert since TypeScript can't infer the specific method type
  return sdk.ok((method_fn as Function).apply(sdk, method_args)) as Promise<T>;
};

export const getSignedUrl = async ({
  sdk,
  run_id,
  server_url,
  access_token,
  dashboard_id,
}: {
  sdk: ExtensionSDK;
  run_id: string;
  server_url: string | null | undefined;
  access_token?: string;
  dashboard_id?: string;
}) => {
  const query = {
    do: "get_signed_url",
  };
  const url = server_url ?? SERVER_URL;
  const params = new URLSearchParams(query);

  const response = await sdk.serverProxy(`${url}/?${params.toString()}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: sdk.createSecretKeyTag("pdf_combine_secret"),
      "x-access-token": access_token || "",
      "x-lookersdk-base-url": sdk.lookerHostData?.hostUrl || "",
    },
    body: JSON.stringify({
      run_id,
      dashboard_id,
    }),
  });
  if (!response.ok) {
    throw new Error("Failed to authorize");
  }
};
