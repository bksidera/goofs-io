

import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import AdGameExe from "./AdGame"; 

function Home() {
  return (
    <div style={{ textAlign: "center", padding: "50px", fontFamily: "monospace", background: "#000", color: "#39FF14", height: "100vh" }}>
      <h1>Welcome to goofs.io</h1>
      <p>A collection of weird stuff.</p>
      <Link to="/adgame" style={{ color: "#FF2D95", fontSize: "24px", textDecoration: "none", border: "1px solid #FF2D95", padding: "10px" }}>
        Play AdGame.exe
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/adgame" element={<AdGameExe />} />
      </Routes>
    </Router>
  );
}