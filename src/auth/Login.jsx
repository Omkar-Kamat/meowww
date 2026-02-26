import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuthStore } from "../store/useAuthStore";
import { useToastStore } from "../store/useToastStore";
export default function Login() {
    const navigate = useNavigate();
    const fetchMe = useAuthStore((s) => s.fetchMe);

    const show = useToastStore((s) => s.show);
    const [form, setForm] = useState({
        email: "",
        password: "",
    });

    const handleChange = (e) => {
        setForm((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            await api.post("/api/auth/login", form);
            await fetchMe();
            navigate("/chat");
        } catch (err) {
            if (err.response?.data?.code === "EMAIL_NOT_VERIFIED") {
                navigate(`/verify?userId=${err.response.data.userId}`);
                return;
            }

            show(err.response?.data?.error || "Login failed", "error");
        }
    };

    return (
        <div className="h-screen flex items-center justify-center bg-neutral-950 text-white">
            <form
                onSubmit={handleSubmit}
                className="bg-neutral-900 p-8 rounded-2xl w-96 flex flex-col gap-4"
            >
                <h2 className="text-2xl font-bold text-center">Login</h2>

                <input
                    name="email"
                    type="text"
                    placeholder="Email"
                    className="p-3 rounded-lg bg-neutral-800"
                    onChange={handleChange}
                    required
                />

                <input
                    name="password"
                    type="password"
                    placeholder="Password"
                    className="p-3 rounded-lg bg-neutral-800"
                    onChange={handleChange}
                    required
                />

                <button className="bg-blue-600 hover:bg-blue-500 transition py-3 rounded-lg font-semibold">
                    Login
                </button>
            </form>
        </div>
    );
}
