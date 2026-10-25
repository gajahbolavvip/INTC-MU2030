<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- Market data (quotes, USD/IDR, candles) is fetched only in server functions in `src/lib/market.functions.ts` via `market.server.ts`; the browser never calls the data provider directly. Why: keeps any future API key server-side and gives one place to swap providers.
- Portfolio math and formatting live in pure `src/lib/portfolio.ts` with tests in `portfolio.test.ts`. Why: numbers must stay consistent across cards, simulation and totals.
- The chart library is browser-only and loaded lazily behind `<ClientOnly>` (`CandleCanvas.tsx`). Why: it touches the DOM at import time and would break server rendering.
- The home page passes the server-loaded snapshot as the query's initial data instead of re-fetching on hydrate. Why: avoids hydration mismatches on live prices.
