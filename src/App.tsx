// BACKEND: restore this later — original imports for backend/auth pages
// import { ProtectedRoute } from "./components/ProtectedRoute";
// import { DashboardContainer, Dashboard, Login, NotFound, MyProfile, UploadDoc, DocList, Chat } from "./pages";
// import Register from "./pages/Register";
// import PublicRoute from "./pages/PublicRoute";

import "./App.css";
import "./index.css";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import { NEXUS_ROUTES } from "./shared/routes";
import { NexusLayout } from "./components/NexusLayout/NexusLayout";
import NexusDashboard from "./pages/NexusDashboard";
import NexusChat from "./pages/NexusChat";
import NexusCodingTutor from "./pages/NexusCodingTutor";
import NexusExamPrep from "./pages/NexusExamPrep";
import NexusExplore from "./pages/NexusExplore";
import NexusSettings from "./pages/NexusSettings";

function App() {
  return (
    // BACKEND: restore this later — original App routing
    // The original app used ProtectedRoute for auth-gated pages.
    // All API calls went through axiosSecure with JWT bearer tokens.
    // Restore by uncommenting the original imports above and the route tree below.
    <BrowserRouter>
      <NexusLayout>
        <Routes>
          <Route path={NEXUS_ROUTES.HOME} element={<NexusDashboard />} />
          <Route path={NEXUS_ROUTES.CHAT} element={<NexusChat />} />
          <Route path={NEXUS_ROUTES.CODE} element={<NexusCodingTutor />} />
          <Route path={NEXUS_ROUTES.EXAM} element={<NexusExamPrep />} />
          <Route path={NEXUS_ROUTES.EXPLORE} element={<NexusExplore />} />
          <Route path={NEXUS_ROUTES.SETTINGS} element={<NexusSettings />} />
          {/* Catch-all redirects to home */}
          <Route path="*" element={<NexusDashboard />} />
        </Routes>
      </NexusLayout>
    </BrowserRouter>
  );
}

export default App;
