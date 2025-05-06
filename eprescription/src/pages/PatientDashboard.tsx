import { FC, useEffect, useState, ChangeEvent, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Patient, Prescription } from "../types/models"; // Removed Medication import
import { patientService, prescriptionService, adherenceService, AdherenceLog } from "../services/api"; // Added adherenceService, AdherenceLog
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
  Loader2,
  Pill,
  CheckCircle // Added CheckCircle icon
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

// Define props interface for MedicationList outside the main component
interface MedicationListProps {
  prescription: Prescription;
  loggingMedicationId: string | null;
  handleLogDose: (prescriptionId: string, medicationId: string) => void;
}

// Define MedicationList component outside the main component
const MedicationList: FC<MedicationListProps> = ({
  prescription,
  loggingMedicationId,
  handleLogDose,
}) => {
  if (!prescription.medications || prescription.medications.length === 0) {
    return <p className="text-sm text-muted-foreground">No medications listed for this prescription.</p>;
  }

  return (
    <ul className="space-y-2">
      {prescription.medications.map((med) => {
        // Extracted icon logic for the button
        const logButtonIcon = loggingMedicationId === med.id ? (
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
        ) : (
          <CheckCircle className="mr-1 h-3 w-3 text-green-600" />
        );

        return (
          <li key={med.id} className="flex items-start justify-between gap-4 p-2 border rounded bg-background">
            <div className="flex items-center gap-2">
              <Pill className="h-4 w-4 text-primary flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">{med.name}</p>
                <p className="text-xs text-muted-foreground">
                  {med.dosage} - {med.frequency.replace(/_/g, ' ')} - {med.duration}
                </p>
              </div>
            </div>
            {/* Adherence Log Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleLogDose(prescription.id, med.id)}
              disabled={loggingMedicationId === med.id}
              className="text-xs"
            >
              {logButtonIcon} {/* Use the extracted variable */}
              Log Dose
            </Button>
          </li>
        );
      })}
    </ul>
  );
};

// Define props interface for LogSuccessAlert outside the main component
interface LogSuccessAlertProps {
  message: string | null;
  prescription: Prescription;
}

