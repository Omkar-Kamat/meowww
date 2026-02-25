import { useEffect, useRef, useState } from "react";
import { socket } from "../socket/socket";
import { useAuthStore } from "../store/useAuthStore";
import { useToastStore } from "../store/useToastStore";
import useWebRTC from "../rtc/useWebRTC";

export default function ChatPage() {
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);
    const show = useToastStore((s) => s.show);

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
        toggleMute,
        toggleVideo,
        isMuted,
        isVideoOff,
    } = useWebRTC();

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    useEffect(() => {
        socket.connect();

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
                show(err.message || "Connection failed", "error");
                cleanup();
                setStatus("idle");
            }
        };

        const handlePeerDisconnected = () => {
            cleanup();
            setStatus("idle");

            setTimeout(() => {
                setStatus("queued");
                socket.emit("search");
            }, 800);
        };

        socket.on("queued", () => setStatus("queued"));
        socket.on("matched", handleMatched);
        socket.on("offer", ({ offer }) => handleOffer(offer));
        socket.on("answer", ({ answer }) => handleAnswer(answer));
        socket.on("ice-candidate", ({ candidate }) =>
            handleIceCandidate(candidate),
        );
        socket.on("peer-disconnected", handlePeerDisconnected);

        return () => {
            cleanup();
            socket.removeAllListeners();
            socket.disconnect();
        };
    }, []);

    const handleSearch = () => {
        setStatus("queued");
        socket.emit("search");
    };

    const handleSkip = () => {
        cleanup();
        socket.emit("skip");
        setStatus("idle");
    };

    const isConnecting =
        status === "matched" && connectionState !== "connected";

    return (
        <div className="h-screen flex flex-col bg-neutral-950 text-white">
            {/* HEADER */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-neutral-800">
                <span className="font-semibold">{user?.username}</span>
                <button
                    onClick={logout}
                    className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition"
                >
                    Logout
                </button>
            </div>

            {/* CONNECTION STATUS */}
            {status === "matched" && (
                <div className="text-center text-sm text-neutral-400 mt-2">
                    {connectionState === "connecting" && "Connecting..."}
                    {connectionState === "connected" && "Connected"}
                    {connectionState === "failed" && "Connection failed"}
                    {connectionState === "disconnected" && "Connection lost"}
                </div>
            )}

            {/* VIDEO GRID */}
            <div className="relative flex-1 grid grid-cols-2 gap-4 p-6">
                {isConnecting && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-20">
                        <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full" />
                    </div>
                )}

                {/* LOCAL VIDEO */}
                <div className="relative bg-neutral-900 rounded-2xl overflow-hidden">
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                    />
                    {isVideoOff && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-sm">
                            Camera Off
                        </div>
                    )}
                    <div className="absolute bottom-3 left-3 text-xs bg-black/60 px-3 py-1 rounded-lg">
                        You
                    </div>
                </div>

                {/* REMOTE VIDEO */}
                <div className="relative bg-neutral-900 rounded-2xl overflow-hidden">
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-3 left-3 text-xs bg-black/60 px-3 py-1 rounded-lg">
                        Stranger
                    </div>
                </div>

                {/* STATS */}
                {stats && (
                    <div className="absolute bottom-4 right-4 text-xs bg-black/70 px-4 py-2 rounded-xl">
                        Packets: {stats.packetsSent}
                    </div>
                )}
            </div>

            {/* CONTROLS */}
            <div className="p-6 border-t border-neutral-800 flex flex-col items-center gap-4">
                <div className="flex gap-4">
                    <button
                        onClick={toggleMute}
                        className={`px-6 py-3 rounded-xl font-semibold transition
        ${
            isMuted
                ? "bg-red-600 hover:bg-red-500"
                : "bg-neutral-800 hover:bg-neutral-700"
        }`}
                    >
                        {isMuted ? "Unmute Mic" : "Mute Mic"}
                    </button>

                    <button
                        onClick={toggleVideo}
                        className={`px-6 py-3 rounded-xl font-semibold transition
        ${
            isVideoOff
                ? "bg-red-600 hover:bg-red-500"
                : "bg-neutral-800 hover:bg-neutral-700"
        }`}
                    >
                        {isVideoOff ? "Turn Camera On" : "Turn Camera Off"}
                    </button>

                    {/* Search / Skip Button */}
                    {status === "matched" ? (
                        <button
                            onClick={handleSkip}
                            className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 transition font-semibold"
                        >
                            Skip
                        </button>
                    ) : (
                        <button
                            onClick={handleSearch}
                            className="px-6 py-3 rounded-xl bg-green-600 hover:bg-green-500 transition font-semibold"
                        >
                            {status === "queued" ? "Searching..." : "Search"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
