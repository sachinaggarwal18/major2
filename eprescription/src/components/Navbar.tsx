import { FC } from "react";
import { Link } from "react-router-dom";
import "../styles/Navbar.css";

const Navbar: FC = () => {
  return (
    <nav className="navbar">
      <div className="nav-title">E-Prescription Manager</div>
      <div className="nav-links">
        <Link to="/">Home</Link>
        <div className="dropdown">
          <button className="dropbtn">Doctor</button>
          <div className="dropdown-content">
            <Link to="/doctor/login">Login</Link>
            <Link to="/doctor/signup">Signup</Link>
          </div>
        </div>
        <div className="dropdown">
          <button className="dropbtn">Patient</button>
          <div className="dropdown-content">
            <Link to="/patient/login">Login</Link>
            <Link to="/patient/signup">Signup</Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;