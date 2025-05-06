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
  FileText, 
  Loader2, 
  RefreshCcw,
  BellRing // Added BellRing icon
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
      setError(null); 
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          const userType = localStorage.getItem('userType');
          navigate(userType === 'doctor' ? '/doctor/login' : '/patient/login');
          return;
        }

        const data = await prescriptionService.getAllPrescriptions(token);
        if (!Array.isArray(data)) {
          throw new Error('Invalid response format');
        }
        
        const validPrescriptions = data.filter(p => {
          const hasId = !!p?.id;
          const hasValidDoctor = p.doctor && isDoctor(p.doctor);
          const hasValidPatient = p.patient && isPatient(p.patient);
          
          if (!hasId || !hasValidDoctor || !hasValidPatient) {
            console.warn('Validation failed for prescription:', {
              prescriptionId: p.id,
              // ... (keep detailed logging if needed for debugging)
            });
          }
          return hasId && hasValidDoctor && hasValidPatient;
        });

        if (validPrescriptions.length !== data.length) {
          const skippedCount = data.length - validPrescriptions.length;
          setValidationWarning(
            `${skippedCount} prescription${skippedCount === 1 ? ' was' : 's were'} skipped due to incomplete data.`
          );
        } else {
          setValidationWarning(null);
        }
        
        setPrescriptions(validPrescriptions);
      } catch (err) {
        console.error("Error fetching prescriptions:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to load prescriptions. Please try again later.";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchPrescriptions();
  }, [navigate]);

  const formatDateTime = (dateString: string | Date): string => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  // New simpler date formatter for estimatedEndDate
  const formatSimpleDate = (dateString: string | Date | null | undefined): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const getIdentifierName = (identifier: string | Doctor | Patient | null): string => {
    if (typeof identifier === 'object' && identifier !== null) {
      return identifier.name;
    }
    if (typeof identifier === 'string' && identifier.length > 0) {
      return `ID: ${identifier.substring(0, 8)}...`;
    }
    return 'N/A';
  };

  const isDoctor = (obj: any): obj is Doctor => {
    return obj && typeof obj === 'object' && 
           typeof obj.name === 'string' && obj.name !== '' &&
           typeof obj.specialization === 'string' && obj.specialization !== '' &&
           typeof obj.licenseNumber === 'string' && obj.licenseNumber !== '';
  };

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
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-150px)] space-y-4 p-4"> 
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading prescriptions...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6"> 
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-2xl font-bold tracking-tight">My Prescriptions</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh List
        </Button>
      </div>

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
            {validationWarning}
          </AlertDescription>
        </Alert>
      )}

      {prescriptions.length === 0 && !loading && !error ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center h-48 p-6 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
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
            <Card key={prescription.id} className={`transition-all duration-200 border hover:shadow-lg ${prescription.needsRefillSoon ? 'border-yellow-400 dark:border-yellow-600' : 'border-border/40'}`}> 
              <CardHeader 
                className="cursor-pointer p-4 hover:bg-muted/50"
                onClick={() => toggleCard(prescription.id)}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1.5 flex-grow">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg leading-tight">
                        Prescription from Dr. {getIdentifierName(prescription.doctor)}
                      </CardTitle>
                      {prescription.needsRefillSoon && (
                        <BellRing className="h-4 w-4 text-yellow-500" aria-label="Needs refill soon" />
                      )}
                    </div>
                    <CardDescription className="text-xs text-muted-foreground space-y-0.5">
                      <div className="flex items-center">
                        <Clock className="mr-1.5 h-3 w-3" />
                        Prescribed on: {formatDateTime(prescription.date)} {/* Use prescription.date */}
                      </div>
                      {prescription.estimatedEndDate && (
                        <div className="flex items-center">
                          <Clock className="mr-1.5 h-3 w-3 text-orange-500" />
                          Est. End Date: {formatSimpleDate(prescription.estimatedEndDate)}
                        </div>
                      )}
                      <div className="flex items-center text-primary/90 dark:text-primary/70">
                        <span className="font-medium">Patient: {prescription.patient.shortId}</span>
                      </div>
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end space-y-2 flex-shrink-0">
                    <Badge variant={getPrescriptionStatus(prescription.date).variant} className="text-xs"> {/* Use prescription.date for status */}
                      {getPrescriptionStatus(prescription.date).label}
                    </Badge>
                    {expandedCards.has(prescription.id) ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent 
                className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedCards.has(prescription.id) ? 'max-h-[1000px] opacity-100 p-4 pt-0' : 'max-h-0 opacity-0 p-0'}`}
              >
                <div className="border-t pt-4 flex flex-col gap-4">
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
                  </div>
                  <div className="mt-2">
                    <h4 className="text-sm font-medium mb-2 text-muted-foreground">Prescription Details (PDF View)</h4>
                    <div className="border rounded-md overflow-hidden">
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
