import { useRef, useState } from "react";
import { socket } from "../socket/socket";
import api from "../api/axios";

export default function useWebRTC() {
    const peerRef = useRef(null);
    const localStreamRef = useRef(null);
    const timeoutRef = useRef(null);
    const statsIntervalRef = useRef(null);

    const [remoteStream, setRemoteStream] = useState(null);
    const [connectionState, setConnectionState] = useState("new");
    const [stats, setStats] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);

    const createPeerConnection = async () => {
        const { data } = await api.get("/auth/turn-credentials");

        const peer = new RTCPeerConnection({
            iceServers: data.iceServers,
        });

        peer.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit("ice-candidate", { candidate: event.candidate });
            }
        };

        peer.ontrack = (event) => {
            setRemoteStream(event.streams[0]);
        };

        peer.onconnectionstatechange = () => {
            setConnectionState(peer.connectionState);

            if (peer.connectionState === "connected") {
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                    timeoutRef.current = null;
                }

                startStatsMonitoring(peer);
            }

            if (
                peer.connectionState === "failed" ||
                peer.connectionState === "disconnected" ||
                peer.connectionState === "closed"
            ) {
                cleanup();
            }
        };

        peer.oniceconnectionstatechange = () => {
            if (peer.iceConnectionState === "failed") {
                peer.restartIce();
            }
        };

        timeoutRef.current = setTimeout(() => {
            if (peer.connectionState !== "connected") {
                console.warn("Connection timeout");
                cleanup();
            }
        }, 10000);

        peerRef.current = peer;
    };

    const startStatsMonitoring = (peer) => {
  let lastBytes = 0;
  let lastTimestamp = 0;

  statsIntervalRef.current = setInterval(async () => {
    const report = await peer.getStats();

    report.forEach((stat) => {
      if (stat.type === "outbound-rtp" && stat.kind === "video") {
        if (lastTimestamp) {
          const bitrate =
            (8 * (stat.bytesSent - lastBytes)) /
            (stat.timestamp - lastTimestamp);

          const kbps = Math.floor(bitrate);

          let quality = "Poor";

          if (kbps > 1200) quality = "Excellent";
          else if (kbps > 600) quality = "Good";
          else if (kbps > 250) quality = "Fair";

          setStats({
            bitrate: kbps,
            packetsSent: stat.packetsSent,
            quality,
          });
        }

        lastBytes = stat.bytesSent;
        lastTimestamp = stat.timestamp;
      }
    });
  }, 2000);
};

    const initLocalStream = async () => {
        let stream;

        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30, max: 30 },
                },
                audio: true,
            });
        } catch (err) {
            console.log(err);
            throw new Error("Camera or microphone access denied.");
        }

        localStreamRef.current = stream;

        stream.getTracks().forEach((track) => {
            peerRef.current.addTrack(track, stream);
        });

        const sender = peerRef.current
            .getSenders()
            .find((s) => s.track?.kind === "video");

        if (sender) {
            const params = sender.getParameters();
            if (!params.encodings) {
                params.encodings = [{}];
            }
            params.encodings[0].maxBitrate = 500_000;
            await sender.setParameters(params);
        }

        return stream;
    };
    const toggleMute = () => {
        if (!localStreamRef.current) return;

        const audioTrack = localStreamRef.current
            .getTracks()
            .find((t) => t.kind === "audio");

        if (!audioTrack) return;

        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
    };

    const toggleVideo = () => {
        if (!localStreamRef.current) return;

        const videoTrack = localStreamRef.current
            .getTracks()
            .find((t) => t.kind === "video");

        if (!videoTrack) return;

        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
    };
    const createOffer = async () => {
        const offer = await peerRef.current.createOffer();
        await peerRef.current.setLocalDescription(offer);
        socket.emit("offer", { offer });
    };

    const handleOffer = async (offer) => {
        await peerRef.current.setRemoteDescription(offer);
        const answer = await peerRef.current.createAnswer();
        await peerRef.current.setLocalDescription(answer);
        socket.emit("answer", { answer });
    };

    const handleAnswer = async (answer) => {
        await peerRef.current.setRemoteDescription(answer);
    };

    const handleIceCandidate = async (candidate) => {
        try {
            await peerRef.current.addIceCandidate(candidate);
        } catch (err) {
            console.error("ICE error:", err);
        }
    };

    const cleanup = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        if (statsIntervalRef.current) {
            clearInterval(statsIntervalRef.current);
            statsIntervalRef.current = null;
        }

        if (peerRef.current) {
            peerRef.current.close();
            peerRef.current = null;
        }

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => track.stop());
            localStreamRef.current = null;
        }

        setRemoteStream(null);
        setConnectionState("closed");
        setStats(null);
    };

    return {
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
  isVideoOff
};
}
