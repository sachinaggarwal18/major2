import { FC, useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Download, Loader2, AlertCircle } from 'lucide-react';
import { Prescription, Doctor, Patient } from '../types/models';

interface PrescriptionPDFProps {
  prescription: Prescription;
}

export const PrescriptionPDF: FC<PrescriptionPDFProps> = ({ prescription }) => {
  const prescriptionRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const generatePDF = async () => {
    setIsGenerating(true);
    if (!prescriptionRef.current) {
      setError('Could not find prescription content');
      return;
    }

    try {
      // Create canvas from the prescription div
      const canvas = await html2canvas(prescriptionRef.current, {
        scale: 2, // Higher scale for better quality
        logging: false,
        useCORS: true
      });

      // Calculate dimensions (A4 size)
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Create PDF with standard fonts
      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.setFont("helvetica"); // Set default font
      
      // Handle multi-page content
      let heightLeft = imgHeight;
      let position = 0;
      
      // First page
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // Add new pages if content exceeds page height
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Generate a more descriptive filename
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `prescription-${timestamp}-${prescription.id.substring(0, 8)}.pdf`;
      
      // Save the PDF
      pdf.save(filename);
      
      // Show success message
      setSuccess(true);
      // Clear success message after delay
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string | Date): string => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper to get display name
  const getName = (person: Doctor | Patient | null): string => {
    if (person && typeof person === 'object' && 'name' in person) {
      return person.name;
    }
    return 'N/A';
  };

  // Type guards with field validation
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

  return (
    <div className="space-y-4"> {/* Main container for button, status, and PDF content */}
      {/* Visible UI: Button and Status Messages - Positioned at the top */}
      <div className="flex justify-end items-start space-x-2"> {/* Aligns button/status group to the right */}
        {/* Status Messages container */}
        <div className="flex flex-col items-end space-y-1 mt-1">
          {error && (
            <Alert variant="destructive" className="w-auto text-xs p-2">
              <AlertCircle className="h-3 w-3" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert variant="default" className="border-primary/50 bg-primary/10 w-auto text-xs p-2">
              <div className="flex items-center gap-1">
                <Download className="h-3 w-3 text-primary" />
                <AlertDescription>PDF Downloaded!</AlertDescription>
              </div>
            </Alert>
          )}
        </div>
        {/* Download Button */}
        <Button
          onClick={() => {
            setError(null);
            setSuccess(false);
            generatePDF();
          }}
          variant="outline"
          size="sm"
          className="hover:bg-primary/10 flex-shrink-0" // Prevent button from shrinking
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating PDF...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </>
          )}
        </Button>
      </div>

      {/* The actual content to be converted to PDF */}
      <div className="flex justify-center"> {/* Centering container */}
        <div ref={prescriptionRef} className="p-8 bg-white min-w-[210mm] max-w-[210mm] shadow-sm border rounded-lg"> {/* PDF Content */}
          {/* Header */}
          <div className="text-center mb-6 border-b-2 pb-4">
          <h1 className="text-3xl font-bold mb-2 text-primary">E-Prescription</h1>
          <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
            <p>Generation Date: {formatDate(new Date())}</p>
            <p>Reference ID: {prescription.id.substring(0, 8)}</p>
          </div>
        </div>

        {/* Doctor and Patient Information */}
        <div className="grid grid-cols-2 gap-x-12 gap-y-2 mb-8">
          <div className="col-span-2 md:col-span-1 p-4 border rounded-md bg-muted/10">
            <h3 className="font-semibold mb-3 text-primary/80 border-b pb-1">Doctor Details</h3>
            <div className="space-y-1">
              <p><span className="font-medium">Name:</span> {getName(prescription.doctor)}</p>
              {isDoctor(prescription.doctor) && (
                <>
                  <p><span className="font-medium">Specialization:</span> {prescription.doctor.specialization}</p>
                  <p><span className="font-medium">License:</span> {prescription.doctor.licenseNumber}</p>
                  {prescription.doctor.hospitalAffiliation && (
                    <p><span className="font-medium">Hospital:</span> {prescription.doctor.hospitalAffiliation}</p>
                  )}
                  <p><span className="font-medium">Contact:</span> {prescription.doctor.phoneNumber}</p>
                </>
              )}
            </div>
          </div>
          <div className="col-span-2 md:col-span-1 p-4 border rounded-md bg-muted/10">
            <h3 className="font-semibold mb-3 text-primary/80 border-b pb-1">Patient Details</h3>
            <div className="space-y-1">
              <p><span className="font-medium">Name:</span> {getName(prescription.patient)}</p>
              {isPatient(prescription.patient) && (
                <>
                  <p><span className="font-medium">Age:</span> {prescription.patient.age} years</p>
                  <p><span className="font-medium">Gender:</span> {prescription.patient.gender}</p>
                  <p><span className="font-medium">Contact:</span> {prescription.patient.phoneNumber}</p>
                  {prescription.patient.medicalHistory && (
                    <p><span className="font-medium">Medical History:</span> {prescription.patient.medicalHistory}</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Diagnosis */}
        <div className="mb-8 p-4 border rounded-md bg-muted/5">
          <h3 className="font-semibold mb-3 text-primary/80 border-b pb-1">Diagnosis</h3>
          <p className="whitespace-pre-wrap">{prescription.diagnosis}</p>
        </div>

        {/* Medications */}
        <div className="mb-8">
          <h3 className="font-semibold mb-4 text-primary/80 border-b pb-1">Prescribed Medications</h3>
          <table className="w-full border-collapse bg-white">
            <thead className="bg-muted/50">
              <tr>
                <th className="border p-2 text-left">Name</th>
                <th className="border p-2 text-left">Dosage</th>
                <th className="border p-2 text-left">Frequency</th>
                <th className="border p-2 text-left">Duration</th>
              </tr>
            </thead>
            <tbody>
              {prescription.medications.map((med, index) => (
                <tr key={`${med.name}-${index}`}>
                  <td className="border p-2">{med.name}</td>
                  <td className="border p-2">{med.dosage}</td>
                  <td className="border p-2">{med.frequency}</td>
                  <td className="border p-2">{med.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Notes */}
        {prescription.notes && (
          <div className="mb-8 p-4 border rounded-md bg-muted/5">
            <h3 className="font-semibold mb-3 text-primary/80 border-b pb-1">Additional Notes</h3>
            <p className="whitespace-pre-wrap text-sm">{prescription.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-4 border-t flex justify-between items-end">
          <div>
            <p className="text-xs text-muted-foreground">
              Generated via E-Prescription Manager
            </p>
            <p className="text-xs text-muted-foreground">
              Issue Date: {formatDate(prescription.createdAt)}
            </p>
          </div>
          <div className="text-right">
            <div className="text-right flex flex-col items-end">
              <div className="mb-1 h-[2px] w-40 bg-primary/80"></div>
              <p className="text-sm">Doctor's Signature</p>
              {isDoctor(prescription.doctor) && (
                <>
                  <p className="text-xs font-medium mt-1">{prescription.doctor.name}</p>
                  <p className="text-xs">{prescription.doctor.specialization}</p>
                  <p className="text-xs">License: {prescription.doctor.licenseNumber}</p>
                </>
              )}
            </div>
          </div>
        </div>
        </div> {/* Closing tag for PDF Content */}
      </div> {/* Closing tag for Centering container */}
    </div> // Closing tag for Main container
  );
};

export default PrescriptionPDF;
