import React from “react”;
import ReactDOM from “react-dom/client”;
import App from “./App.jsx”;
import { QueryClient, QueryClientProvider } from “@tanstack/react-query”;

const queryClient = new QueryClient({
defaultOptions: {
queries: {
// Keep showing last known data for 30 minutes even if stale
staleTime:          5 * 60 * 1000,   // 5 min — don’t refetch if data < 5min old
gcTime:            30 * 60 * 1000,   // 30 min — keep data in cache even if component unmounts
retry:             2,                // retry failed requests twice
retryDelay:        3000,             // wait 3s between retries
refetchOnWindowFocus:      true,
refetchOnReconnect:        true,     // refetch when network comes back
refetchIntervalInBackground: false,
// CRITICAL: never replace cached data with undefined/error on network failure
// This keeps showing ₹ figures instead of going to ₹0
placeholderData:   (prev) => prev,
},
},
});

ReactDOM.createRoot(document.getElementById(“root”)).render(
<QueryClientProvider client={queryClient}>
<App />
</QueryClientProvider>
);