import { FC, useState, ChangeEvent, FormEvent } from "react";
import "../styles/Auth.css";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/api";
import { LoginRequest } from "../types/api";

const PatientLogin: FC = () => {
  const [formData, setFormData] = useState<LoginRequest>({
    email: "",
    password: "",
  });
  
  const navigate = useNavigate();
  
  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    try {
      const response = await authService.patientLogin(formData);
      
      // Store the token in localStorage
      localStorage.setItem('token', response.token);
      localStorage.setItem('userType', 'patient');
      
      alert("Patient logged in successfully!");
      navigate("/patient-dashboard");
    } catch (error) {
      console.error("Error:", error);
      alert(error instanceof Error ? error.message : "Login failed");
    }
  };
  
  return (
    <div className="auth-container">
      <h2>Patient Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default PatientLogin;