import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home.jsx";
import DoctorLogin from "./components/DoctorLogin.jsx";
import DoctorSignup from "./components/DoctorSignup.jsx";
import PatientLogin from "./components/PatientLogin.jsx";
import PatientSignup from "./components/PatientSignup.jsx";
import DoctorDashboard from "./pages/DoctorDashboard.jsx";
import PatientDashboard from "./pages/PatientDashboard.jsx";
import CreatePrescription from "./pages/CreatePrescription.jsx";
import ViewPrescriptions from "./pages/ViewPrescriptions.jsx";

function App() {
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
