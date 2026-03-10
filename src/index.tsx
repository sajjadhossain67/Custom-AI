import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
// BACKEND: restore this later — original MUI ThemeProvider
// import { ThemeProvider } from "@mui/material";
// import { defaultTheme } from "./shared/theme";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);
root.render(
  <React.StrictMode>
    {/* BACKEND: restore this later — wrap with <ThemeProvider theme={defaultTheme}> */}
    <App />
  </React.StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
