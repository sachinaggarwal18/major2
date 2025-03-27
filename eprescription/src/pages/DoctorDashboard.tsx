import { FC, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/DoctorDashboard.css";
import { Doctor } from "../types/models";
import { doctorService } from "../services/api";

const DoctorDashboard: FC = () => {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDoctorProfile = async (): Promise<void> => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/doctor/login');
          return;
        }

        const response = await doctorService.getProfile(token);
        setDoctor(response.doctor);
      } catch (error) {
        console.error('Error fetching doctor profile:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('userType');
        navigate('/doctor/login');
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorProfile();
  }, [navigate]);

  const handleLogout = (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    navigate('/');
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="doctor-dashboard">
      <h2>Doctor Dashboard</h2>
      <div className="welcome-msg">
        <p>
          Welcome, {doctor?.name ?? 'Doctor'}! Manage your patients and prescriptions efficiently.
        </p>
      </div>
      <nav>
        <Link to="/create-prescription" className="btn">
          📝 Create Prescription
        </Link>
        <Link to="/view-prescriptions" className="btn">
          📄 View Prescriptions
        </Link>
        <Link to="/patient-records" className="btn">
          🧑‍⚕️ Patient Records
        </Link>
        <Link to="/appointments" className="btn">
          📅 Appointments
        </Link>
        <button className="btn logout-btn" onClick={handleLogout}>
          🚪 Logout
        </button>
      </nav>
      <section className="tips-section">
        <h3>📌 Quick Tips</h3>
        <ul>
          <li>Keep your patient records updated regularly.</li>
          <li>Use clear instructions while prescribing medicines.</li>
          <li>Review patient history before prescribing.</li>
        </ul>
      </section>
    </div>
  );
};

export default DoctorDashboard;