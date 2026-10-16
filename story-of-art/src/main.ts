import "./style.css";
import { render } from "./app";

if ("scrollRestoration" in history) history.scrollRestoration = "manual";
window.addEventListener("hashchange", () => render());
render();
