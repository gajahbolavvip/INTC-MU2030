import { queryOptions } from "@tanstack/react-query";

import { getMarketSnapshot } from "@/lib/market.functions";

export const marketQueryOptions = queryOptions({
  queryKey: ["market-snapshot"],
  queryFn: () => getMarketSnapshot(),
  refetchInterval: 30_000,
  refetchIntervalInBackground: false,
  staleTime: 15_000,
});
