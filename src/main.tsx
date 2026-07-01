import React from "react"
import ReactDOM from "react-dom/client"
import { AuthProvider } from "@/hooks/AuthContext"
import App from "./App"
import "./index.css";

const rootElement = document.documentElement;
rootElement.classList.add("dark");
rootElement.style.colorScheme = "dark";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
)
