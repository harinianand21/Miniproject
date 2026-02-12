import "leaflet/dist/leaflet.css";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./app/App.tsx";
import "./styles/index.css";
import { Toaster } from "sonner";


createRoot(document.getElementById("root")!).render(
    <BrowserRouter>
        <App />
        <Toaster position="top-center" richColors expand={true} />
    </BrowserRouter>
);
