import { FC } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Stethoscope, FileText, History } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Home: FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background/95">
      {/* Hero Section */}
      <section className="py-20 px-4 text-center relative overflow-hidden">
        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-primary">
            Welcome to E-Prescription Manager
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your health, our priority. Manage your prescriptions and health records
            effortlessly.
          </p>
          <div className="flex gap-4 justify-center mt-8">
            <Button onClick={() => navigate("/doctor/login")} size="lg">
              I'm a Doctor
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button onClick={() => navigate("/patient/login")} variant="outline" size="lg">
              I'm a Patient
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
        {/* Background pattern */}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="group hover:shadow-lg transition-all duration-200">
              <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                <div className="p-3 rounded-full bg-primary/10 text-primary ring-2 ring-primary/20 group-hover:ring-primary/30 transition-all duration-200">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold">Digital Prescriptions</h3>
                <p className="text-muted-foreground">
                  Get digital prescriptions from verified doctors instantly.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-200">
              <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                <div className="p-3 rounded-full bg-primary/10 text-primary ring-2 ring-primary/20 group-hover:ring-primary/30 transition-all duration-200">
                  <History className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold">Medical Records</h3>
                <p className="text-muted-foreground">
                  Store and access your medical history securely anytime.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-200">
              <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                <div className="p-3 rounded-full bg-primary/10 text-primary ring-2 ring-primary/20 group-hover:ring-primary/30 transition-all duration-200">
                  <Stethoscope className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold">Doctor Consultation</h3>
                <p className="text-muted-foreground">
                  Book appointments and consult doctors online from your home.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-200">
              <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                <div className="p-3 rounded-full bg-primary/10 text-primary ring-2 ring-primary/20 group-hover:ring-primary/30 transition-all duration-200">
                  <Shield className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold">Secure Platform</h3>
                <p className="text-muted-foreground">
                  Your data is protected with end-to-end encryption.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold tracking-tight text-primary">Why Choose Us?</h2>
          <p className="text-lg text-muted-foreground">
            Our E-Prescription Manager offers a seamless experience for both
            doctors and patients. Easy access, fast consultations, and secure data
            handling—all in one place.
          </p>
          <Button variant="outline" size="lg" onClick={() => navigate("/doctor/signup")}>
            Get Started Today
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Home;
