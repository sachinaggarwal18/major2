import { FC } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
// Removed Navbar import as it's now in Layout
import Layout from "./components/Layout"; // Import the new Layout component
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";
import DoctorLogin from "./components/DoctorLogin";
import DoctorSignup from "./components/DoctorSignup";
import PatientLogin from "./components/PatientLogin";
import PatientSignup from "./components/PatientSignup";
import DoctorDashboard from "./pages/DoctorDashboard";
import PatientDashboard from "./pages/PatientDashboard";
import CreatePrescription from "./pages/CreatePrescription";
import ViewPrescriptions from "./pages/ViewPrescriptions";

const App: FC = () => {
  return (
    <BrowserRouter>
      {/* Wrap all routes in ErrorBoundary */}
      <ErrorBoundary> 
        <div className="min-h-screen bg-background font-sans antialiased">
          <Routes>
            {/* Routes outside the main Layout (no persistent Navbar) */}
            <Route path="/" element={<Home />} />
            <Route path="/doctor/login" element={<DoctorLogin />} />
            <Route path="/doctor/signup" element={<DoctorSignup />} />
            <Route path="/patient/login" element={<PatientLogin />} />
            <Route path="/patient/signup" element={<PatientSignup />} />

            {/* Routes inside the main Layout (with persistent Navbar) */}
            <Route element={<Layout />}>
              <Route 
                path="/doctor-dashboard" 
                element={<DoctorDashboard />} 
              />
              <Route 
                path="/patient-dashboard" 
                element={<PatientDashboard />} 
              />
              <Route 
                path="/create-prescription" 
                element={<CreatePrescription />} 
              />
              <Route 
                path="/view-prescriptions" 
                element={<ViewPrescriptions />} 
              />
              {/* Add other authenticated routes here */}
            </Route>

            {/* Optional: Add a 404 Not Found route */}
            {/* <Route path="*" element={<NotFoundPage />} /> */}
          </Routes>
        </div>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
