import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { LocaleProvider } from "@/i18n";
import { initTheme } from "@/features/theme/use-theme";
import { queryClient } from "@/lib/query-client";
import { router } from "@/routes/router";
import "./styles/globals.css";

initTheme();

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root element #root not found");
}

createRoot(container).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <LocaleProvider>
        <RouterProvider router={router} />
      </LocaleProvider>
    </QueryClientProvider>
  </StrictMode>,
);
