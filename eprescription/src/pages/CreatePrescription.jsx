import React, { useState } from "react";
import axios from "axios";
import "../styles/CreatePrescription.css";

function CreatePrescription() {
  const [patientEmail, setPatientEmail] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [medicines, setMedicines] = useState([{ name: "", dosage: "" }]);
  const [advice, setAdvice] = useState("");

  const handleMedicineChange = (index, e) => {
    const updatedMeds = [...medicines];
    updatedMeds[index][e.target.name] = e.target.value;
    setMedicines(updatedMeds);
  };

  const addMedicineField = () =>
    setMedicines([...medicines, { name: "", dosage: "" }]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "http://localhost:8000/prescriptions/create",
        {
          patientEmail,
          diagnosis,
          medicines,
          advice,
        }
      );
      alert("Prescription created successfully");
      console.log(res.data);
    } catch (err) {
      console.error(err);
      alert("Error creating prescription");
    }
  };

  return (
    <div className="prescription-form">
      <h2>Create Prescription</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Patient Email"
          value={patientEmail}
          onChange={(e) => setPatientEmail(e.target.value)}
          required
        />
        <textarea
          placeholder="Diagnosis"
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          required
        ></textarea>

        {medicines.map((med, index) => (
          <div key={index}>
            <input
              name="name"
              placeholder="Medicine Name"
              value={med.name}
              onChange={(e) => handleMedicineChange(index, e)}
              required
            />
            <input
              name="dosage"
              placeholder="Dosage"
              value={med.dosage}
              onChange={(e) => handleMedicineChange(index, e)}
              required
            />
          </div>
        ))}
        <button type="button" onClick={addMedicineField}>
          + Add Medicine
        </button>

        <textarea
          placeholder="Additional Advice"
          value={advice}
          onChange={(e) => setAdvice(e.target.value)}
        ></textarea>

        <button type="submit">Submit Prescription</button>
      </form>
    </div>
  );
}

export default CreatePrescription;
