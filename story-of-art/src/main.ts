import "./style.css";
import { render } from "./app";

window.addEventListener("hashchange", () => render());
render();
