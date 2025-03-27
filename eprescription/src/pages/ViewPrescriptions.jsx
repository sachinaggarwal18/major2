import React, { useEffect, useState } from "react";
import axios from "axios";
import "./ViewPrescriptions.css";

const ViewPrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        const res = await axios.get("http://localhost:8000/prescriptions");
        setPrescriptions(res.data);
      } catch (error) {
        console.error("Error fetching prescriptions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrescriptions();
  }, []);

  // Filter prescriptions based on search query
  const filteredPrescriptions = prescriptions.filter((prescription) =>
    [
      prescription.patientEmail,
      prescription.diagnosis,
      ...prescription.medicines.map((med) => med.name),
    ].some((field) => field.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="view-prescription-container">
      <h2>All Prescriptions</h2>

      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search by patient email, diagnosis, or medicine..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="search-bar"
      />

      {loading ? (
        <p>Loading prescriptions...</p>
      ) : filteredPrescriptions.length === 0 ? (
        <p>No matching prescriptions found.</p>
      ) : (
        <div className="prescription-list">
          {filteredPrescriptions.map((prescription) => (
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
