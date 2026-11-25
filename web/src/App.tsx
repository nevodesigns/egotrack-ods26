import { Routes, Route } from "react-router";
import { Welcome } from "./screens/Welcome";
import { Home } from "./screens/Home";
import { Scan } from "./screens/Scan";
import { CheckPage } from "./screens/CheckPage";
import { Owed } from "./screens/Owed";
import { CustomerDetail } from "./screens/CustomerDetail";
import { Trust } from "./screens/Trust";
import { More } from "./screens/More";
import { PublicTrust } from "./screens/PublicTrust";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/home" element={<Home />} />
      <Route path="/scan" element={<Scan />} />
      <Route path="/check" element={<CheckPage />} />
      <Route path="/owed" element={<Owed />} />
      <Route path="/owed/:id" element={<CustomerDetail />} />
      <Route path="/trust" element={<Trust />} />
      <Route path="/more" element={<More />} />
      {/* public, no sign-in: opened from a QR, a WhatsApp link or a printed card */}
      <Route path="/t/:code" element={<PublicTrust />} />
    </Routes>
  );
}
