import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { initZoom } from "./utils/webview";

// init Webview Zoom Level
initZoom();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
