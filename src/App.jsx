import React from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "./router.jsx";

export default function App() {
  // Keep App minimal so Vite always finds the default export the router expects.
  return <RouterProvider router={router} />;
}
