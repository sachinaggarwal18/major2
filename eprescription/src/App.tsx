import { FC } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
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
    <ErrorBoundary>
      <BrowserRouter>
        <div className="min-h-screen bg-background font-sans antialiased">
          <Navbar />
          <main className="relative">
            <div className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/doctor/login" element={<DoctorLogin />} />
                <Route path="/doctor/signup" element={<DoctorSignup />} />
                <Route 
                  path="/doctor-dashboard" 
                  element={
                    <ErrorBoundary>
                      <DoctorDashboard />
                    </ErrorBoundary>
                  } 
                />
                <Route path="/patient/login" element={<PatientLogin />} />
                <Route path="/patient/signup" element={<PatientSignup />} />
                <Route 
                  path="/patient-dashboard" 
                  element={
                    <ErrorBoundary>
                      <PatientDashboard />
                    </ErrorBoundary>
                  } 
                />
                <Route 
                  path="/create-prescription" 
                  element={
                    <ErrorBoundary>
                      <CreatePrescription />
                    </ErrorBoundary>
                  } 
                />
                <Route 
                  path="/view-prescriptions" 
                  element={
                    <ErrorBoundary>
                      <ViewPrescriptions />
                    </ErrorBoundary>
                  } 
                />
              </Routes>
            </div>
          </main>
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
