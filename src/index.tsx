/* @refresh reload */
import { render } from "solid-js/web";
import "./styles/globals.css";
import App from "./App";
import { OverlayWindow } from "./components/overlay/OverlayWindow";

// Check if this is the overlay window by looking at the URL hash
const isOverlayWindow = window.location.hash === "#/overlay";

// Set overlay mode classes for transparent background
if (isOverlayWindow) {
  document.documentElement.classList.add("overlay-mode");
  document.body.classList.add("overlay-mode");
}

render(
  () => (isOverlayWindow ? <OverlayWindow /> : <App />),
  document.getElementById("root") as HTMLElement
);
