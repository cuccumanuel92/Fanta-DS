import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppShell from "./layout/AppShell";
import Home from "./pages/Home";
import Players from "./pages/Players";
import Settings from "./pages/Settings";
import Pitch from "./pages/Pitch";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
        <Route path="/campo" element={<Pitch />} />
          <Route path="/" element={<Home />} />
          <Route path="/players" element={<Players />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}