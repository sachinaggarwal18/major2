import "../styles/Home.css";

function Home() {
  return (
    <div className="home">
      <h1>Welcome to E-Prescription Manager</h1>
      <p>
        Your health, our priority. Manage your prescriptions and health records
        effortlessly.
      </p>

      <div className="features-section">
        <div className="feature-card">
          <img
            src="https://media.istockphoto.com/id/1223139796/vector/health-medical-document-check-up-list-online-on-laptop-computer-or-pc-internet-digital-paper.jpg?s=612x612&w=0&k=20&c=zr6Pi866tmme9kWZZ9x0MAPkME0RUONwDeWc9VsIDj0="
            alt="Digital Prescription"
          />
          <h3>💊 Digital Prescriptions</h3>
          <p>Get digital prescriptions from verified doctors instantly.</p>
        </div>

        <div className="feature-card">
          <img
            src="https://img.freepik.com/premium-vector/concept-electronic-health-records-online-medical-services-doctor-hospital-reading-emr_675567-893.jpg?semt=ais_hybrid"
            alt="Medical Records"
          />
          <h3>📋 Medical Records</h3>
          <p>Store and access your medical history securely anytime.</p>
        </div>

        <div className="feature-card">
          <img
            src="https://t3.ftcdn.net/jpg/01/17/34/04/360_F_117340441_iQ20JYUt4Gwz7mYbDMtM0yEe0bm4l41K.jpg"
            alt="Doctor Consultation"
          />
          <h3>👨‍⚕️ Doctor Consultation</h3>
          <p>Book appointments and consult doctors online from your home.</p>
        </div>

        <div className="feature-card">
          <img
            src="https://img.freepik.com/premium-vector/secure-platform-with-api-downtime-protection-illustration-shield-lock-as-concept-security-saas_135869-61.jpg?semt=ais_hybrid"
            alt="Secure Platform"
          />
          <h3>🔒 Secure Platform</h3>
          <p>Your data is protected with end-to-end encryption.</p>
        </div>
      </div>

      <section className="about-section">
        <h2>Why Choose Us?</h2>
        <p>
          Our E-Prescription Manager offers a seamless experience for both
          doctors and patients. Easy access, fast consultations, and secure data
          handling—all in one place.
        </p>
      </section>
    </div>
  );
}

export default Home;
