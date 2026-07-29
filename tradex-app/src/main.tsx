import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";
import { ToastProvider } from "./context/ToastContext";
import { OverlayProvider } from "./context/OverlayContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <OverlayProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </OverlayProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
