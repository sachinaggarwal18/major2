import { FC, useEffect, useState, FormEvent } from "react"; // Removed ChangeEvent
import { Link, useNavigate } from "react-router-dom";
import { Doctor, Prescription } from "../types/models"; // Removed Patient import
import { doctorService, prescriptionService } from "../services/api"; 
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"; // Removed CardFooter
import { Input } from "@/components/ui/input"; 
import { Label } from "@/components/ui/label"; 
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"; 
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
  HelpCircle,
  Filter, 
  XCircle, 
  ArrowUpDown, 
  Eye 
} from "lucide-react";

// Helper to format date
const formatDate = (dateString: string | Date | undefined): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const DoctorDashboard: FC = () => {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState<boolean>(true); 
  const navigate = useNavigate();

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [prescriptionsLoading, setPrescriptionsLoading] = useState<boolean>(true);
  const [prescriptionsError, setPrescriptionsError] = useState<string | null>(null);

  const [patientNameFilter, setPatientNameFilter] = useState('');
  const [patientShortIdFilter, setPatientShortIdFilter] = useState('');
  const [diagnosisFilter, setDiagnosisFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [sortBy, setSortBy] = useState('date'); 
  const [sortOrder, setSortOrder] = useState('desc'); 

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

  const fetchPrescriptions = async () => {
    setPrescriptionsLoading(true);
    setPrescriptionsError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/doctor/login');
        return;
      }
      const params: Record<string, string> = { sortBy, sortOrder };
      if (patientNameFilter) params.patientName = patientNameFilter;
      if (patientShortIdFilter) params.patientShortId = patientShortIdFilter;
      if (diagnosisFilter) params.diagnosis = diagnosisFilter;
      if (dateFromFilter) params.dateFrom = dateFromFilter;
      if (dateToFilter) params.dateTo = dateToFilter;
      
      const response = await prescriptionService.getAllPrescriptions(token, params);
      setPrescriptions(Array.isArray(response) ? response : []);
    } catch (err) {
      console.error('Error fetching prescriptions:', err);
      setPrescriptionsError(err instanceof Error ? err.message : 'Failed to load prescriptions');
    } finally {
      setPrescriptionsLoading(false);
    }
  };

  useEffect(() => {
    if (doctor) { 
      fetchPrescriptions();
    }
  }, [doctor, sortBy, sortOrder]); 

  const handleApplyFilters = (e?: FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    fetchPrescriptions();
  };

  const handleClearFilters = () => {
    setPatientNameFilter('');
    setPatientShortIdFilter('');
    setDiagnosisFilter('');
    setDateFromFilter('');
    setDateToFilter('');
    fetchPrescriptions(); 
  };

  const handleLogout = (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    navigate('/');
  };

  // Helper function to render prescription list content
  const renderPrescriptionList = () => {
    if (prescriptionsLoading) {
      return (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">Loading prescriptions...</p>
        </div>
      );
    }

    if (prescriptionsError) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{prescriptionsError}</AlertDescription>
        </Alert>
      );
    }

    if (prescriptions.length === 0) {
      return (
        <div className="text-center py-10">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-2 text-sm font-medium text-muted-foreground">No prescriptions found matching your criteria.</p>
          <p className="mt-1 text-xs text-muted-foreground">Try adjusting your filters or create a new prescription.</p>
        </div>
      );
    }

    return (
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead className="hidden md:table-cell">Patient ID</TableHead>
              <TableHead>Diagnosis</TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => { setSortBy('date'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                  Date
                  {sortBy === 'date' && <ArrowUpDown className="ml-2 h-3 w-3" />}
                </Button>
              </TableHead>
              <TableHead className="hidden lg:table-cell">Medications</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prescriptions.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="font-medium">{p.patient?.name || 'N/A'}</div>
                  <div className="text-xs text-muted-foreground hidden sm:block">
                    Age: {p.patient?.age || 'N/A'}, Gender: {p.patient?.gender || 'N/A'}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell font-mono text-xs">{p.patient?.shortId || 'N/A'}</TableCell>
                <TableCell>{p.diagnosis}</TableCell>
                <TableCell>{formatDate(p.date)}</TableCell>
                <TableCell className="hidden lg:table-cell text-xs">{p.medications.length} item(s)</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => navigate(`/view-prescriptions?id=${p.id}`)} title="View Details">
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
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
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-10">
      {/* Profile Overview */}
      <Card className="border-primary/20 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="space-y-1.5">
              <CardTitle className="text-2xl lg:text-3xl font-bold tracking-tight">Welcome, Dr. {doctor.name}!</CardTitle>
              <CardDescription>Manage your patients and prescriptions efficiently.</CardDescription>
            </div>
            <Badge variant="secondary" className="font-mono text-sm py-1 px-3">
              ID: {doctor.shortId}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-border/30 shadow-xs">
              <CardHeader className="py-3 px-4 border-b">
                <CardTitle className="text-base font-semibold">Professional Details</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center text-sm space-x-2">
                  <GraduationCap className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">Specialization:</span>
                  <span>{doctor.specialization}</span>
                </div>
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
            <Card className="border-border/30 shadow-xs">
              <CardHeader className="py-3 px-4 border-b">
                <CardTitle className="text-base font-semibold">Contact Details</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start text-sm space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span>{doctor.phoneNumber}</span>
                </div>
                 <div className="flex items-start text-sm space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span>{doctor.email}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/create-prescription" className="group">
            <Card className="hover:shadow-lg transition-shadow duration-200 hover:border-primary/40 border-border/30">
              <CardContent className="p-5 flex flex-col items-center justify-center space-y-2 text-center min-h-[150px]">
                <div className="p-3 rounded-full bg-primary/10 text-primary ring-1 ring-primary/20 group-hover:ring-primary/40 transition-all duration-200">
                  <FilePlus className="h-5 w-5" />
                </div>
                <span className="font-semibold text-base">Create Prescription</span>
                <p className="text-xs text-muted-foreground">Write a new e-prescription</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/view-prescriptions" className="group">
            <Card className="hover:shadow-lg transition-shadow duration-200 hover:border-primary/40 border-border/30">
              <CardContent className="p-5 flex flex-col items-center justify-center space-y-2 text-center min-h-[150px]">
                <div className="p-3 rounded-full bg-primary/10 text-primary ring-1 ring-primary/20 group-hover:ring-primary/40 transition-all duration-200">
                  <FileText className="h-5 w-5" />
                </div>
                <span className="font-semibold text-base">View Prescriptions</span>
                <p className="text-xs text-muted-foreground">Access created prescriptions</p>
              </CardContent>
            </Card>
          </Link>
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

      {/* Prescription Management Section */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Manage Prescriptions</CardTitle>
          <CardDescription>Filter, sort, and view prescriptions you have created.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filter and Sort Controls */}
          <form onSubmit={handleApplyFilters} className="space-y-4 p-4 border rounded-md bg-muted/50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="patientNameFilter">Patient Name</Label>
                <Input id="patientNameFilter" value={patientNameFilter} onChange={(e) => setPatientNameFilter(e.target.value)} placeholder="e.g., John Doe" />
              </div>
              <div>
                <Label htmlFor="patientShortIdFilter">Patient ID</Label>
                <Input id="patientShortIdFilter" value={patientShortIdFilter} onChange={(e) => setPatientShortIdFilter(e.target.value)} placeholder="e.g., P123XYZ" />
              </div>
              <div>
                <Label htmlFor="diagnosisFilter">Diagnosis</Label>
                <Input id="diagnosisFilter" value={diagnosisFilter} onChange={(e) => setDiagnosisFilter(e.target.value)} placeholder="e.g., Hypertension" />
              </div>
              <div>
                <Label htmlFor="dateFromFilter">Date From</Label>
                <Input id="dateFromFilter" type="date" value={dateFromFilter} onChange={(e) => setDateFromFilter(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="dateToFilter">Date To</Label>
                <Input id="dateToFilter" type="date" value={dateToFilter} onChange={(e) => setDateToFilter(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
              <div>
                <Label htmlFor="sortBy">Sort By</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger id="sortBy">
                    <SelectValue placeholder="Select sort field" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="patientName">Patient Name</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="sortOrder">Order</Label>
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger id="sortOrder">
                    <SelectValue placeholder="Select sort order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Descending</SelectItem>
                    <SelectItem value="asc">Ascending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex space-x-2 items-end h-full">
                <Button type="submit" className="w-full md:w-auto">
                  <Filter className="mr-2 h-4 w-4" /> Apply Filters
                </Button>
                <Button type="button" variant="outline" onClick={handleClearFilters} className="w-full md:w-auto">
                  <XCircle className="mr-2 h-4 w-4" /> Clear
                </Button>
              </div>
            </div>
          </form>

          {/* Prescriptions List */}
          {renderPrescriptionList()}
        </CardContent>
      </Card>

      {/* Quick Tips */}
      <Card className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 shadow-sm">
        <CardHeader className="flex flex-row items-center space-x-2 pb-3 pt-4 px-5">
          <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <CardTitle className="text-lg text-blue-800 dark:text-blue-200">Quick Tips</CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-4">
          <ul className="ml-6 space-y-1.5 text-sm text-blue-700 dark:text-blue-300 list-disc">
            <li>Use the filters above to narrow down the prescription list.</li>
            <li>Click on table headers like 'Date' to sort the prescriptions.</li>
            <li>Ensure medication dosages and frequencies are clearly specified when creating new prescriptions.</li>
          </ul>
        </CardContent>
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

export default DoctorDashboard;
