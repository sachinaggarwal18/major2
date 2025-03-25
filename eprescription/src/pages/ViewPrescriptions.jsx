// src/pages/ViewPrescriptions.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import "./ViewPrescriptions.css";

const ViewPrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPrescriptions = async () => {
    try {
      const res = await axios.get("http://localhost:8000/prescriptions");
      setPrescriptions(res.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  return (
    <div className="view-prescription-container">
      <h2>All Prescriptions</h2>
      {loading ? (
        <p>Loading prescriptions...</p>
      ) : prescriptions.length === 0 ? (
        <p>No prescriptions found.</p>
      ) : (
        <div className="prescription-list">
          {prescriptions.map((prescription) => (
            <div key={prescription._id} className="prescription-card">
              <h3>Patient: {prescription.patientEmail}</h3>
              <p>
                <strong>Diagnosis:</strong> {prescription.diagnosis}
              </p>
              <p>
                <strong>Advice:</strong> {prescription.advice || "No advice"}
              </p>
              <div className="medicine-section">
                <h4>Medicines:</h4>
                <ul>
                  {prescription.medicines.map((med, index) => (
                    <li key={index}>
                      {med.name} - {med.dosage}
                    </li>
                  ))}
                </ul>
              </div>
              <p>
                <strong>Date:</strong>{" "}
                {new Date(prescription.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ViewPrescriptions;
