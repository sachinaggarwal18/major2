import { FC, useState, ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/CreatePrescription.css";
import { prescriptionService } from "../services/api";
import { PrescriptionCreateRequest } from "../types/api";
import { Medication } from "../types/models";

const CreatePrescription: FC = () => {
  const [patientId, setPatientId] = useState<string>("");
  const [diagnosis, setDiagnosis] = useState<string>("");
  const [medications, setMedications] = useState<Medication[]>([
    { name: "", dosage: "", frequency: "", duration: "" }
  ]);
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  
  const navigate = useNavigate();

  const handleMedicationChange = (
    index: number, 
    e: ChangeEvent<HTMLInputElement>
  ): void => {
    const { name, value } = e.target;
    const updatedMeds = [...medications];
    updatedMeds[index] = { ...updatedMeds[index], [name]: value };
    setMedications(updatedMeds);
  };

  const addMedicationField = (): void => {
    setMedications([
      ...medications, 
      { name: "", dosage: "", frequency: "", duration: "" }
    ]);
  };

  const removeMedicationField = (index: number): void => {
    if (medications.length > 1) {
      const updatedMeds = medications.filter((_, i) => i !== index);
      setMedications(updatedMeds);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        alert("Authentication required. Please log in again.");
        navigate('/doctor/login');
        return;
      }

      const prescriptionData: PrescriptionCreateRequest = {
        patientId,
        diagnosis,
        medications,
        notes
      };

      await prescriptionService.createPrescription(
        prescriptionData, 
        token
      );
      
      alert("Prescription created successfully!");
      navigate('/view-prescriptions');
    } catch (error) {
      console.error("Error creating prescription:", error);
      alert("Failed to create prescription. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="prescription-form">
      <h2>Create Prescription</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Patient ID"
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          required
        />
        <textarea
          placeholder="Diagnosis"
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          required
        ></textarea>
        
        <h3>Medications</h3>
        {medications.map((med, index) => {
          // Create a unique identifier for each medication
          const medicationKey = `med-${med.name}-${med.dosage}-${index}`;
          
          return (
            <div key={medicationKey} className="medication-row">
              <input
                name="name"
                placeholder="Medicine Name"
                value={med.name}
                onChange={(e) => handleMedicationChange(index, e)}
                required
              />
              <input
                name="dosage"
                placeholder="Dosage (e.g., 10mg)"
                value={med.dosage}
                onChange={(e) => handleMedicationChange(index, e)}
                required
              />
              <input
                name="frequency"
                placeholder="Frequency (e.g., twice daily)"
                value={med.frequency}
                onChange={(e) => handleMedicationChange(index, e)}
                required
              />
              <input
                name="duration"
                placeholder="Duration (e.g., 7 days)"
                value={med.duration}
                onChange={(e) => handleMedicationChange(index, e)}
                required
              />
              {medications.length > 1 && (
                <button 
                  type="button" 
                  onClick={() => removeMedicationField(index)}
                  className="remove-btn"
                >
                  Remove
                </button>
              )}
            </div>
          );
        })}
        <button type="button" onClick={addMedicationField} className="add-btn">
          + Add Medication
        </button>
        
        <textarea
          placeholder="Additional Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        ></textarea>
        
        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Submit Prescription"}
        </button>
      </form>
    </div>
  );
};

export default CreatePrescription;