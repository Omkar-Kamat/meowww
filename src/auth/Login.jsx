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
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#070F2B] to-[#1B1A55] text-white px-6">

    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute w-[500px] h-[500px] bg-[#1B1A55] rounded-full blur-3xl opacity-40 -top-40 -left-40 animate-[float_20s_ease-in-out_infinite]" />
      <div className="absolute w-[400px] h-[400px] bg-[#1B1A55] rounded-full blur-3xl opacity-30 bottom-0 right-0 animate-[float_25s_ease-in-out_infinite]" />
    </div>

    <form
      onSubmit={handleSubmit}
      className="relative z-10 w-full max-w-md backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl rounded-3xl p-10 flex flex-col gap-6"
    >
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white tracking-tight">
          Welcome Back
        </h2>
        <p className="text-[#C6C9FF] text-sm mt-2">
          Log in to continue chatting
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <input
          name="email"
          type="text"
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
      </div>

      <button
        className="mt-2 py-3 rounded-full bg-[#535C91] hover:bg-[#646EB0] transition-all duration-300 shadow-xl shadow-[#535C91]/40 font-semibold"
      >
        Log In
      </button>

      <div className="text-center text-sm text-[#C6C9FF] mt-4">
        Don’t have an account?{" "}
        <span
          onClick={() => navigate("/signup")}
          className="text-white cursor-pointer hover:text-[#C6C9FF] transition"
        >
          Sign up
        </span>
      </div>
    </form>

    <style>
      {`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-30px); }
          100% { transform: translateY(0px); }
        }
      `}
    </style>

  </div>
);
}
