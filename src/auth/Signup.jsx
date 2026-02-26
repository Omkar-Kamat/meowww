import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useToastStore } from "../store/useToastStore";

export default function Signup() {
    const navigate = useNavigate();
    const show = useToastStore((s) => s.show);

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

            const res = await api.post("/api/auth/signup", formData);

            show(
                "Account created. Check your email for verification.",
                "success",
            );

            navigate(`/verify?userId=${res.data.userId}`);
        } catch (err) {
            const code = err.response?.data?.code;

            if (code === "EMAIL_EXISTS") {
                show(
                    "Email already registered. Try logging in instead.",
                    "error",
                );
            } else if (code === "USERNAME_EXISTS") {
                show("Username already taken. Choose another one.", "error");
            } else {
                show(
                    err.response?.data?.error ||
                        "Signup failed. Please try again.",
                    "error",
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#070F2B] to-[#1B1A55] text-white px-6">

    {/* Animated background blobs */}
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute w-[500px] h-[500px] bg-[#1B1A55] rounded-full blur-3xl opacity-40 -top-40 -left-40 animate-[float_22s_ease-in-out_infinite]" />
      <div className="absolute w-[450px] h-[450px] bg-[#1B1A55] rounded-full blur-3xl opacity-30 bottom-0 right-0 animate-[float_28s_ease-in-out_infinite]" />
    </div>

    <form
      onSubmit={handleSubmit}
      className="relative z-10 w-full max-w-md backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl rounded-3xl p-10 flex flex-col gap-6"
    >
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight">
          Create Account
        </h2>
        <p className="text-[#C6C9FF] text-sm mt-2">
          Join and start meeting someone new
        </p>
      </div>

      <div className="flex flex-col gap-4">

        <input
          name="name"
          placeholder="Full Name"
          className="px-4 py-3 rounded-full bg-white/10 backdrop-blur text-sm outline-none border border-white/10 focus:border-[#535C91] focus:ring-2 focus:ring-[#535C91]/40 transition"
          onChange={handleChange}
          required
        />

        <input
          name="username"
          placeholder="Username"
          className="px-4 py-3 rounded-full bg-white/10 backdrop-blur text-sm outline-none border border-white/10 focus:border-[#535C91] focus:ring-2 focus:ring-[#535C91]/40 transition"
          onChange={handleChange}
          required
        />

        <input
          name="email"
          type="email"
          placeholder="Email"
          className="px-4 py-3 rounded-full bg-white/10 backdrop-blur text-sm outline-none border border-white/10 focus:border-[#535C91] focus:ring-2 focus:ring-[#535C91]/40 transition"
          onChange={handleChange}
          required
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          className="px-4 py-3 rounded-full bg-white/10 backdrop-blur text-sm outline-none border border-white/10 focus:border-[#535C91] focus:ring-2 focus:ring-[#535C91]/40 transition"
          onChange={handleChange}
          required
        />

        <label className="flex flex-col items-center justify-center gap-2 border border-dashed border-white/20 rounded-2xl py-6 text-sm text-[#C6C9FF] cursor-pointer hover:border-[#535C91] hover:bg-white/5 transition">
          <span>Upload Profile Photo (optional)</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setFile(e.target.files[0])}
          />
        </label>

      </div>

      <button
        disabled={loading}
        className="mt-2 py-3 rounded-full bg-[#535C91] hover:bg-[#646EB0] transition-all duration-300 shadow-xl shadow-[#535C91]/40 font-semibold disabled:opacity-50"
      >
        {loading ? "Creating..." : "Sign Up"}
      </button>

      <div className="text-center text-sm text-[#C6C9FF] mt-4">
        Already have an account?{" "}
        <span
          onClick={() => navigate("/login")}
          className="text-white cursor-pointer hover:text-[#C6C9FF] transition"
        >
          Log in
        </span>
      </div>
    </form>

    <style>
      {`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-35px); }
          100% { transform: translateY(0px); }
        }
      `}
    </style>

  </div>
);
}
