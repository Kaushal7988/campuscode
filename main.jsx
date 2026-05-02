import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Reset browser defaults
const style = document.createElement("style");
style.textContent = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0a0f1e; color: #e8eaf6; -webkit-font-smoothing: antialiased; }
  button { font-family: inherit; }
  input, textarea { font-family: inherit; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #0a0f1e; }
  ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 3px; }
`;
document.head.appendChild(style);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
