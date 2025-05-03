import { FC, useEffect, useState, ChangeEvent, FormEvent } from "react"; // Added ChangeEvent, FormEvent
import { Link, useNavigate } from "react-router-dom";
import { Patient } from "../types/models";
import { patientService } from "../services/api"; 
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"; // Added CardFooter
import { Input } from "@/components/ui/input"; // Added Input
import { Label } from "@/components/ui/label"; // Added Label
import { Textarea } from "@/components/ui/textarea"; // Added Textarea
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"; // Added Table components
import { 
  AlertCircle,
  LogOut,
  UploadCloud, // Added UploadCloud
  Trash2, // Added Trash2
  FileText, 
  Calendar, 
  BookHeart, 
  Mail, 
  Phone, 
  MapPin, 
  Clock,
  Loader2
} from "lucide-react";

// Define UploadedPrescription type (matching the one in api.ts)
interface UploadedPrescription {
  id: string;
  patientId: string;
  filename: string;
  storagePath: string; 
  fileType: string;
  uploadDate: string; 
  notes: string | null;
}

interface PatientResponse {
  patient: Patient;
}

const PatientDashboard: FC = () => {
  const [data, setData] = useState<PatientResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // For initial profile load
  const [error, setError] = useState<string | null>(null); // For profile load error
  const navigate = useNavigate();

  // State for uploaded prescriptions
  const [uploadedPrescriptions, setUploadedPrescriptions] = useState<UploadedPrescription[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadNotes, setUploadNotes] = useState<string>("");
  const [listLoading, setListLoading] = useState<boolean>(false); // For loading the list
  const [listError, setListError] = useState<string | null>(null); // For list loading error
  const [deletingId, setDeletingId] = useState<string | null>(null); // Track which item is being deleted

  // Function to fetch uploaded prescriptions
  const fetchUploadedPrescriptions = async (token: string): Promise<void> => {
    setListLoading(true);
    setListError(null);
    try {
      const response = await patientService.getUploadedPrescriptions(token);
      setUploadedPrescriptions(response.prescriptions || []);
    } catch (err) {
      console.error('Error fetching uploaded prescriptions:', err);
      setListError(err instanceof Error ? err.message : 'Failed to load uploaded prescriptions');
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    const fetchPatientData = async (): Promise<void> => {
      setLoading(true); // Start initial loading
      setError(null);
      setListError(null); // Clear list error too
      try {
        const token = localStorage.getItem('token');
        if (!token || localStorage.getItem('userType') !== 'patient') {
          throw new Error('Authentication required');
        }

        // Fetch profile and uploaded prescriptions concurrently
        const [profileResponse] = await Promise.all([
          patientService.getProfile(token),
          fetchUploadedPrescriptions(token) // Fetch the list
        ]);
        
        console.log('API Response (Profile):', profileResponse);
        
        if (!profileResponse?.patient?.id) {
          throw new Error('Invalid patient data received');
        }

        setData(profileResponse);
      } catch (error) { // Catch errors from either profile fetch or initial list fetch
        console.error('Error fetching patient data:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load patient data';
        setError(errorMessage); // Set general error for profile load failure
        if (errorMessage === 'Authentication required' || errorMessage.includes('token')) {
          localStorage.removeItem('token');
          localStorage.removeItem('userType');
          // No need to navigate here, the error display handles the login button
        }
      } finally {
        setLoading(false); // Finish initial loading
      }
    };

    fetchPatientData();
  }, [navigate]);

  const handleLogout = (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    navigate('/');
  };

  // Handler for file input change
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setUploadError(null); // Clear previous error on new file selection
      setUploadSuccess(null);
    }
  };

  // Handler for notes textarea change
  const handleNotesChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setUploadNotes(event.target.value);
  };

  // Handler for submitting the upload form
  const handleUploadSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) {
      setUploadError("Please select a file to upload.");
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError("Authentication required. Please log in again.");
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    const formData = new FormData();
    formData.append('prescriptionFile', selectedFile);
    if (uploadNotes) {
      formData.append('notes', uploadNotes);
    }

    try {
      const response = await patientService.uploadPrescription(formData, token);
      setUploadSuccess(response.message || "File uploaded successfully!");
      setSelectedFile(null); // Clear file input
      setUploadNotes(""); // Clear notes
      // Refresh the list of uploaded prescriptions
      fetchUploadedPrescriptions(token); 
    } catch (err) {
      console.error('Error uploading file:', err);
      const apiError = err as { message?: string };
      setUploadError(apiError?.message || 'Failed to upload file.');
    } finally {
      setUploading(false);
    }
  };

  // Handler for deleting an uploaded prescription
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this uploaded prescription?")) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError("Authentication required. Please log in again.");
      return;
    }

    setDeletingId(id); // Indicate which item is being deleted
    setListError(null); // Clear previous list errors

    try {
      await patientService.deleteUploadedPrescription(id, token);
      // Remove the deleted item from the state
      setUploadedPrescriptions(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Error deleting prescription:', err);
      const apiError = err as { message?: string };
      setListError(apiError?.message || 'Failed to delete prescription.');
    } finally {
      setDeletingId(null); // Clear deleting indicator
    }
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
              Patient ID: {patient.shortId}
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

      {/* Upload Prescription Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Prescription</CardTitle>
          <CardDescription>
            Upload existing prescription files (PDF, JPG, PNG - max 5MB).
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleUploadSubmit}>
          <CardContent className="space-y-4">
            {uploadError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Upload Failed</AlertTitle>
                <AlertDescription>{uploadError}</AlertDescription>
              </Alert>
            )}
            {uploadSuccess && (
              <Alert className="bg-green-50 text-green-700 border-green-200">
                <AlertCircle className="h-4 w-4" /> {/* Use AlertCircle or Check icon */}
                <AlertTitle>Upload Successful</AlertTitle>
                <AlertDescription>{uploadSuccess}</AlertDescription>
              </Alert>
            )}
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="prescriptionFile">Prescription File</Label>
              <Input 
                id="prescriptionFile" 
                type="file" 
                onChange={handleFileChange} 
                accept=".pdf,.jpg,.jpeg,.png" 
                required 
              />
              {selectedFile && <p className="text-sm text-muted-foreground mt-1">Selected: {selectedFile.name}</p>}
            </div>
            <div className="grid w-full gap-1.5">
              <Label htmlFor="uploadNotes">Notes (Optional)</Label>
              <Textarea 
                placeholder="Add any notes about this prescription..." 
                id="uploadNotes" 
                value={uploadNotes}
                onChange={handleNotesChange}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={uploading || !selectedFile}>
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Upload File
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* My Uploaded Prescriptions Section */}
      <Card>
        <CardHeader>
          <CardTitle>My Uploaded Prescriptions</CardTitle>
          <CardDescription>View and manage your uploaded files.</CardDescription>
        </CardHeader>
        <CardContent>
          {listLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading uploads...</span>
            </div>
          )}
          {listError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Loading List</AlertTitle>
              <AlertDescription>{listError}</AlertDescription>
            </Alert>
          )}
          {!listLoading && !listError && uploadedPrescriptions.length === 0 && (
            <p className="text-center text-muted-foreground py-4">No prescriptions uploaded yet.</p>
          )}
          {!listLoading && !listError && uploadedPrescriptions.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Filename</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Uploaded On</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uploadedPrescriptions.map((prescription) => (
                  <TableRow key={prescription.id}>
                    <TableCell className="font-medium">{prescription.filename}</TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {prescription.notes || '-'}
                    </TableCell>
                    <TableCell>{new Date(prescription.uploadDate).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(prescription.id)}
                        disabled={deletingId === prescription.id}
                      >
                        {deletingId === prescription.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        <span className="sr-only">Delete</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
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

export default PatientDashboard;
