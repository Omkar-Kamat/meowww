import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function Signup() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: "",
        username: "",
        email: "",
        password: "",
    });

    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append("name", form.name.trim());
            formData.append("username", form.username.trim());
            formData.append("email", form.email.trim().toLowerCase());
            formData.append("password", form.password);

            if (file) {
                formData.append("profilePhoto", file);
            }

            const res = await api.post("/auth/signup", formData);

            navigate(`/verify?userId=${res.data.userId}`);
        } catch (err) {
            alert(err.response?.data?.error || "Signup failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen flex items-center justify-center bg-neutral-950 text-white">
            <form
                onSubmit={handleSubmit}
                className="bg-neutral-900 p-8 rounded-2xl w-96 flex flex-col gap-4"
            >
                <h2 className="text-2xl font-bold text-center">
                    Create Account
                </h2>

                <input
                    name="name"
                    placeholder="Full Name"
                    className="p-3 rounded-lg bg-neutral-800"
                    onChange={handleChange}
                    required
                />

                <input
                    name="username"
                    placeholder="Username"
                    className="p-3 rounded-lg bg-neutral-800"
                    onChange={handleChange}
                    required
                />

                <input
                    name="email"
                    type="email"
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

                <input
                    type="file"
                    accept="image/*"
                    className="text-sm"
                    onChange={(e) => setFile(e.target.files[0])}
                />

                <button
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-500 transition py-3 rounded-lg font-semibold"
                >
                    {loading ? "Creating..." : "Sign Up"}
                </button>
            </form>
        </div>
    );
}