// Define LogSuccessAlert component outside the main component
const LogSuccessAlert: FC<LogSuccessAlertProps> = ({ message, prescription }) => {
  if (!message || !prescription.medications?.some(m => message.includes(m.name))) {
    return null;
  }
  return (
    <Alert variant="default" className="mt-3 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700 text-green-800 dark:text-green-200 text-xs p-2">
      <CheckCircle className="h-4 w-4" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
};

// Define props interface for LogErrorAlert outside the main component
interface LogErrorAlertProps {
  error: string | null;
  prescription: Prescription;
  loggingMedicationId: string | null;
}

// Define LogErrorAlert component outside the main component
const LogErrorAlert: FC<LogErrorAlertProps> = ({ error, prescription, loggingMedicationId }) => {
  if (!error || !prescription.medications?.some(m => m.id === loggingMedicationId)) {
    return null;
  }
  return (
    <Alert variant="destructive" className="mt-3 text-xs p-2">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );
};

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
  const [deletingId, setDeletingId] = useState<string | null>(null); // Track which uploaded item is being deleted

  // State for digital prescriptions
  const [digitalPrescriptions, setDigitalPrescriptions] = useState<Prescription[]>([]);
  const [digitalLoading, setDigitalLoading] = useState<boolean>(false);
  const [digitalError, setDigitalError] = useState<string | null>(null);

  // State for adherence logging
  const [loggingMedicationId, setLoggingMedicationId] = useState<string | null>(null);
  const [logError, setLogError] = useState<string | null>(null);
  const [logSuccessMessage, setLogSuccessMessage] = useState<string | null>(null);

  // State for adherence history
  const [adherenceLogs, setAdherenceLogs] = useState<AdherenceLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyPagination, setHistoryPagination] = useState({
    total: 0,
    page: 1,
    limit: 10, // Show 10 logs per page initially
    totalPages: 1,
  });

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

  // Function to fetch adherence history
  const fetchAdherenceHistory = async (token: string, page = 1, limit = 10): Promise<void> => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const response = await adherenceService.getAdherenceHistory({ page, limit }, token);
      setAdherenceLogs(response.logs || []);
      setHistoryPagination(response.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 });
    } catch (err) {
      console.error('Error fetching adherence history:', err);
      setHistoryError(err instanceof Error ? err.message : 'Failed to load adherence history');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Function to fetch digital prescriptions
  const fetchDigitalPrescriptions = async (token: string): Promise<void> => {
    setDigitalLoading(true);
    setDigitalError(null);
    try {
      // prescriptionService.getAllPrescriptions fetches prescriptions for the logged-in patient (based on token)
      const response = await prescriptionService.getAllPrescriptions(token); 
      // Ensure response is an array, default to empty array if not
      setDigitalPrescriptions(Array.isArray(response) ? response : []); 
    } catch (err) {
      console.error('Error fetching digital prescriptions:', err);
      setDigitalError(err instanceof Error ? err.message : 'Failed to load digital prescriptions');
    } finally {
      setDigitalLoading(false);
    }
  };

  useEffect(() => {
    const fetchPatientData = async (): Promise<void> => {
      setLoading(true); // Start initial loading
      setError(null);
      setListError(null); // Clear list error too
      setDigitalError(null); // Clear digital prescription error
      setHistoryError(null); // Clear history error
      try {
        const token = localStorage.getItem('token');
        if (!token || localStorage.getItem('userType') !== 'patient') {
          throw new Error('Authentication required');
        }

        // Fetch profile, uploaded prescriptions, digital prescriptions, and history concurrently
        const [profileResponse] = await Promise.all([
          patientService.getProfile(token),
          fetchUploadedPrescriptions(token), // Fetch the uploaded list
          fetchDigitalPrescriptions(token), // Fetch digital prescriptions
          fetchAdherenceHistory(token, historyPagination.page, historyPagination.limit) // Fetch initial history
        ]);
        
        console.log('API Response (Profile):', profileResponse);

        if (!profileResponse?.patient?.id) {
          throw new Error('Invalid patient data received');
        }

        setData(profileResponse);
      } catch (error) { // Catch errors from any of the fetches
        console.error('Error fetching patient data:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load patient data';
        setError(errorMessage); // Set general error for profile load failure
        if (errorMessage === 'Authentication required' || errorMessage.includes('token')) {
          localStorage.removeItem('token');
          localStorage.removeItem('userType');
          // No need to navigate here, the error display handles the login button
        }
      } finally {
        setLoading(false); // Finish initial loading (covers profile, uploaded, and digital)
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
    if (event.target.files?.[0]) {
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
      setUploadError(apiError?.message ?? 'Failed to upload file.');
    } finally {
      setUploading(false);
    }
  };

  // Handler for logging a dose
  const handleLogDose = async (prescriptionId: string, medicationId: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError("Authentication required. Please log in again.");
      return;
    }

    setLoggingMedicationId(medicationId); // Indicate loading state for this specific button
    setLogError(null);
    setLogSuccessMessage(null);

    try {
      const response = await adherenceService.logAdherence({ prescriptionId, medicationId }, token);
      setLogSuccessMessage(`Logged dose for ${response.logEntry.medication?.name ?? 'medication'} successfully!`);
      
      // Refresh adherence history after logging
      fetchAdherenceHistory(token, 1, historyPagination.limit); // Go back to page 1 to see the latest entry
      
      // Clear success message after a few seconds
      setTimeout(() => setLogSuccessMessage(null), 3000);

    } catch (err) {
      console.error('Error logging dose:', err);
      const apiError = err as { message?: string; errors?: { msg: string }[] };
      const errorMsg = apiError.errors?.[0]?.msg ?? apiError.message ?? 'Failed to log dose.';
      setLogError(errorMsg);
      // Clear error message after a few seconds
      setTimeout(() => setLogError(null), 5000);
    } finally {
      setLoggingMedicationId(null); // Clear loading state for this button
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
      setListError(apiError?.message ?? 'Failed to delete prescription.');
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

  // Helper function for date formatting
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  // Helper function for date and time formatting
  const formatDateTime = (dateString: string | Date) => {
    return new Date(dateString).toLocaleString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Handler for changing history page
  const handleHistoryPageChange = (newPage: number) => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchAdherenceHistory(token, newPage, historyPagination.limit);
    }
  };

  // Helper function to render digital prescriptions section
  const renderDigitalPrescriptions = () => {
    if (digitalLoading) {
      return (
        <div className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading prescriptions...</span>
        </div>
      );
    }
  
    if (digitalError) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Prescriptions</AlertTitle>
          <AlertDescription>{digitalError}</AlertDescription>
        </Alert>
      );
    }
  
    if (digitalPrescriptions.length === 0) {
      return (
        <p className="text-center text-muted-foreground p-6">No digital prescriptions found.</p>
      );
    }
  
    return (
      <div className="space-y-6">
        {digitalPrescriptions.map((prescription) => (
          <Card key={prescription.id} className="border-border/50">
            <CardHeader className="bg-muted/30 p-4 border-b">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg">Diagnosis: {prescription.diagnosis}</CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Prescribed by Dr. {prescription.doctor?.name ?? 'N/A'} on {formatDate(prescription.date)}
                  </CardDescription>
                </div>
                {/* Placeholder for future actions like PDF download */}
                {/* <Button variant="outline" size="sm">View Details</Button> */}
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <h4 className="text-sm font-semibold mb-2">Medications:</h4>
              {/* Use the extracted MedicationList component */}
              <MedicationList 
                prescription={prescription} 
                loggingMedicationId={loggingMedicationId} 
                handleLogDose={handleLogDose} 
              />
              
              {/* Use the extracted Alert components */}
              <LogSuccessAlert message={logSuccessMessage} prescription={prescription} />
              <LogErrorAlert error={logError} prescription={prescription} loggingMedicationId={loggingMedicationId} />

              {prescription.notes && (
                <div className="pt-2 border-t mt-3">
                  <h4 className="text-sm font-semibold mb-1">Doctor's Notes:</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{prescription.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // Helper function to render adherence history content
  const renderAdherenceHistoryContent = () => {
    if (historyLoading) {
      return (
        <div className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading history...</span>
        </div>
      );
    }
  
    if (historyError) {
      return (
        <div className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading History</AlertTitle>
            <AlertDescription>{historyError}</AlertDescription>
          </Alert>
        </div>
      );
    }
  
    if (adherenceLogs.length === 0) {
      return (
        <p className="text-center text-muted-foreground p-6">No medication logs found yet.</p>
      );
    }
  
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Medication</TableHead>
            <TableHead className="hidden sm:table-cell">Dosage</TableHead>
            <TableHead className="text-right">Logged At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {adherenceLogs.map((log) => (
            <TableRow key={log.id} className="hover:bg-muted/50 text-sm">
              <TableCell className="font-medium">{log.medication?.name ?? 'N/A'}</TableCell>
              <TableCell className="hidden sm:table-cell text-muted-foreground text-xs">
                {log.medication?.dosage ?? 'N/A'}
              </TableCell>
              <TableCell className="text-right text-xs">{formatDateTime(log.takenAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-10"> {/* Increased default spacing */}
      {/* Profile Overview */}
      <Card className="border-primary/20 shadow-sm"> {/* Added subtle shadow */}
        <CardHeader className="pb-4"> {/* Reduced bottom padding */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="space-y-1.5"> {/* Reduced space */}
              <CardTitle className="text-2xl lg:text-3xl font-bold tracking-tight">Welcome, {patient.name}!</CardTitle>
              <CardDescription>Your health dashboard and uploaded prescriptions.</CardDescription>
            </div>
            <Badge variant="secondary" className="font-mono text-sm py-1 px-3"> {/* Changed variant and style */}
              ID: {patient.shortId}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-6"> {/* Added top padding */}
          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> {/* Reduced gap */}
            <Card className="border-border/30 shadow-xs"> {/* Adjusted border/shadow */}
              <CardHeader className="py-3 px-4 border-b"> {/* Compact header */}
                <CardTitle className="text-base font-semibold">Personal Info</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3"> {/* Adjusted padding/spacing */}
                <div className="flex items-center text-sm space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">Age:</span>
                  <span>{patient.age} years</span>
                </div>
                <div className="flex items-center text-sm space-x-2">
                   <Badge variant="outline" className="font-normal text-xs py-0.5 px-1.5"> {/* Smaller badge */}
                    {patient.gender}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/30 shadow-xs"> {/* Adjusted border/shadow */}
              <CardHeader className="py-3 px-4 border-b"> {/* Compact header */}
                <CardTitle className="text-base font-semibold">Contact Details</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3"> {/* Adjusted padding/spacing */}
                <div className="flex items-start text-sm space-x-2"> {/* Use items-start for long addresses */}
                  <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span>{patient.phoneNumber}</span>
                </div>
                <div className="flex items-start text-sm space-x-2"> {/* Use items-start */}
                  <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span>{patient.address}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Medical History if available */}
          {patient.medicalHistory && (
            <Card className="border-border/30 shadow-xs"> {/* Adjusted border/shadow */}
              <CardHeader className="py-3 px-4 border-b"> {/* Compact header */}
                <CardTitle className="text-base font-semibold">Medical History</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{patient.medicalHistory}</p> {/* Preserve whitespace */}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="space-y-3"> {/* Reduced space */}
        <h2 className="text-xl font-semibold tracking-tight">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link to="/view-prescriptions" className="group">
            <Card className="hover:shadow-lg transition-shadow duration-200 hover:border-primary/40 border-border/30"> {/* Enhanced hover */}
              <CardContent className="p-5 flex flex-col items-center justify-center space-y-2 text-center min-h-[150px]"> {/* Adjusted padding/height */}
                <div className="p-3 rounded-full bg-primary/10 text-primary ring-1 ring-primary/20 group-hover:ring-primary/40 transition-all duration-200">
                  <FileText className="h-5 w-5" /> {/* Slightly smaller icon */}
                </div>
                <span className="font-semibold text-base">My Prescriptions</span> {/* Bolder text */}
                <p className="text-xs text-muted-foreground">View digitally created prescriptions</p> {/* Smaller description */}
              </CardContent>
            </Card>
          </Link>

          {/* Disabled Cards - Adjusted styling */}
          <Card className="border-border/30 bg-muted/50 opacity-80 cursor-not-allowed">
            <CardContent className="p-5 flex flex-col items-center justify-center space-y-2 text-center min-h-[150px]">
              <div className="p-3 rounded-full bg-muted text-muted-foreground ring-1 ring-border">
                <Calendar className="h-5 w-5" />
              </div>
              <span className="font-semibold text-base text-muted-foreground">Book Appointment</span>
              <p className="text-xs text-muted-foreground">Feature coming soon</p>
            </CardContent>
          </Card>

      <Card className="border-border/30 bg-muted/50 opacity-80 cursor-not-allowed">
        <CardContent className="p-5 flex flex-col items-center justify-center space-y-2 text-center min-h-[150px]">
          <div className="p-3 rounded-full bg-muted text-muted-foreground ring-1 ring-border">
            <BookHeart className="h-5 w-5" />
          </div>
          <span className="font-semibold text-base text-muted-foreground">Update History</span>
          <p className="text-xs text-muted-foreground">Feature coming soon</p>
        </CardContent>
      </Card>
    </div>
  </div>

  {/* Digital Prescriptions Section */}
  <Card className="shadow-sm">
    <CardHeader>
      <CardTitle className="text-xl">My Digital Prescriptions</CardTitle>
      <CardDescription>Prescriptions created digitally by your doctors.</CardDescription>
    </CardHeader>
    <CardContent>
      {renderDigitalPrescriptions()}
    </CardContent>
  </Card>

  {/* Upload Prescription Section */}
  <Card className="shadow-sm"> {/* Added shadow */}
        <CardHeader>
          <CardTitle className="text-xl">Upload Prescription File</CardTitle> {/* Adjusted size */}
          <CardDescription>
            Upload existing prescription files (PDF, JPG, PNG - Max 5MB). These are stored for your reference.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleUploadSubmit}>
          <CardContent className="space-y-5"> {/* Increased space */}
            {/* Combined Alerts */}
            {(uploadError || uploadSuccess) && (
              <Alert variant={uploadError ? "destructive" : "default"} className={uploadSuccess ? "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700 text-green-800 dark:text-green-200" : ""}>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{uploadError ? "Upload Failed" : "Upload Successful"}</AlertTitle>
                <AlertDescription>{uploadError ?? uploadSuccess}</AlertDescription>
              </Alert>
            )}
            {/* Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              <div className="space-y-2">
                <Label htmlFor="prescriptionFile" className="font-medium">Prescription File*</Label>
                <Input 
                  id="prescriptionFile" 
                  type="file" 
                  onChange={handleFileChange} 
                  accept=".pdf,.jpg,.jpeg,.png" 
                  required 
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
                {selectedFile && <p className="text-xs text-muted-foreground pt-1">Selected: {selectedFile.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="uploadNotes" className="font-medium">Notes (Optional)</Label>
                <Textarea 
                  placeholder="e.g., 'For fever, taken on Jan 2024'" 
                  id="uploadNotes" 
                  value={uploadNotes}
                  onChange={handleNotesChange}
                  rows={3} // Limit rows
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4"> {/* Added border */}
            <Button type="submit" disabled={uploading || !selectedFile} size="sm"> {/* Smaller button */}
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
      <Card className="shadow-sm"> {/* Added shadow */}
        <CardHeader>
          <CardTitle className="text-xl">My Uploaded Files</CardTitle> {/* Adjusted size */}
          <CardDescription>View and manage your uploaded prescription files.</CardDescription>
        </CardHeader>
        <CardContent className="p-0"> {/* Remove padding for full-width table */}
          {/* Render uploaded prescriptions content */}
          {renderUploadedPrescriptionsContent({
            listLoading,
            listError,
            uploadedPrescriptions,
            deletingId,
            formatDate,
            handleDelete,
          })}
        </CardContent>
      </Card>

      {/* Adherence History Section */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Medication Log History</CardTitle>
          <CardDescription>Your recent medication intake logs.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {renderAdherenceHistoryContent()}
        </CardContent>
        {/* Pagination for History */}
        {historyPagination.totalPages > 1 && (
          <CardFooter className="flex justify-between items-center border-t px-6 py-3">
            <span className="text-xs text-muted-foreground">
              Page {historyPagination.page} of {historyPagination.totalPages} ({historyPagination.total} logs)
            </span>
            <div className="space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleHistoryPageChange(historyPagination.page - 1)}
                disabled={historyPagination.page <= 1 || historyLoading}
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleHistoryPageChange(historyPagination.page + 1)}
                disabled={historyPagination.page >= historyPagination.totalPages || historyLoading}
              >
                Next
              </Button>
            </div>
          </CardFooter>
        )}
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

// Define props interface for the helper function
interface RenderUploadedPrescriptionsProps {
  listLoading: boolean;
  listError: string | null;
  uploadedPrescriptions: UploadedPrescription[];
  deletingId: string | null;
  formatDate: (dateString: string) => string;
  handleDelete: (id: string) => Promise<void>; // <-- Changed to expect Promise<void>
}

// Helper function to render uploaded prescriptions section content
const renderUploadedPrescriptionsContent = ({
  listLoading,
  listError,
  uploadedPrescriptions,
  deletingId,
  formatDate,
  handleDelete,
}: RenderUploadedPrescriptionsProps) => {
  if (listLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading uploads...</span>
      </div>
    );
  }

  if (listError) {
    return (
      <div className="p-6"> {/* Add padding for error message */}
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading List</AlertTitle>
          <AlertDescription>{listError}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (uploadedPrescriptions.length === 0) {
    return (
      <p className="text-center text-muted-foreground p-6">No prescriptions uploaded yet.</p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[40%]">Filename</TableHead> {/* Adjusted width */}
          <TableHead>Notes</TableHead>
          <TableHead className="hidden sm:table-cell">Uploaded</TableHead> {/* Hide on small screens */}
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {uploadedPrescriptions.map((prescription) => {
          // Extracted icon logic for the delete button
          const deleteButtonIcon = deletingId === prescription.id ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          );

          return (
            <TableRow key={prescription.id} className="hover:bg-muted/50"> {/* Added hover effect */}
              <TableCell className="font-medium truncate max-w-xs">{prescription.filename}</TableCell>
              <TableCell className="text-muted-foreground text-xs truncate max-w-[200px]"> {/* Smaller text, truncate */}
                {prescription.notes ?? '-'}
              </TableCell>
              <TableCell className="hidden sm:table-cell text-xs">{formatDate(prescription.uploadDate)}</TableCell> {/* Use formatter */}
              <TableCell className="text-right">
                <Button
                  variant="ghost" // Changed to ghost
                  size="icon" // Changed to icon size
                  className="text-destructive hover:bg-destructive/10 h-8 w-8" // Adjusted size/styling
                  onClick={() => handleDelete(prescription.id)}
                  disabled={deletingId === prescription.id}
                  aria-label="Delete uploaded prescription"
                >
                  {deleteButtonIcon} {/* Use the extracted variable */}
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};


export default PatientDashboard;
