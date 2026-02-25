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
      await api.post("/auth/verify", { userId, otp });
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
      await api.post("/auth/resend-otp", { userId });
      alert("OTP resent");
    } catch (err) {
      alert(err.response?.data?.error);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-neutral-950 text-white">
      <form
        onSubmit={handleVerify}
        className="bg-neutral-900 p-8 rounded-2xl w-96 flex flex-col gap-4"
      >
        <h2 className="text-2xl font-bold text-center">Verify Email</h2>

        <input
          placeholder="Enter OTP"
          className="p-3 rounded-lg bg-neutral-800 text-center tracking-widest text-lg"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          required
        />

        <button
          disabled={loading}
          className="bg-green-600 hover:bg-green-500 transition py-3 rounded-lg font-semibold"
        >
          {loading ? "Verifying..." : "Verify"}
        </button>

        <button
          type="button"
          onClick={handleResend}
          className="text-sm text-neutral-400 hover:text-white"
        >
          Resend OTP
        </button>
      </form>
    </div>
  );
}