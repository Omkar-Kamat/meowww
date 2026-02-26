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
    const chatEndRef = useRef(null);

    const [status, setStatus] = useState("idle");
    const [messages, setMessages] = useState([]);
    const [chatInput, setChatInput] = useState("");
    const [mediaReady, setMediaReady] = useState(false);
    const [mediaError, setMediaError] = useState(null);

    const {
        createPeerConnection,
        initLocalStream,
        createOffer,
        handleOffer,
        handleAnswer,
        handleIceCandidate,
        cleanupPeer,
        cleanupAll,
        remoteStream,
        connectionState,
        stats,
        toggleMute,
        toggleVideo,
        isMuted,
        isVideoOff,
        // localStreamRef,
    } = useWebRTC();

    // Keep latest WebRTC functions in refs so socket listeners never go stale
    const rtcRef = useRef({});

    useEffect(() => {
        rtcRef.current = {
            createPeerConnection,
            initLocalStream,
            createOffer,
            handleOffer,
            handleAnswer,
            handleIceCandidate,
            cleanupPeer,
            cleanupAll,
        };
    }, [
        createPeerConnection,
        initLocalStream,
        createOffer,
        handleOffer,
        handleAnswer,
        handleIceCandidate,
        cleanupPeer,
        cleanupAll,
    ]);

    // ── Acquire camera + mic once on page load ──
    useEffect(() => {
        let cancelled = false;

        const startMedia = async () => {
            try {
                const stream = await initLocalStream();
                if (!cancelled && localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }
                if (!cancelled) setMediaReady(true);
            } catch (err) {
                if (!cancelled) {
                    setMediaError(err.message || "Camera/mic access denied");
                    show("Camera or microphone access denied", "error");
                }
            }
        };

        startMedia();

        return () => {
            cancelled = true;
        };
    }, []);

    // Attach remote stream to video element
    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // ── Socket lifecycle ──
    useEffect(() => {
        socket.connect();

        const onConnect = () => {
            console.log("Socket connected:", socket.id);
        };

        const onMatched = async ({ isInitiator }) => {
            try {
                setStatus("matched");
                setMessages([]);

                await rtcRef.current.createPeerConnection();

                if (isInitiator) {
                    await rtcRef.current.createOffer();
                }
            } catch (err) {
                show(err.message || "Connection failed", "error");
                rtcRef.current.cleanupPeer();
                setStatus("idle");
            }
        };

        const onOffer = async ({ offer }) => {
            try {
                await rtcRef.current.handleOffer(offer);
            } catch (err) {
                console.error("Error handling offer:", err);
            }
        };

        const onAnswer = async ({ answer }) => {
            try {
                await rtcRef.current.handleAnswer(answer);
            } catch (err) {
                console.error("Error handling answer:", err);
            }
        };

        const onIceCandidate = async ({ candidate }) => {
            try {
                await rtcRef.current.handleIceCandidate(candidate);
            } catch (err) {
                console.error("Error handling ICE candidate:", err);
            }
        };

        const onPeerDisconnected = () => {
            rtcRef.current.cleanupPeer();
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = null;
            }
            setStatus("idle");
            setMessages([]);
        };

        const onQueued = () => setStatus("queued");

        const onReceiveMessage = ({ text, fromSelf }) => {
            setMessages((prev) => [...prev, { text, fromSelf }]);
        };

        const onSessionTerminated = () => {
            rtcRef.current.cleanupAll();
            show("Session opened in another tab", "error");
            logout();
        };

        const onConnectError = (err) => {
            console.error("Socket connection error:", err.message);
            if (err.message?.includes("Authentication")) {
                show("Session expired. Please login again.", "error");
                logout();
            }
        };

        socket.on("connect", onConnect);
        socket.on("queued", onQueued);
        socket.on("matched", onMatched);
        socket.on("offer", onOffer);
        socket.on("answer", onAnswer);
        socket.on("ice-candidate", onIceCandidate);
        socket.on("peer-disconnected", onPeerDisconnected);
        socket.on("receive-message", onReceiveMessage);
        socket.on("session-terminated", onSessionTerminated);
        socket.on("connect_error", onConnectError);

        return () => {
            socket.emit("stop-search");
            rtcRef.current.cleanupAll();
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = null;
            }
            socket.off("connect", onConnect);
            socket.off("queued", onQueued);
            socket.off("matched", onMatched);
            socket.off("offer", onOffer);
            socket.off("answer", onAnswer);
            socket.off("ice-candidate", onIceCandidate);
            socket.off("peer-disconnected", onPeerDisconnected);
            socket.off("receive-message", onReceiveMessage);
            socket.off("session-terminated", onSessionTerminated);
            socket.off("connect_error", onConnectError);
            socket.disconnect();
        };
    }, []);

    const handleSearch = () => {
        if (!mediaReady) {
            show("Camera not ready yet", "error");
            return;
        }
        setStatus("queued");
        socket.emit("search");
    };

    // const handleSkip = () => {
    //     cleanupPeer();
    //     if (remoteVideoRef.current) {
    //         remoteVideoRef.current.srcObject = null;
    //     }
    //     socket.emit("skip");
    //     setStatus("idle");
    //     setMessages([]);
    // };

    const handleSendMessage = (e) => {
        e.preventDefault();
        const text = chatInput.trim();
        if (!text) return;
        socket.emit("send-message", { text });
        setChatInput("");
    };

    const isConnecting =
        status === "matched" && connectionState !== "connected";
    const isConnected = status === "matched" && connectionState === "connected";

    return (
        <div className="h-screen flex flex-col bg-gradient-to-b from-[#070F2B] to-[#1B1A55] text-white">
            {/* HEADER */}
            <div className="flex justify-between items-center px-8 py-5 backdrop-blur-md bg-white/5 border-b border-white/10">
                <span className="font-semibold text-[#C6C9FF] tracking-wide">
                    {user?.username}
                </span>

                <div className="flex items-center gap-3">
                    <button
                        onClick={toggleMute}
                        disabled={!mediaReady}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300
          ${
              isMuted
                  ? "bg-red-500/80 hover:bg-red-500"
                  : "bg-white/10 hover:bg-white/20"
          } disabled:opacity-40`}
                    >
                        {isMuted ? "🔇 Muted" : "🎤 Mic"}
                    </button>

                    <button
                        onClick={toggleVideo}
                        disabled={!mediaReady}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300
          ${
              isVideoOff
                  ? "bg-red-500/80 hover:bg-red-500"
                  : "bg-white/10 hover:bg-white/20"
          } disabled:opacity-40`}
                    >
                        {isVideoOff ? "📷 Off" : "📹 Cam"}
                    </button>

                    <button
                        onClick={logout}
                        className="px-4 py-2 rounded-full bg-[#535C91] hover:bg-[#646EB0] transition shadow-lg shadow-[#535C91]/40 text-sm"
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* CONNECTION STATUS */}
            {status === "matched" && (
                <div className="text-center text-sm text-[#C6C9FF] mt-2">
                    {connectionState === "connecting" && "Connecting..."}
                    {connectionState === "connected" && "Connected"}
                    {connectionState === "failed" && "Connection failed"}
                    {connectionState === "disconnected" && "Connection lost"}
                </div>
            )}

            {/* MEDIA ERROR — RESTORED */}
            {mediaError && (
                <div className="text-center mt-3">
                    <div className="inline-block px-4 py-2 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-sm backdrop-blur">
                        ⚠ {mediaError}
                    </div>
                </div>
            )}

            {/* MAIN */}
            <div className="flex-1 flex overflow-hidden">
                {/* VIDEO GRID */}
                <div className="relative flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 p-8">
                    {isConnecting && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-20">
                            <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full" />
                        </div>
                    )}

                    {/* LOCAL VIDEO */}
                    <div className="relative rounded-2xl overflow-hidden bg-black/40 backdrop-blur-md border border-white/10 shadow-xl">
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                        />

                        {!mediaReady && !mediaError && (
                            <div className="absolute inset-0 flex items-center justify-center text-[#C6C9FF]/70 text-sm">
                                Starting camera...
                            </div>
                        )}

                        {isVideoOff && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-sm">
                                Camera Off
                            </div>
                        )}

                        <div className="absolute bottom-3 left-3 text-xs bg-black/60 px-3 py-1 rounded-full backdrop-blur">
                            You
                        </div>
                    </div>

                    {/* REMOTE VIDEO */}
                    <div className="relative rounded-2xl overflow-hidden bg-black/40 backdrop-blur-md border border-white/10 shadow-xl">
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                        />

                        {!remoteStream && (
                            <div className="absolute inset-0 flex items-center justify-center text-[#C6C9FF]/70 text-sm">
                                {status === "idle" && "Click Search to begin"}
                                {status === "queued" &&
                                    "Looking for someone..."}
                                {status === "matched" &&
                                    connectionState !== "connected" &&
                                    "Connecting..."}
                            </div>
                        )}

                        <div className="absolute bottom-3 left-3 text-xs bg-black/60 px-3 py-1 rounded-full backdrop-blur">
                            Stranger
                        </div>
                    </div>

                    {/* STATS */}
                    {stats && (
                        <div className="absolute bottom-6 right-8 text-xs bg-black/60 backdrop-blur px-4 py-3 rounded-xl border border-white/10 shadow-lg">
                            <div className="font-semibold text-[#C6C9FF]">
                                {stats.quality}
                            </div>
                            <div>Bitrate: {stats.bitrate} kbps</div>
                        </div>
                    )}
                </div>

                {/* CHAT PANEL */}
                {isConnected && (
                    <div className="w-80 flex flex-col border-l border-white/10 backdrop-blur-md bg-white/5">
                        <div className="px-4 py-3 border-b border-white/10 text-sm font-semibold text-[#C6C9FF]">
                            Chat
                        </div>

                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                            {messages.map((msg, i) => (
                                <div
                                    key={i}
                                    className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm ${
                                        msg.fromSelf
                                            ? "ml-auto bg-[#535C91] shadow-lg shadow-[#535C91]/40"
                                            : "mr-auto bg-white/10"
                                    }`}
                                >
                                    {msg.text}
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>

                        <form
                            onSubmit={handleSendMessage}
                            className="p-3 border-t border-white/10 flex gap-2"
                        >
                            <input
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 px-3 py-2 rounded-full bg-white/10 backdrop-blur text-sm outline-none focus:ring-1 focus:ring-[#535C91]"
                            />
                            <button
                                type="submit"
                                className="px-4 py-2 rounded-full bg-[#535C91] hover:bg-[#646EB0] transition shadow-md shadow-[#535C91]/40 text-sm"
                            >
                                Send
                            </button>
                        </form>
                    </div>
                )}
            </div>

            {/* BOTTOM CONTROLS */}
            <div className="p-6 border-t border-white/10 backdrop-blur-md bg-white/5 flex justify-center gap-6">
                <button
                    onClick={handleSearch}
                    disabled={status !== "idle" || !mediaReady}
                    className="px-8 py-3 rounded-full bg-[#535C91] hover:bg-[#646EB0] transition shadow-xl shadow-[#535C91]/40 font-semibold disabled:opacity-30"
                >
                    Search
                </button>

                <button
                    onClick={() => {
                        socket.emit("stop-search");
                        setStatus("idle");
                    }}
                    disabled={status !== "queued"}
                    className="px-8 py-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500 transition font-semibold disabled:opacity-30"
                >
                    Stop
                </button>

                <button
                    onClick={() => {
                        cleanupPeer();
                        if (remoteVideoRef.current) {
                            remoteVideoRef.current.srcObject = null;
                        }
                        socket.emit("skip");
                        setStatus("idle");
                        setMessages([]);
                    }}
                    disabled={status !== "matched"}
                    className="px-8 py-3 rounded-full bg-neutral-700 hover:bg-neutral-600 transition font-semibold disabled:opacity-30"
                >
                    End
                </button>

                <button
                    onClick={() => {
                        cleanupPeer();
                        if (remoteVideoRef.current) {
                            remoteVideoRef.current.srcObject = null;
                        }
                        socket.emit("skip");
                        setMessages([]);
                        setStatus("queued");
                        socket.emit("search");
                    }}
                    disabled={status !== "matched"}
                    className="px-8 py-3 rounded-full bg-red-600 hover:bg-red-500 transition font-semibold disabled:opacity-30"
                >
                    Skip
                </button>
            </div>
        </div>
    );
}
