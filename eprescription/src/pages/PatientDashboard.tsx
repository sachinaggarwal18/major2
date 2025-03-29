import { FC, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Patient } from "../types/models";
import { patientService } from "../services/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AlertCircle,
  LogOut, 
  FileText, 
  Calendar, 
  BookHeart, 
  Mail, 
  Phone, 
  MapPin, 
  Clock,
  Loader2
} from "lucide-react";

interface PatientResponse {
  patient: Patient;
}

const PatientDashboard: FC = () => {
  const [data, setData] = useState<PatientResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPatientProfile = async (): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token || localStorage.getItem('userType') !== 'patient') {
          throw new Error('Authentication required');
        }

        const response = await patientService.getProfile(token);
        console.log('API Response:', response);
        
        if (!response?.patient?.id) {
          throw new Error('Invalid patient data received');
        }

        setData(response);
      } catch (error) {
        console.error('Error fetching patient profile:', error);
        setError(error instanceof Error ? error.message : 'Failed to load profile');
        localStorage.removeItem('token');
        localStorage.removeItem('userType');
      } finally {
        setLoading(false);
      }
    };

    fetchPatientProfile();
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

  if (error || !data?.patient) {
    return (
      <div className="container mx-auto p-4 md:p-8 flex justify-center items-center min-h-screen">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error ?? 'Could not load patient profile. Please try logging in again.'}
          </AlertDescription>
          <Button 
            variant="destructive" 
            className="mt-4 w-full"
            onClick={() => navigate('/patient/login')}
          >
            Return to Login
          </Button>
        </Alert>
      </div>
    );
  }

  const { patient } = data;

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      {/* Profile Overview */}
      <Card className="border-primary/20">
        <CardHeader className="space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold">Welcome, {patient.name}!</CardTitle>
              <CardDescription>Your health information and prescriptions in one place.</CardDescription>
            </div>
            <Badge variant="outline" className="font-normal">
              ID: {patient.id.substring(0, 8)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-primary/10">
              <CardHeader>
                <CardTitle className="text-lg">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center text-sm">
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-muted-foreground">Age:</span>
                  <span className="ml-2">{patient.age} years</span>
                </div>
                <div className="flex items-center text-sm">
                  <Badge variant="secondary" className="font-normal">
                    {patient.gender}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/10">
              <CardHeader>
                <CardTitle className="text-lg">Contact Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center text-sm">
                  <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{patient.phoneNumber}</span>
                </div>
                <div className="flex items-center text-sm">
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{patient.address}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Medical History if available */}
          {patient.medicalHistory && (
            <Card className="border-primary/10">
              <CardHeader>
                <CardTitle className="text-lg">Medical History</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{patient.medicalHistory}</p>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link to="/view-prescriptions" className="group">
            <Card className="hover:shadow-md transition-all duration-200 hover:border-primary/30">
              <CardContent className="p-6 flex flex-col items-center justify-center space-y-2 text-center min-h-[140px]">
                <div className="p-3 rounded-full bg-primary/10 text-primary ring-2 ring-primary/20 group-hover:ring-primary/30 transition-all duration-200">
                  <FileText className="h-6 w-6" />
                </div>
                <span className="font-medium">My Prescriptions</span>
                <p className="text-sm text-muted-foreground">View your prescriptions history</p>
              </CardContent>
            </Card>
          </Link>

          <Card className="hover:shadow-md transition-all duration-200 opacity-70">
            <CardContent className="p-6 flex flex-col items-center justify-center space-y-2 text-center min-h-[140px]">
              <div className="p-3 rounded-full bg-muted text-muted-foreground ring-2 ring-muted">
                <Calendar className="h-6 w-6" />
              </div>
              <span className="font-medium">Book Appointment</span>
              <p className="text-sm text-muted-foreground">Coming soon</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-all duration-200 opacity-70">
            <CardContent className="p-6 flex flex-col items-center justify-center space-y-2 text-center min-h-[140px]">
              <div className="p-3 rounded-full bg-muted text-muted-foreground ring-2 ring-muted">
                <BookHeart className="h-6 w-6" />
              </div>
              <span className="font-medium">Medical History</span>
              <p className="text-sm text-muted-foreground">Coming soon</p>
            </CardContent>
          </Card>
        </div>
      </div>

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

export default PatientDashboard;
