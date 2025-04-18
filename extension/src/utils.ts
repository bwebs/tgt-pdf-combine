import { Looker40SDK } from "@looker/sdk";

export const swr_sdk_fetcher = <T>(
  args: [Looker40SDK, keyof Looker40SDK, string]
) => {
  const [sdk, method, ...method_args] = args;
  const method_fn = sdk[method];
  // Need to type assert since TypeScript can't infer the specific method type
  return sdk.ok((method_fn as Function).apply(sdk, method_args)) as Promise<T>;
};
