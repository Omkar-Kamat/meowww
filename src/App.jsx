import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import Login from "./auth/Login";
import Signup from "./auth/Signup";
import Verify from "./auth/Verify";
import ChatPage from "./pages/ChatPage";
import { useAuthStore } from "./store/useAuthStore";
import ProtectedRoute from "./routes/ProtectedRoute";
import ToastContainer from "./components/ToastContainer";
import HomePage from "./pages/HomePage";

export default function App() {
    const fetchMe = useAuthStore((s) => s.fetchMe);
    const isAuthChecked = useAuthStore((s) => s.isAuthChecked);

    useEffect(() => {
        fetchMe();
    }, []);

    if (!isAuthChecked) {
        return (
            <div className="h-screen flex items-center justify-center bg-neutral-950 text-white">
                Loading...
            </div>
        );
    }

    return (
        <BrowserRouter>
            <ToastContainer />
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/verify" element={<Verify />} />

                <Route
                    path="/chat"
                    element={
                        <ProtectedRoute>
                            <ChatPage />
                        </ProtectedRoute>
                    }
                />

                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </BrowserRouter>
    );
}
