import { FC, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { prescriptionService } from "../services/api";
import { Prescription } from "../types/models";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // For error display
import { 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Download, 
  Loader2, 
  RefreshCcw 
} from "lucide-react";

const ViewPrescriptions: FC = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
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
        setPrescriptions(data);
      } catch (err) {
        console.error("Error fetching prescriptions:", err);
        setError(err instanceof Error ? err.message : "Failed to load prescriptions. Please try again later.");
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

  // Helper to get display name or ID
  const getIdentifierName = (identifier: any): string => {
    if (typeof identifier === 'object' && identifier !== null && identifier.name) {
      return identifier.name;
    }
    if (typeof identifier === 'string') {
      return `ID: ${identifier.substring(0, 8)}...`; // Show partial ID if object not populated
    }
    return 'N/A';
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
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
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
            <Card key={prescription._id} className="transition-all duration-200 hover:shadow-md">
              <CardHeader className="cursor-pointer" onClick={() => toggleCard(prescription._id)}>
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <CardTitle>Prescription Details</CardTitle>
                      <Badge variant={getPrescriptionStatus(prescription.createdAt).variant}>
                        {getPrescriptionStatus(prescription.createdAt).label}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center">
                      <Clock className="mr-1 h-3 w-3" />
                      {formatDate(prescription.createdAt)}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-muted-foreground hidden md:inline">
                      ID: {prescription._id.substring(0, 8)}...
                    </span>
                    {expandedCards.has(prescription._id) ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className={`space-y-4 transition-all duration-200 ${expandedCards.has(prescription._id) ? 'block' : 'hidden'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                  <div><span className="font-medium text-muted-foreground">Patient:</span> {getIdentifierName(prescription.patientId)}</div>
                  <div><span className="font-medium text-muted-foreground">Doctor:</span> {getIdentifierName(prescription.doctorId)}</div>
                  <div className="md:col-span-2"><span className="font-medium text-muted-foreground">Diagnosis:</span> {prescription.diagnosis}</div>
                  {prescription.notes && (
                    <div className="md:col-span-2"><span className="font-medium text-muted-foreground">Notes:</span> {prescription.notes}</div>
                  )}
                </div>

                <div className="rounded-md border">
                  <div className="flex items-center justify-between p-4">
                    <h4 className="font-medium">Medications</h4>
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-muted/50">
                        <TableHead className="w-[40%]">Name</TableHead>
                        <TableHead className="w-[20%]">Dosage</TableHead>
                        <TableHead className="w-[20%]">Frequency</TableHead>
                        <TableHead className="w-[20%]">Duration</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {prescription.medications.map((med, index) => (
                        <TableRow key={`${prescription._id}-med-${index}-${med.name}`}>
                          <TableCell className="font-medium">{med.name}</TableCell>
                          <TableCell>{med.dosage}</TableCell>
                          <TableCell>{med.frequency}</TableCell>
                          <TableCell>{med.duration}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
