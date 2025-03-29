import { FC, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, Trash2, Loader2 } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { prescriptionService } from "../services/api";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define frequency options
const FREQUENCY_OPTIONS = [
  { value: "once_daily", label: "Once Daily" },
  { value: "twice_daily", label: "Twice Daily" },
  { value: "thrice_daily", label: "Three Times Daily" },
  { value: "four_times_daily", label: "Four Times Daily" },
  { value: "every_morning", label: "Every Morning" },
  { value: "every_night", label: "Every Night" },
  { value: "as_needed", label: "As Needed" },
] as const;

// Define Zod schema for a single medication
const medicationSchema = z.object({
  name: z.string().min(1, { message: "Medicine name is required." }),
  dosage: z.string().min(1, { message: "Dosage is required." }),
  frequency: z.string().min(1, { message: "Frequency is required." }),
  duration: z.string().min(1, { message: "Duration is required." })
    .regex(/^\d+\s*(day|days|week|weeks|month|months)$/i, {
      message: "Duration must be in format: number + unit (e.g., '7 days', '2 weeks')",
    }),
});

// Define Zod schema for the entire form
const formSchema = z.object({
  patientId: z.string().min(1, { message: "Patient ID is required." }), // Assuming Patient ID is a string
  diagnosis: z.string().min(5, { message: "Diagnosis is required (min 5 chars)." }),
  medications: z.array(medicationSchema).min(1, { message: "At least one medication is required." }),
  notes: z.string().optional(),
});

// Infer the type from the schema
type PrescriptionFormValues = z.infer<typeof formSchema>;

const CreatePrescription: FC = () => {
  const navigate = useNavigate();

  // Initialize the form using react-hook-form
  const form = useForm<PrescriptionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientId: "",
      diagnosis: "",
      medications: [{ name: "", dosage: "", frequency: "", duration: "" }], // Start with one medication row
      notes: "",
    },
  });

  // useFieldArray for dynamic medication fields
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "medications",
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Define the submit handler
  const onSubmit = async (values: PrescriptionFormValues): Promise<void> => {
    setError(null);
    setSuccess(false);
    
    try {
      const token = localStorage.getItem('token');
      if (!token || localStorage.getItem('userType') !== 'doctor') {
        setError("Authentication required. Please log in again.");
        setTimeout(() => navigate('/doctor/login'), 2000);
        return;
      }

      await prescriptionService.createPrescription(values, token);
      setSuccess(true);
      setTimeout(() => navigate('/view-prescriptions'), 1500);
    } catch (error) {
      console.error("Error creating prescription:", error);
      setError(error instanceof Error ? error.message : "Failed to create prescription. Please try again.");
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card className="w-full max-w-3xl mx-auto shadow-lg border-border/40">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-bold tracking-tight">Create New Prescription</CardTitle>
          <CardDescription className="text-muted-foreground">
            Fill in the details below for the patient's prescription.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert className="bg-green-50 text-green-700 border-green-200">
                  <AlertDescription>
                    Prescription created successfully! Redirecting...
                  </AlertDescription>
                </Alert>
              )}
              {/* Patient ID and Diagnosis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="patientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Patient ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter patient identifier" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="diagnosis"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Diagnosis</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe the diagnosis" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Medications Array */}
              <div className="space-y-4">
                <FormLabel>Medications</FormLabel>
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-start border p-3 rounded-md relative">
                    <FormField
                      control={form.control}
                      name={`medications.${index}.name`}
                      render={({ field: medField }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel className="sr-only">Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Medicine Name" {...medField} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`medications.${index}.dosage`}
                      render={({ field: medField }) => (
                        <FormItem>
                          <FormLabel className="sr-only">Dosage</FormLabel>
                          <FormControl>
                            <Input placeholder="Dosage" {...medField} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`medications.${index}.frequency`}
                      render={({ field: medField }) => (
                        <FormItem>
                          <FormLabel className="sr-only">Frequency</FormLabel>
                          <Select
                            onValueChange={medField.onChange}
                            defaultValue={medField.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select frequency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {FREQUENCY_OPTIONS.map((option) => (
                                <SelectItem 
                                  key={option.value} 
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`medications.${index}.duration`}
                      render={({ field: medField }) => (
                        <FormItem>
                          <FormLabel className="sr-only">Duration</FormLabel>
                          <FormControl>
                            <Input placeholder="Duration" {...medField} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 sm:static sm:col-span-1 self-center hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove Medication</span>
                      </Button>
                    )}
                  </div>
                ))}
                 <Button
                   type="button"
                   variant="outline"
                   size="sm"
                   className="mt-2"
                   onClick={() => append({ name: "", dosage: "", frequency: "", duration: "" })}
                 >
                   <PlusCircle className="mr-2 h-4 w-4" />
                   Add Medication
                 </Button>
                 {/* Display error if medication array is empty on submit */}
                 {form.formState.errors.medications?.root?.message && (
                    <p className="text-sm font-medium text-destructive">{form.formState.errors.medications.root.message}</p>
                 )}
              </div>

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional instructions or notes..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-between space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={form.formState.isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="min-w-[150px]"
                disabled={form.formState.isSubmitting || success}
              >
                {(() => {
                  if (form.formState.isSubmitting) {
                    return (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    );
                  }
                  if (success) {
                    return "Created!";
                  }
                  return "Submit Prescription";
                })()}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
};

export default CreatePrescription;
