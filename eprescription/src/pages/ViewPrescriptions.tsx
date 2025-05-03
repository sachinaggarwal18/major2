import { FC, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { prescriptionService } from "../services/api";
import { Prescription, Doctor, Patient } from "../types/models";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // For error display
import { 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  Clock,
  FileText, // Added FileText for empty state
  Loader2, 
  RefreshCcw 
} from "lucide-react";
import PrescriptionPDF from "../components/PrescriptionPDF";

const ViewPrescriptions: FC = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPrescriptions = async (): Promise<void> => {
      setLoading(true);
      setError(null); // Reset error on new fetch
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          // No token, redirect to login (adjust based on user type if needed)
          const userType = localStorage.getItem('userType');
          navigate(userType === 'doctor' ? '/doctor/login' : '/patient/login');
          return;
        }

        // Fetch prescriptions - API should handle returning relevant ones based on token/user type
        const data = await prescriptionService.getAllPrescriptions(token);
        console.log('API Response:', data); // Debug log
        if (!Array.isArray(data)) {
          throw new Error('Invalid response format');
        }
        // Detailed debugging of prescription data
        data.forEach((p, i) => {
          console.log(`Prescription ${i + 1} details:`, {
            id: p.id,
            doctor: {
              id: p.doctor?.id,
              name: p.doctor?.name,
              specialization: p.doctor?.specialization,
              license: p.doctor?.licenseNumber,
              hospital: p.doctor?.hospitalAffiliation,
              contact: p.doctor?.phoneNumber
            },
            patient: {
              id: p.patient?.id,
              name: p.patient?.name,
              age: p.patient?.age,
              gender: p.patient?.gender,
              contact: p.patient?.phoneNumber,
              history: p.patient?.medicalHistory
            },
            diagnosis: p.diagnosis,
            medications: p.medications?.length,
            full: p
          });
        });

        // Simplified validation: Check for ID and valid doctor/patient objects using type guards
        const validPrescriptions = data.filter(p => {
          const hasId = !!p?.id;
          const hasValidDoctor = p.doctor && isDoctor(p.doctor); // isDoctor checks key fields
          const hasValidPatient = p.patient && isPatient(p.patient); // isPatient checks key fields
          
          if (!hasId || !hasValidDoctor || !hasValidPatient) {
            console.warn('Validation failed for prescription:', {
              hasId,
              hasValidDoctor,
              hasValidPatient,
              prescriptionId: p.id,
              doctorValidation: {
                exists: !!p.doctor,
                isObject: typeof p.doctor === 'object',
                hasName: typeof p.doctor?.name === 'string' && p.doctor?.name !== '',
                hasSpecialization: typeof p.doctor?.specialization === 'string' && p.doctor?.specialization !== '',
                hasLicense: typeof p.doctor?.licenseNumber === 'string' && p.doctor?.licenseNumber !== '',
                actualValue: {
                  name: p.doctor?.name,
                  specialization: p.doctor?.specialization,
                  licenseNumber: p.doctor?.licenseNumber
                }
              },
              patientValidation: {
                exists: !!p.patient,
                isObject: typeof p.patient === 'object',
                hasName: typeof p.patient?.name === 'string' && p.patient?.name !== '',
                hasAge: typeof p.patient?.age === 'number',
                hasValidGender: typeof p.patient?.gender === 'string' && 
                              ['Male', 'Female', 'Other'].includes(p.patient?.gender || ''),
                actualValue: {
                  name: p.patient?.name,
                  age: p.patient?.age,
                  gender: p.patient?.gender
                }
              }
            });
          }
          
          return hasId && hasValidDoctor && hasValidPatient;
        });

        // Set warning if prescriptions were filtered out
        if (validPrescriptions.length !== data.length) {
          const skippedCount = data.length - validPrescriptions.length;
          setValidationWarning(
            `${skippedCount} prescription${skippedCount === 1 ? ' was' : 's were'} skipped during loading.`
          );
        } else {
          setValidationWarning(null);
        }
        
        setPrescriptions(validPrescriptions);
      } catch (err) {
        console.error("Error fetching prescriptions:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to load prescriptions. Please try again later.";
        console.error("Full error details:", err); // Debug log
        setError(errorMessage);
        // Optional: Clear token if it's an auth error (e.g., 401 Unauthorized)
        // if (err.response?.status === 401) {
        //   localStorage.removeItem('token');
        //   localStorage.removeItem('userType');
        //   navigate('/');
        // }
      } finally {
        setLoading(false);
      }
    };

    fetchPrescriptions();
  }, [navigate]);

  const formatDate = (dateString: string | Date): string => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  // Helper to get display name or ID with proper type checking
  const getIdentifierName = (identifier: string | Doctor | Patient | null): string => {
    if (typeof identifier === 'object' && identifier !== null) {
      return identifier.name;
    }
    if (typeof identifier === 'string' && identifier.length > 0) {
      return `ID: ${identifier.substring(0, 8)}...`; // Show partial ID if string
    }
    return 'N/A';
  };

  // Type guard for doctor object with field type validation
  const isDoctor = (obj: any): obj is Doctor => {
    return obj && typeof obj === 'object' && 
           typeof obj.name === 'string' && obj.name !== '' &&
           typeof obj.specialization === 'string' && obj.specialization !== '' &&
           typeof obj.licenseNumber === 'string' && obj.licenseNumber !== '';
  };

  // Type guard for patient object with field type validation
  const isPatient = (obj: any): obj is Patient => {
    const validGenders = ['Male', 'Female', 'Other'];
    return obj && typeof obj === 'object' && 
           typeof obj.name === 'string' && obj.name !== '' &&
           typeof obj.age === 'number' &&
           typeof obj.gender === 'string' && validGenders.includes(obj.gender);
  };


  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const toggleCard = (id: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Get prescription status based on creation date
  const getPrescriptionStatus = (date: string | Date) => {
    const prescriptionDate = new Date(date);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - prescriptionDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff <= 7) {
      return { label: "Active", variant: "default" as const };
    } else if (daysDiff <= 30) {
      return { label: "Recent", variant: "secondary" as const };
    } else {
      return { label: "Archived", variant: "outline" as const };
    }
  };

  if (loading) {
    return (
      // Consistent loading state styling
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-150px)] space-y-4 p-4"> 
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading prescriptions...</p>
      </div>
    );
  }

  return (
    // Consistent container padding
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6"> 
      <div className="flex flex-wrap justify-between items-center gap-4"> {/* Added flex-wrap and gap */}
        <h2 className="text-2xl font-bold tracking-tight">My Prescriptions</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()} // Consider a state refresh instead of full reload
          // className="hidden md:flex" // Keep visible on smaller screens too
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh List
        </Button>
      </div>

      {/* Alerts with slightly more margin */}
      {error && (
        <Alert variant="destructive" className="my-6"> 
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Prescriptions</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {validationWarning && (
        <Alert className="my-6 border-yellow-200 bg-yellow-50/50 dark:border-yellow-800 dark:bg-yellow-900/30">
          <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          <AlertTitle className="font-medium text-yellow-800 dark:text-yellow-200">Data Warning</AlertTitle>
          <AlertDescription className="mt-1 text-yellow-700 dark:text-yellow-300">
            {validationWarning} Some prescriptions might be incomplete or have invalid data.
          </AlertDescription>
        </Alert>
      )}

      {prescriptions.length === 0 && !loading && !error ? (
        <Card className="border-dashed"> {/* Dashed border for empty state */}
          <CardContent className="flex flex-col items-center justify-center h-48 p-6 text-center"> {/* Increased height and padding */}
            <FileText className="h-12 w-12 text-muted-foreground mb-4" /> {/* Added icon */}
            <p className="text-lg font-medium text-muted-foreground mb-2">No prescriptions found.</p>
            <p className="text-sm text-muted-foreground mb-4">Your prescriptions will appear here once added.</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Try Refreshing
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {prescriptions.map((prescription) => (
            // Added border and increased shadow on hover
            <Card key={prescription.id} className="transition-all duration-200 border border-border/40 hover:shadow-lg"> 
              <CardHeader 
                className="cursor-pointer p-4 hover:bg-muted/50" // Adjusted padding and hover bg
                onClick={() => toggleCard(prescription.id)}
              >
                <div className="flex justify-between items-start gap-4"> {/* Use items-start for better alignment */}
                  <div className="space-y-1.5 flex-grow"> {/* Allow text to wrap */}
                    <CardTitle className="text-lg leading-tight"> {/* Adjusted size/leading */}
                      Prescription from Dr. {getIdentifierName(prescription.doctor)}
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground space-y-0.5"> {/* Adjusted spacing */}
                      <div className="flex items-center">
                        <Clock className="mr-1.5 h-3 w-3" /> {/* Adjusted margin */}
                        {formatDate(prescription.createdAt)}
                      </div>
                      {/* Show patient name/ID based on user type? For now, always show patient ID */}
                      <div className="flex items-center text-primary/90 dark:text-primary/70">
                        <span className="font-medium">Patient: {prescription.patient.shortId}</span>
                      </div>
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end space-y-2 flex-shrink-0"> {/* Column layout for badge/icon */}
                    <Badge variant={getPrescriptionStatus(prescription.createdAt).variant} className="text-xs"> {/* Smaller badge text */}
                      {getPrescriptionStatus(prescription.createdAt).label}
                    </Badge>
                    {expandedCards.has(prescription.id) ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" /> // Slightly larger icon
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>
              {/* Content with adjusted padding */}
              <CardContent 
                className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedCards.has(prescription.id) ? 'max-h-[1000px] opacity-100 p-4 pt-0' : 'max-h-0 opacity-0 p-0'}`} // Smooth expand/collapse
              >
                <div className="border-t pt-4 flex flex-col gap-4"> {/* Added border-t here */}
                  {/* Summary Section */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs mb-0.5">Prescribing Doctor</p>
                      <p className="font-medium">{getIdentifierName(prescription.doctor)}</p>
                      {isDoctor(prescription.doctor) && (
                        <>
                          <p className="text-xs text-primary/80 dark:text-primary/70">ID: {prescription.doctor.shortId}</p>
                          <p className="text-xs text-muted-foreground">{prescription.doctor.specialization}</p>
                        </>
                      )}
                    </div>
                    <div className="sm:text-right">
                      <p className="text-muted-foreground text-xs mb-0.5">Medications Prescribed</p>
                      <p className="font-medium">{prescription.medications.length} item(s)</p>
                    </div>
                     {/* Optionally add Patient details if needed */}
                     {/* <div>
                       <p className="text-muted-foreground text-xs mb-0.5">Patient</p>
                       <p className="font-medium">{getIdentifierName(prescription.patient)}</p>
                       {isPatient(prescription.patient) && (
                         <p className="text-xs text-muted-foreground">Age: {prescription.patient.age}, Gender: {prescription.patient.gender}</p>
                       )}
                     </div> */}
                  </div>

                  {/* PDF Component Area */}
                  <div className="mt-2"> {/* Add margin-top */}
                    <h4 className="text-sm font-medium mb-2 text-muted-foreground">Prescription Details (PDF View)</h4>
                    <div className="border rounded-md overflow-hidden"> {/* Add border around PDF */}
                      <PrescriptionPDF prescription={prescription} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ViewPrescriptions;
