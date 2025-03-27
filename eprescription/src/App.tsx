import { FC } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
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
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/doctor/login" element={<DoctorLogin />} />
        <Route path="/doctor/signup" element={<DoctorSignup />} />
        <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
        <Route path="/patient/login" element={<PatientLogin />} />
        <Route path="/patient/signup" element={<PatientSignup />} />
        <Route path="/patient-dashboard" element={<PatientDashboard />} />
        <Route path="/create-prescription" element={<CreatePrescription />} />
        <Route path="/view-prescriptions" element={<ViewPrescriptions />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;