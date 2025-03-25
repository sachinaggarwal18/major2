import React from "react";
import { Link } from "react-router-dom";
import "../styles/DoctorDashboard.css";

function DoctorDashboard() {
  return (
    <div className="doctor-dashboard">
      <h2>Doctor Dashboard</h2>

      <div className="welcome-msg">
        <p>
          Welcome, Doctor! Manage your patients and prescriptions efficiently.
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

        <button className="btn logout-btn">🚪 Logout</button>
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
}

export default DoctorDashboard;
