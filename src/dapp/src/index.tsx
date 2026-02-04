import { Buffer } from "buffer";
globalThis.Buffer = Buffer;
window.Buffer = Buffer;

import React from "react";
import ReactDOM from "react-dom/client";
import { TonConnectUIProvider } from "@tonconnect/ui-react";
import App from "./App";
import "./index.scss";
import "./patch-local-storage-for-github-pages";

// Use the manifest from public folder or environment
const manifestUrl = import.meta.env.VITE_PUBLIC_URL
  ? `${import.meta.env.VITE_PUBLIC_URL}/tonconnect-manifest.json`
  : "/tonconnect-manifest.json";

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(
  <TonConnectUIProvider manifestUrl={manifestUrl}>
    <App />
  </TonConnectUIProvider>
);
