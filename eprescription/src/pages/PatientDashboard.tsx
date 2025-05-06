import { FC, useEffect, useState, ChangeEvent, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Patient, Prescription } from "../types/models";
import { patientService, prescriptionService, adherenceService, AdherenceLog } from "../services/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  AlertCircle,
  LogOut,
  UploadCloud,
  Trash2,
  FileText, 
  Calendar, 
  BookHeart, 
  Mail, 
  Phone, 
  MapPin, 
  Clock,
  Loader2,
  Pill,
  CheckCircle,
  BellRing // Added BellRing icon
} from "lucide-react";

// Define UploadedPrescription type
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

interface MedicationListProps {
  prescription: Prescription;
  loggingMedicationId: string | null;
  handleLogDose: (prescriptionId: string, medicationId: string) => void;
}

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
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleLogDose(prescription.id, med.id)}
              disabled={loggingMedicationId === med.id}
              className="text-xs"
            >
              {logButtonIcon}
              Log Dose
            </Button>
          </li>
        );
      })}
    </ul>
  );
};

interface LogSuccessAlertProps {
  message: string | null;
  prescription: Prescription;
}

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

interface LogErrorAlertProps {
  error: string | null;
  prescription: Prescription;
  loggingMedicationId: string | null;
}

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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const [uploadedPrescriptions, setUploadedPrescriptions] = useState<UploadedPrescription[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadNotes, setUploadNotes] = useState<string>("");
  const [listLoading, setListLoading] = useState<boolean>(false);
  const [listError, setListError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [digitalPrescriptions, setDigitalPrescriptions] = useState<Prescription[]>([]);
  const [digitalLoading, setDigitalLoading] = useState<boolean>(false);
  const [digitalError, setDigitalError] = useState<string | null>(null);

  // State for refill alerts (NEW)
  const [refillAlerts, setRefillAlerts] = useState<Prescription[]>([]);

  const [loggingMedicationId, setLoggingMedicationId] = useState<string | null>(null);
  const [logError, setLogError] = useState<string | null>(null);
  const [logSuccessMessage, setLogSuccessMessage] = useState<string | null>(null);

  const [adherenceLogs, setAdherenceLogs] = useState<AdherenceLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyPagination, setHistoryPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

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

  const fetchDigitalPrescriptions = async (token: string): Promise<void> => {
    setDigitalLoading(true);
    setDigitalError(null);
    try {
      const response = await prescriptionService.getAllPrescriptions(token); 
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
      setLoading(true);
      setError(null);
      setListError(null);
      setDigitalError(null);
      setHistoryError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token || localStorage.getItem('userType') !== 'patient') {
          throw new Error('Authentication required');
        }

        const [profileResponse] = await Promise.all([
          patientService.getProfile(token),
          fetchUploadedPrescriptions(token),
          fetchDigitalPrescriptions(token),
          fetchAdherenceHistory(token, historyPagination.page, historyPagination.limit)
        ]);
        
        if (!profileResponse?.patient?.id) {
          throw new Error('Invalid patient data received');
        }
        setData(profileResponse);
      } catch (error) {
        console.error('Error fetching patient data:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load patient data';
        setError(errorMessage);
        if (errorMessage === 'Authentication required' || errorMessage.includes('token')) {
          localStorage.removeItem('token');
          localStorage.removeItem('userType');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchPatientData();
  }, [navigate]); // Removed historyPagination from deps to avoid re-fetch on page change only

  // useEffect to update refill alerts based on digitalPrescriptions (NEW)
  useEffect(() => {
    if (digitalPrescriptions && digitalPrescriptions.length > 0) {
      const alerts = digitalPrescriptions.filter(
        (p) => p.needsRefillSoon === true
      );
      setRefillAlerts(alerts);
    } else {
      setRefillAlerts([]);
    }
  }, [digitalPrescriptions]);


  const handleLogout = (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    navigate('/');
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.[0]) {
      setSelectedFile(event.target.files[0]);
      setUploadError(null);
      setUploadSuccess(null);
    }
  };

  const handleNotesChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setUploadNotes(event.target.value);
  };

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
      setSelectedFile(null);
      setUploadNotes("");
      fetchUploadedPrescriptions(token); 
    } catch (err) {
      console.error('Error uploading file:', err);
      const apiError = err as { message?: string };
      setUploadError(apiError?.message ?? 'Failed to upload file.');
    } finally {
      setUploading(false);
    }
  };

  const handleLogDose = async (prescriptionId: string, medicationId: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError("Authentication required. Please log in again.");
      return;
    }
    setLoggingMedicationId(medicationId);
    setLogError(null);
    setLogSuccessMessage(null);
    try {
      const response = await adherenceService.logAdherence({ prescriptionId, medicationId }, token);
      setLogSuccessMessage(`Logged dose for ${response.logEntry.medication?.name ?? 'medication'} successfully!`);
      fetchAdherenceHistory(token, 1, historyPagination.limit);
      setTimeout(() => setLogSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error logging dose:', err);
      const apiError = err as { message?: string; errors?: { msg: string }[] };
      const errorMsg = apiError.errors?.[0]?.msg ?? apiError.message ?? 'Failed to log dose.';
      setLogError(errorMsg);
      setTimeout(() => setLogError(null), 5000);
    } finally {
      setLoggingMedicationId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this uploaded prescription?")) {
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      setError("Authentication required. Please log in again.");
      return;
    }
    setDeletingId(id);
    setListError(null);
    try {
      await patientService.deleteUploadedPrescription(id, token);
      setUploadedPrescriptions(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Error deleting prescription:', err);
      const apiError = err as { message?: string };
      setListError(apiError?.message ?? 'Failed to delete prescription.');
    } finally {
      setDeletingId(null);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

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

  const handleHistoryPageChange = (newPage: number) => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchAdherenceHistory(token, newPage, historyPagination.limit);
    }
  };

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
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <h4 className="text-sm font-semibold mb-2">Medications:</h4>
              <MedicationList 
                prescription={prescription} 
                loggingMedicationId={loggingMedicationId} 
                handleLogDose={handleLogDose} 
              />
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
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-10">
      {/* Profile Overview */}
      <Card className="border-primary/20 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="space-y-1.5">
              <CardTitle className="text-2xl lg:text-3xl font-bold tracking-tight">Welcome, {patient.name}!</CardTitle>
              <CardDescription>Your health dashboard and uploaded prescriptions.</CardDescription>
            </div>
            <Badge variant="secondary" className="font-mono text-sm py-1 px-3">
              ID: {patient.shortId}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-border/30 shadow-xs">
              <CardHeader className="py-3 px-4 border-b">
                <CardTitle className="text-base font-semibold">Personal Info</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center text-sm space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">Age:</span>
                  <span>{patient.age} years</span>
                </div>
                <div className="flex items-center text-sm space-x-2">
                   <Badge variant="outline" className="font-normal text-xs py-0.5 px-1.5">
                    {patient.gender}
                  </Badge>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/30 shadow-xs">
              <CardHeader className="py-3 px-4 border-b">
                <CardTitle className="text-base font-semibold">Contact Details</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start text-sm space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span>{patient.phoneNumber}</span>
                </div>
                <div className="flex items-start text-sm space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span>{patient.address}</span>
                </div>
              </CardContent>
            </Card>
          </div>
          {patient.medicalHistory && (
            <Card className="border-border/30 shadow-xs">
              <CardHeader className="py-3 px-4 border-b">
                <CardTitle className="text-base font-semibold">Medical History</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{patient.medicalHistory}</p>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Refill Reminders (NEW) */}
      {refillAlerts.length > 0 && (
        <Alert variant="default" className="bg-yellow-50 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200">
          <BellRing className="h-5 w-5" />
          <AlertTitle className="font-semibold">Refill Reminders</AlertTitle>
          <AlertDescription>
            The following prescriptions may need a refill soon:
            <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
              {refillAlerts.map((p) => (
                <li key={p.id}>
                  Diagnosis: <strong>{p.diagnosis}</strong> (Prescribed on: {formatDate(p.date)})
                  {p.estimatedEndDate && (
                    <span className="text-xs block text-muted-foreground">
                      Estimated to end around: {formatDate(p.estimatedEndDate)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Actions */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link to="/view-prescriptions" className="group">
            <Card className="hover:shadow-lg transition-shadow duration-200 hover:border-primary/40 border-border/30">
              <CardContent className="p-5 flex flex-col items-center justify-center space-y-2 text-center min-h-[150px]">
                <div className="p-3 rounded-full bg-primary/10 text-primary ring-1 ring-primary/20 group-hover:ring-primary/40 transition-all duration-200">
                  <FileText className="h-5 w-5" />
                </div>
                <span className="font-semibold text-base">My Prescriptions</span>
                <p className="text-xs text-muted-foreground">View digitally created prescriptions</p>
              </CardContent>
            </Card>
          </Link>
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
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Upload Prescription File</CardTitle>
          <CardDescription>
            Upload existing prescription files (PDF, JPG, PNG - Max 5MB). These are stored for your reference.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleUploadSubmit}>
          <CardContent className="space-y-5">
            {(uploadError || uploadSuccess) && (
              <Alert variant={uploadError ? "destructive" : "default"} className={uploadSuccess ? "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700 text-green-800 dark:text-green-200" : ""}>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{uploadError ? "Upload Failed" : "Upload Successful"}</AlertTitle>
                <AlertDescription>{uploadError ?? uploadSuccess}</AlertDescription>
              </Alert>
            )}
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
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit" disabled={uploading || !selectedFile} size="sm">
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
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">My Uploaded Files</CardTitle>
          <CardDescription>View and manage your uploaded prescription files.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
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
      <Card className="bg-background border-t mt-12">
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

interface RenderUploadedPrescriptionsProps {
  listLoading: boolean;
  listError: string | null;
  uploadedPrescriptions: UploadedPrescription[];
  deletingId: string | null;
  formatDate: (dateString: string) => string;
  handleDelete: (id: string) => Promise<void>;
}

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
      <div className="p-6">
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
          <TableHead className="w-[40%]">Filename</TableHead>
          <TableHead>Notes</TableHead>
          <TableHead className="hidden sm:table-cell">Uploaded</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {uploadedPrescriptions.map((prescription) => {
          const deleteButtonIcon = deletingId === prescription.id ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          );
          return (
            <TableRow key={prescription.id} className="hover:bg-muted/50">
              <TableCell className="font-medium truncate max-w-xs">{prescription.filename}</TableCell>
              <TableCell className="text-muted-foreground text-xs truncate max-w-[200px]">
                {prescription.notes ?? '-'}
              </TableCell>
              <TableCell className="hidden sm:table-cell text-xs">{formatDate(prescription.uploadDate)}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10 h-8 w-8"
                  onClick={() => handleDelete(prescription.id)}
                  disabled={deletingId === prescription.id}
                  aria-label="Delete uploaded prescription"
                >
                  {deleteButtonIcon}
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
