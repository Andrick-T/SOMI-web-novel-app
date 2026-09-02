import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        const hadController = Boolean(navigator.serviceWorker.controller);

        const activateUpdate = (worker: ServiceWorker | null) => {
          if (hadController && worker) {
            worker.postMessage({ type: "SKIP_WAITING" });
          }
        };

        if (registration.waiting) {
          activateUpdate(registration.waiting);
        }

        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          worker?.addEventListener("statechange", () => {
            if (worker.state === "installed") {
              activateUpdate(worker);
            }
          });
        });

        if (hadController) {
          navigator.serviceWorker.addEventListener(
            "controllerchange",
            () => window.location.reload(),
            { once: true },
          );
        }

        registration.update().catch((error) => {
          console.warn("Service worker update check failed", error);
        });
      })
      .catch((error) => {
        console.warn("Service worker registration failed", error);
      });
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
