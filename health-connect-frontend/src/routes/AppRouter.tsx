import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthPage from "../pages/auth/AuthPage";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
      </Routes>
    </BrowserRouter>
  );
}