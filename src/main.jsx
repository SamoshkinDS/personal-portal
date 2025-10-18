import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

const defaultTitle = import.meta.env.DEV ? "[DEV] SAMOSHECHKIN" : "SAMOSHECHKIN";
const title = import.meta.env.VITE_APP_TITLE || defaultTitle;
if (typeof document !== "undefined") {
  if (document.title !== title) {
    document.title = title;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
