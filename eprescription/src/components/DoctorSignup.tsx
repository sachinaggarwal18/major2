import { FC, useState, ChangeEvent, FormEvent } from "react";
import "../styles/Auth.css";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/api";
import { DoctorSignupRequest } from "../types/api";

const DoctorSignup: FC = () => {
  const [formData, setFormData] = useState<DoctorSignupRequest>({
    name: "",
    email: "",
    specialization: "",
    phoneNumber: "",
    password: "",
    licenseNumber: "",
    hospitalAffiliation: ""
  });

  const navigate = useNavigate();

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    try {
      const response = await authService.doctorSignup(formData);
      
      // Store the token in localStorage
      localStorage.setItem('token', response.token);
      localStorage.setItem('userType', 'doctor');
      
      alert("Doctor registered successfully!");
      navigate("/doctor-dashboard");
    } catch (error) {
      console.error("Signup failed:", error);
      alert("Signup failed. Please check your information and try again.");
    }
  };

  return (
    <div className="auth-container">
      <h2>Doctor Signup</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="specialization"
          placeholder="Specialization"
          value={formData.specialization}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="phoneNumber"
          placeholder="Phone Number"
          value={formData.phoneNumber}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="licenseNumber"
          placeholder="License Number"
          value={formData.licenseNumber}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="hospitalAffiliation"
          placeholder="Hospital Affiliation"
          value={formData.hospitalAffiliation}
          onChange={handleChange}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />
        <button type="submit">Signup</button>
      </form>
    </div>
  );
};

export default DoctorSignup;