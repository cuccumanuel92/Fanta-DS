import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppShell from "./layout/AppShell";

import Home from "./pages/Home";
import Players from "./pages/Players";
import Settings from "./pages/Settings";
import Pitch from "./pages/Pitch";
import Moves from "./pages/Moves";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<Home />} />
          <Route path="players" element={<Players />} />
          <Route path="moves" element={<Moves />} />
          <Route path="campo" element={<Pitch />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}