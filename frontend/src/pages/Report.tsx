import { useNavigate } from "react-router-dom";
import { AddDataScreen } from "../app/components/AddDataScreen";
import { api } from "../services/api";

export default function Report() {
    const navigate = useNavigate();

    const handleSubmit = async (formData: any) => {
        try {
            const response = await api.post("/report", formData);
            console.log("Backend response:", response.data);
            navigate("/map");
        } catch (error) {
            console.error("Error submitting report:", error);
            // Even if backend fails, navigate back to map so user isn't stuck
            navigate("/map");
        }
    };

    return (
        <AddDataScreen
            onBack={() => navigate("/map")}
            onSubmit={handleSubmit}
        />
    );
}
