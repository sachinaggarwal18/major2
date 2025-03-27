import { FC, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";
import { Patient } from "../types/models";
import { patientService } from "../services/api";

const PatientDashboard: FC = () => {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPatientProfile = async (): Promise<void> => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/patient/login');
          return;
        }

        const response = await patientService.getProfile(token);
        setPatient(response.patient);
      } catch (error) {
        console.error('Error fetching patient profile:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('userType');
        navigate('/patient/login');
      } finally {
        setLoading(false);
      }
    };

    fetchPatientProfile();
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
    <div className="patient-dashboard">
      <h2>Patient Dashboard</h2>
      <div className="welcome-msg">
        <p>
          Welcome, {patient?.name ?? 'Patient'}! Your health information and prescriptions in one place.
        </p>
      </div>
      <nav>
        <Link to="/view-prescriptions" className="btn">
          📋 My Prescriptions
        </Link>
        <Link to="/book-appointment" className="btn">
          📅 Book Appointment
        </Link>
        <Link to="/medical-history" className="btn">
          📚 Medical History
        </Link>
        <button className="btn logout-btn" onClick={handleLogout}>
          🚪 Logout
        </button>
      </nav>
      <section className="health-info">
        <h3>🏥 My Health Information</h3>
        {patient && (
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Name:</span>
              <span className="value">{patient.name}</span>
            </div>
            <div className="info-item">
              <span className="label">Age:</span>
              <span className="value">{patient.age}</span>
            </div>
            <div className="info-item">
              <span className="label">Gender:</span>
              <span className="value">{patient.gender}</span>
            </div>
            <div className="info-item">
              <span className="label">Contact:</span>
              <span className="value">{patient.phoneNumber}</span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default PatientDashboard;