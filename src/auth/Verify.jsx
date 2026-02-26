import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { useAuthStore } from "../store/useAuthStore";

export default function Verify() {
  const navigate = useNavigate();
  const fetchMe = useAuthStore(s => s.fetchMe);
  const [searchParams] = useSearchParams();
  const userId = searchParams.get("userId");

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post("/api/auth/verify", { userId, otp });
      await fetchMe();
      navigate("/chat");
    } catch (err) {
      alert(err.response?.data?.error || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await api.post("/api/auth/resend-otp", { userId });
      alert("OTP resent");
    } catch (err) {
      alert(err.response?.data?.error);
    }
  };

  return (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#070F2B] to-[#1B1A55] text-white px-6">

    {/* Animated background blobs */}
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute w-[450px] h-[450px] bg-[#1B1A55] rounded-full blur-3xl opacity-40 -top-40 -left-40 animate-[float_24s_ease-in-out_infinite]" />
      <div className="absolute w-[400px] h-[400px] bg-[#1B1A55] rounded-full blur-3xl opacity-30 bottom-0 right-0 animate-[float_30s_ease-in-out_infinite]" />
    </div>

    <form
      onSubmit={handleVerify}
      className="relative z-10 w-full max-w-md backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl rounded-3xl p-10 flex flex-col gap-6"
    >
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight">
          Verify Your Email
        </h2>
        <p className="text-[#C6C9FF] text-sm mt-2">
          Enter the 6-digit code sent to your email
        </p>
      </div>

      <input
        placeholder="Enter OTP"
        className="px-4 py-4 rounded-full bg-white/10 backdrop-blur text-center tracking-[0.4em] text-xl outline-none border border-white/10 focus:border-[#535C91] focus:ring-2 focus:ring-[#535C91]/40 transition"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        required
      />

      <button
        disabled={loading}
        className="mt-2 py-3 rounded-full bg-[#535C91] hover:bg-[#646EB0] transition-all duration-300 shadow-xl shadow-[#535C91]/40 font-semibold disabled:opacity-50"
      >
        {loading ? "Verifying..." : "Verify"}
      </button>

      <button
        type="button"
        onClick={handleResend}
        className="text-sm text-[#C6C9FF] hover:text-white transition text-center mt-2"
      >
        Resend OTP
      </button>
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