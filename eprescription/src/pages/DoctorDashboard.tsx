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
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-10"> {/* Increased default spacing */}
      {/* Profile Overview */}
      <Card className="border-primary/20 shadow-sm"> {/* Added subtle shadow */}
        <CardHeader className="pb-4"> {/* Reduced bottom padding */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="space-y-1.5"> {/* Reduced space */}
              <CardTitle className="text-2xl lg:text-3xl font-bold tracking-tight">Welcome, Dr. {doctor.name}!</CardTitle>
              <CardDescription>Manage your patients and prescriptions efficiently.</CardDescription>
            </div>
            <Badge variant="secondary" className="font-mono text-sm py-1 px-3"> {/* Changed variant and style */}
              ID: {doctor.shortId}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-6"> {/* Added top padding */}
          {/* Professional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> {/* Reduced gap */}
            <Card className="border-border/30 shadow-xs"> {/* Adjusted border/shadow */}
              <CardHeader className="py-3 px-4 border-b"> {/* Compact header */}
                <CardTitle className="text-base font-semibold">Professional Details</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3"> {/* Adjusted padding/spacing */}
                <div className="flex items-center text-sm space-x-2">
                  <GraduationCap className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">Specialization:</span>
                  <span>{doctor.specialization}</span>
                </div>
                {/* Removed experience field as it's not in the schema */}
                {/* {doctor.experience && ( ... )} */}
                {doctor.licenseNumber && (
                   <div className="flex items-center text-sm space-x-2">
                    <Stethoscope className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground">License:</span>
                    <span className="font-mono text-xs">{doctor.licenseNumber}</span>
                  </div>
                )}
                 {doctor.hospitalAffiliation && (
                   <div className="flex items-center text-sm space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground">Affiliation:</span>
                    <span>{doctor.hospitalAffiliation}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/30 shadow-xs"> {/* Adjusted border/shadow */}
              <CardHeader className="py-3 px-4 border-b"> {/* Compact header */}
                <CardTitle className="text-base font-semibold">Contact Details</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3"> {/* Adjusted padding/spacing */}
                <div className="flex items-start text-sm space-x-2"> {/* Use items-start */}
                  <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span>{doctor.phoneNumber}</span>
                </div>
                 <div className="flex items-start text-sm space-x-2"> {/* Use items-start */}
                  <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span>{doctor.email}</span>
                </div>
                {/* Address is not in Doctor schema, removed */}
                {/* {doctor.address && ( ... )} */}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="space-y-3"> {/* Reduced space */}
        <h2 className="text-xl font-semibold tracking-tight">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"> {/* Adjusted grid columns */}
          <Link to="/create-prescription" className="group">
            <Card className="hover:shadow-lg transition-shadow duration-200 hover:border-primary/40 border-border/30"> {/* Enhanced hover */}
              <CardContent className="p-5 flex flex-col items-center justify-center space-y-2 text-center min-h-[150px]"> {/* Adjusted padding/height */}
                <div className="p-3 rounded-full bg-primary/10 text-primary ring-1 ring-primary/20 group-hover:ring-primary/40 transition-all duration-200">
                  <FilePlus className="h-5 w-5" /> {/* Slightly smaller icon */}
                </div>
                <span className="font-semibold text-base">Create Prescription</span> {/* Bolder text */}
                <p className="text-xs text-muted-foreground">Write a new e-prescription</p> {/* Smaller description */}
              </CardContent>
            </Card>
          </Link>

          <Link to="/view-prescriptions" className="group">
            <Card className="hover:shadow-lg transition-shadow duration-200 hover:border-primary/40 border-border/30"> {/* Enhanced hover */}
              <CardContent className="p-5 flex flex-col items-center justify-center space-y-2 text-center min-h-[150px]"> {/* Adjusted padding/height */}
                <div className="p-3 rounded-full bg-primary/10 text-primary ring-1 ring-primary/20 group-hover:ring-primary/40 transition-all duration-200">
                  <FileText className="h-5 w-5" /> {/* Slightly smaller icon */}
                </div>
                <span className="font-semibold text-base">View Prescriptions</span> {/* Bolder text */}
                <p className="text-xs text-muted-foreground">Access created prescriptions</p> {/* Smaller description */}
              </CardContent>
            </Card>
          </Link>

          {/* Disabled Cards - Adjusted styling */}
          <Card className="border-border/30 bg-muted/50 opacity-80 cursor-not-allowed">
            <CardContent className="p-5 flex flex-col items-center justify-center space-y-2 text-center min-h-[150px]">
              <div className="p-3 rounded-full bg-muted text-muted-foreground ring-1 ring-border">
                <Users className="h-5 w-5" />
              </div>
              <span className="font-semibold text-base text-muted-foreground">Patient Records</span>
              <p className="text-xs text-muted-foreground">Feature coming soon</p>
            </CardContent>
          </Card>

          <Card className="border-border/30 bg-muted/50 opacity-80 cursor-not-allowed">
            <CardContent className="p-5 flex flex-col items-center justify-center space-y-2 text-center min-h-[150px]">
              <div className="p-3 rounded-full bg-muted text-muted-foreground ring-1 ring-border">
                <Calendar className="h-5 w-5" />
              </div>
              <span className="font-semibold text-base text-muted-foreground">Appointments</span>
              <p className="text-xs text-muted-foreground">Feature coming soon</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Tips */}
      <Card className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 shadow-sm"> {/* Themed card */}
        <CardHeader className="flex flex-row items-center space-x-2 pb-3 pt-4 px-5"> {/* Adjusted padding */}
          <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <CardTitle className="text-lg text-blue-800 dark:text-blue-200">Quick Tips</CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-4">
          <ul className="ml-6 space-y-1.5 text-sm text-blue-700 dark:text-blue-300 list-disc"> {/* Adjusted spacing */}
            <li>Use the search function to quickly find patients by ID or name.</li>
            <li>Ensure medication dosages and frequencies are clearly specified.</li>
            <li>Review patient history and allergies before finalizing prescriptions.</li>
          </ul>
        </CardContent>
      </Card>

      {/* Footer Actions */}
      <Card className="bg-background border-t mt-12"> {/* Use background, add top margin */}
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
