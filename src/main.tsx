import React from "react"
import ReactDOM from "react-dom/client"
import { AuthProvider } from "@/hooks/AuthContext"
import App from "./App"
import "./index.css";

const rootElement = document.documentElement;
rootElement.classList.remove("dark");
rootElement.style.colorScheme = "light";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
)
