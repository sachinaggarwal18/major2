import { FC, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ViewPrescriptions.css";
import { prescriptionService } from "../services/api";
import { Prescription } from "../types/models";

const ViewPrescriptions: FC = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPrescriptions = async (): Promise<void> => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/');
          return;
        }

        const data = await prescriptionService.getAllPrescriptions(token);
        setPrescriptions(data);
      } catch (err) {
        console.error("Error fetching prescriptions:", err);
        setError("Failed to load prescriptions. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchPrescriptions();
  }, [navigate]);

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return <div className="loading">Loading prescriptions...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="view-prescription-container">
      <h2>My Prescriptions</h2>
      {prescriptions.length === 0 ? (
        <p>No prescriptions found.</p>
      ) : (
        <div className="prescription-list">
          {prescriptions.map((prescription) => (
            <div key={prescription._id} className="prescription-card">
              <div className="prescription-header">
                <h3>
                  Prescription ID: {prescription._id.substring(0, 8)}...
                </h3>
                <span className="date">{formatDate(prescription.createdAt)}</span>
              </div>
              
              <div className="prescription-details">
                <p>
                  <strong>Patient:</strong>{" "}
                  {typeof prescription.patientId === 'object' 
                    ? prescription.patientId.name 
                    : "Patient ID: " + prescription.patientId}
                </p>
                <p>
                  <strong>Doctor:</strong>{" "}
                  {typeof prescription.doctorId === 'object'
                    ? prescription.doctorId.name 
                    : "Doctor ID: " + prescription.doctorId}
                </p>
                <p>
                  <strong>Diagnosis:</strong> {prescription.diagnosis}
                </p>
                {prescription.notes && (
                  <p>
                    <strong>Notes:</strong> {prescription.notes}
                  </p>
                )}
              </div>

              <div className="medicine-section">
                <h4>Medications:</h4>
                <table className="medications-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Dosage</th>
                      <th>Frequency</th>
                      <th>Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prescription.medications.map((med, index) => (
                      <tr key={`${prescription._id}-med-${index}-${med.name}`}>
                        <td>{med.name}</td>
                        <td>{med.dosage}</td>
                        <td>{med.frequency}</td>
                        <td>{med.duration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ViewPrescriptions;