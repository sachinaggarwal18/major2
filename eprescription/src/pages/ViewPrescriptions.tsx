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
      <div className="flex flex-col justify-center items-center min-h-screen space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading prescriptions...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">My Prescriptions</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
          className="hidden md:flex"
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {validationWarning && (
        <Alert className="mb-4 border-yellow-200 bg-yellow-50/50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="font-medium text-yellow-800">Some prescriptions were skipped</AlertTitle>
          <AlertDescription className="mt-1 text-yellow-700">
            {validationWarning} They may be incomplete or have invalid data.
          </AlertDescription>
        </Alert>
      )}

      {prescriptions.length === 0 && !loading && !error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-40">
            <p className="text-muted-foreground mb-4">No prescriptions found.</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {prescriptions.map((prescription) => (
            <Card key={prescription.id} className="transition-all duration-200 hover:shadow-md">
              {/* Simplified Card Header */}
              <CardHeader className="cursor-pointer" onClick={() => toggleCard(prescription.id)}>
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      Prescription from Dr. {getIdentifierName(prescription.doctor)}
                    </CardTitle>
                    <CardDescription className="flex items-center text-xs">
                      <Clock className="mr-1 h-3 w-3" />
                      {formatDate(prescription.createdAt)}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={getPrescriptionStatus(prescription.createdAt).variant}>
                      {getPrescriptionStatus(prescription.createdAt).label}
                    </Badge>
                    {expandedCards.has(prescription.id) ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>
              {/* Quick Overview Card Content */}
              <CardContent className={`transition-all duration-200 ${expandedCards.has(prescription.id) ? 'block' : 'hidden'}`}>
                <div className="flex flex-col gap-4">
                  {/* Summary */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">Doctor</p>
                      <p className="font-medium">{getIdentifierName(prescription.doctor)}</p>
                      {isDoctor(prescription.doctor) && (
                        <p className="text-xs text-muted-foreground">{prescription.doctor.specialization}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground mb-1">Medications</p>
                      <p className="font-medium">{prescription.medications.length} items</p>
                    </div>
                  </div>

                  {/* PDF Component Area */}
                  <div className="border-t pt-4 block"> {/* Ensure it's a block container */}
                    <PrescriptionPDF prescription={prescription} />
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
