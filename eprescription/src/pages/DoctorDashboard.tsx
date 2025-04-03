import { FC, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Doctor } from "../types/models";
import { doctorService } from "../services/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AlertCircle,
  LogOut, 
  FilePlus, 
  FileText, 
  Users, 
  Calendar,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Stethoscope,
  Loader2,
  HelpCircle
} from "lucide-react";

const DoctorDashboard: FC = () => {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDoctorProfile = async (): Promise<void> => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token || localStorage.getItem('userType') !== 'doctor') {
          localStorage.removeItem('token');
          localStorage.removeItem('userType');
          navigate('/doctor/login');
          return;
        }

        const response = await doctorService.getProfile(token);
        setDoctor(response.doctor);
      } catch (error) {
        console.error('Error fetching doctor profile:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('userType');
        navigate('/doctor/login');
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorProfile();
  }, [navigate]);

  const handleLogout = (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading your profile...</p>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="container mx-auto p-4 md:p-8 flex justify-center items-center min-h-screen">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Could not load doctor profile. Please try logging in again.
          </AlertDescription>
          <Button 
            variant="destructive" 
            className="mt-4 w-full"
            onClick={() => navigate('/doctor/login')}
          >
            Return to Login
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      {/* Profile Overview */}
      <Card className="border-primary/20">
        <CardHeader className="space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold">Welcome, Dr. {doctor.name}!</CardTitle>
              <CardDescription>Manage your patients and prescriptions efficiently.</CardDescription>
            </div>
            <Badge variant="outline" className="font-normal">
              Doctor ID: {doctor.shortId}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Professional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-primary/10">
              <CardHeader>
                <CardTitle className="text-lg">Professional Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center text-sm">
                  <GraduationCap className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-muted-foreground">Specialization:</span>
                  <span className="ml-2">{doctor.specialization}</span>
                </div>
                {doctor.experience && (
                  <div className="flex items-center text-sm">
                    <Stethoscope className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-muted-foreground">Experience:</span>
                    <span className="ml-2">{doctor.experience} years</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-primary/10">
              <CardHeader>
                <CardTitle className="text-lg">Contact Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center text-sm">
                  <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{doctor.phoneNumber}</span>
                </div>
                {doctor.address && (
                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{doctor.address}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/create-prescription" className="group">
            <Card className="hover:shadow-md transition-all duration-200 hover:border-primary/30">
              <CardContent className="p-6 flex flex-col items-center justify-center space-y-2 text-center min-h-[140px]">
                <div className="p-3 rounded-full bg-primary/10 text-primary ring-2 ring-primary/20 group-hover:ring-primary/30 transition-all duration-200">
                  <FilePlus className="h-6 w-6" />
                </div>
                <span className="font-medium">Create Prescription</span>
                <p className="text-sm text-muted-foreground">Write new prescriptions</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/view-prescriptions" className="group">
            <Card className="hover:shadow-md transition-all duration-200 hover:border-primary/30">
              <CardContent className="p-6 flex flex-col items-center justify-center space-y-2 text-center min-h-[140px]">
                <div className="p-3 rounded-full bg-primary/10 text-primary ring-2 ring-primary/20 group-hover:ring-primary/30 transition-all duration-200">
                  <FileText className="h-6 w-6" />
                </div>
                <span className="font-medium">View Prescriptions</span>
                <p className="text-sm text-muted-foreground">Access prescription history</p>
              </CardContent>
            </Card>
          </Link>

          <Card className="hover:shadow-md transition-all duration-200 opacity-70">
            <CardContent className="p-6 flex flex-col items-center justify-center space-y-2 text-center min-h-[140px]">
              <div className="p-3 rounded-full bg-muted text-muted-foreground ring-2 ring-muted">
                <Users className="h-6 w-6" />
              </div>
              <span className="font-medium">Patient Records</span>
              <p className="text-sm text-muted-foreground">Coming soon</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-all duration-200 opacity-70">
            <CardContent className="p-6 flex flex-col items-center justify-center space-y-2 text-center min-h-[140px]">
              <div className="p-3 rounded-full bg-muted text-muted-foreground ring-2 ring-muted">
                <Calendar className="h-6 w-6" />
              </div>
              <span className="font-medium">Appointments</span>
              <p className="text-sm text-muted-foreground">Coming soon</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Tips */}
      <Card className="bg-muted/50">
        <CardHeader className="flex flex-row items-center space-x-2">
          <HelpCircle className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Quick Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="ml-6 space-y-2 text-sm text-muted-foreground list-disc">
            <li>Keep your patient records updated regularly.</li>
            <li>Use clear instructions while prescribing medicines.</li>
            <li>Review patient history before prescribing.</li>
          </ul>
        </CardContent>
      </Card>

      {/* Footer Actions */}
      <Card className="bg-muted/50 border-none">
        <CardContent className="flex justify-between items-center p-4">
          <Button variant="ghost" disabled className="text-muted-foreground">
            <Mail className="mr-2 h-4 w-4" />
            Support
          </Button>
          <Button variant="destructive" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorDashboard;
