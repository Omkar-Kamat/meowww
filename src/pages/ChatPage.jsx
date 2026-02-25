import { useEffect, useRef, useState } from "react";
import { socket } from "../socket/socket";
import { useAuthStore } from "../store/useAuthStore";
import useWebRTC from "../rtc/useWebRTC";

export default function ChatPage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const [status, setStatus] = useState("idle");

  const {
    createPeerConnection,
    initLocalStream,
    createOffer,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    cleanup,
    remoteStream,
    connectionState,
    stats,
  } = useWebRTC();

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    socket.connect();

    const handleQueued = () => setStatus("queued");

    const handleMatched = async ({ isInitiator }) => {
      try {
        setStatus("matched");

        await createPeerConnection();
        const stream = await initLocalStream();

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        if (isInitiator) {
          await createOffer();
        }
      } catch (err) {
        console.log(err)
        cleanup();
        setStatus("idle");
      }
    };

    const handlePeerDisconnected = () => {
      cleanup();
      setStatus("idle");

      setTimeout(() => {
        socket.emit("search");
      }, 1000);
    };

    socket.on("queued", handleQueued);
    socket.on("matched", handleMatched);
    socket.on("offer", ({ offer }) => handleOffer(offer));
    socket.on("answer", ({ answer }) => handleAnswer(answer));
    socket.on("ice-candidate", ({ candidate }) =>
      handleIceCandidate(candidate)
    );
    socket.on("peer-disconnected", handlePeerDisconnected);

    return () => {
      cleanup();
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, []);

  const handleSearch = () => socket.emit("search");

  const handleSkip = () => {
    cleanup();
    socket.emit("skip");
    setStatus("idle");
  };

  return (
    <div className="h-screen flex flex-col bg-neutral-950 text-white">

      <div className="flex justify-between items-center p-4 border-b border-neutral-800">
        <span className="font-semibold">{user?.username}</span>
        <button
          onClick={logout}
          className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition"
        >
          Logout
        </button>
      </div>

      {status === "matched" && (
        <div className="text-center text-sm text-neutral-400 mt-2">
          {connectionState === "connecting" && "Connecting..."}
          {connectionState === "connected" && "Connected"}
          {connectionState === "disconnected" && "Connection lost"}
          {connectionState === "failed" && "Connection failed"}
        </div>
      )}

      <div className="relative flex-1 grid grid-cols-2 gap-4 p-6">

        {status === "matched" && connectionState !== "connected" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
            <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full"></div>
          </div>
        )}

        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="bg-neutral-900 rounded-2xl object-cover"
        />

        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="bg-neutral-900 rounded-2xl object-cover"
        />

        {stats && (
          <div className="absolute bottom-4 right-4 text-xs text-neutral-400 bg-black/60 px-3 py-1 rounded">
            Packets: {stats.packetsSent}
          </div>
        )}
      </div>

      <div className="p-6 border-t border-neutral-800 flex justify-center gap-6">

        {status === "idle" && (
          <button
            onClick={handleSearch}
            className="px-8 py-3 rounded-xl bg-green-600 hover:bg-green-500 transition font-semibold"
          >
            Search
          </button>
        )}

        {status === "queued" && (
          <div className="px-8 py-3 rounded-xl bg-yellow-600 font-semibold">
            Searching...
          </div>
        )}

        {status === "matched" && (
          <button
            onClick={handleSkip}
            className="px-8 py-3 rounded-xl bg-red-600 hover:bg-red-500 transition font-semibold"
          >
            Skip
          </button>
        )}

      </div>
    </div>
  );
}