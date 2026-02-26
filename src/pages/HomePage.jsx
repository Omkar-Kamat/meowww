import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#070F2B] to-[#1B1A55] text-white">

      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-[600px] h-[600px] bg-[#1B1A55] rounded-full blur-3xl opacity-40 animate-[float_20s_ease-in-out_infinite] -top-40 -left-40" />
        <div className="absolute w-[500px] h-[500px] bg-[#1B1A55] rounded-full blur-3xl opacity-30 animate-[float_25s_ease-in-out_infinite] top-1/2 -right-40" />
        <div className="absolute w-[400px] h-[400px] bg-[#1B1A55] rounded-full blur-3xl opacity-30 animate-[float_18s_ease-in-out_infinite] bottom-0 left-1/3" />
      </div>

      {/* Navbar */}
      <nav className="relative z-20 flex items-center justify-between px-8 py-6">
        <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-[#C6C9FF]">
          <span>🐾</span>
          <span>Meoww</span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            to="/signup"
            className="px-5 py-2 rounded-full border border-[#535C91] text-[#C6C9FF] hover:bg-[#535C91]/10 transition"
          >
            Sign Up
          </Link>
          <Link
            to="/login"
            className="px-5 py-2 rounded-full bg-[#535C91] hover:bg-[#646EB0] transition shadow-lg shadow-[#535C91]/40"
          >
            Log In
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-20 pb-32">

        <h1 className="text-4xl md:text-[72px] font-extrabold leading-tight max-w-4xl">
          Meet Someone New.
          <br />
          Right Now.
        </h1>

        <p className="mt-6 text-[#C6C9FF] text-base md:text-lg max-w-xl">
          Instant, anonymous video chats. No filters. Just real conversations.
        </p>

        {/* Demo Video Container */}
        <div className="mt-14 w-full max-w-4xl aspect-video rounded-2xl overflow-hidden relative border border-[#535C91]/40 shadow-[0_0_40px_rgba(83,92,145,0.4)]">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center text-white/60 text-lg">
            Demo Preview
          </div>
        </div>

        {/* CTA */}
        <Link
          to="/chat"
          className="mt-12 px-8 py-4 rounded-full bg-[#535C91] hover:bg-[#646EB0] transition shadow-xl shadow-[#535C91]/40 text-lg font-semibold"
        >
          Start Chatting →
        </Link>

      </section>

      {/* Floating animation keyframes */}
      <style>
        {`
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-40px); }
            100% { transform: translateY(0px); }
          }
        `}
      </style>

    </div>
  );
}