import { FC, useState, useEffect, useCallback } from "react"; // Added useEffect, useCallback
import { useNavigate } from "react-router-dom";
import { useForm, useFieldArray, useWatch } from "react-hook-form"; // Added useWatch
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, Trash2, Loader2, Search, Check, ChevronsUpDown } from "lucide-react"; // Added Check, ChevronsUpDown

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
// Import Command components from shadcn/ui
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
// Import medicationService
import { prescriptionService, patientService, medicationService } from "../services/api"; 

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
  patientShortId: z.string()
    .min(1, { message: "Patient Short ID is required." })
    .regex(/^PAT-[A-Z0-9_]{8}$/, { message: "Invalid Patient ID format. Should be like 'PAT-XXXXXXXX' (letters, numbers, underscore allowed)." }), // Allow underscore
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
      patientShortId: "",
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
  const [patientName, setPatientName] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  
  // State for medication search results and loading status for each row
  const [medicationSearchResults, setMedicationSearchResults] = useState<Record<number, { id: string; name: string }[]>>({});
  const [medicationSearchLoading, setMedicationSearchLoading] = useState<Record<number, boolean>>({});
  const [medicationSearchQuery, setMedicationSearchQuery] = useState<Record<number, string>>({});
  const [popoverOpen, setPopoverOpen] = useState<Record<number, boolean>>({}); // Track popover state per row

  // Debounce function
  const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
    return (...args: Parameters<F>): Promise<ReturnType<F>> =>
      new Promise(resolve => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
  
        timeoutId = setTimeout(() => resolve(func(...args)), waitFor);
      });
  };

  // Debounced medication search function
  const debouncedMedicationSearch = useCallback(
    debounce(async (query: string, index: number, token: string) => {
      if (query.length < 2) {
        setMedicationSearchResults(prev => ({ ...prev, [index]: [] }));
        return;
      }
      setMedicationSearchLoading(prev => ({ ...prev, [index]: true }));
      try {
        const response = await medicationService.searchMedications(query, token);
        setMedicationSearchResults(prev => ({ ...prev, [index]: response.medications || [] }));
      } catch (error) {
        console.error(`Error searching medication for index ${index}:`, error);
        setMedicationSearchResults(prev => ({ ...prev, [index]: [] })); // Clear results on error
      } finally {
        setMedicationSearchLoading(prev => ({ ...prev, [index]: false }));
      }
    }, 300), // 300ms debounce delay
    []
  );

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

  // Handle patient lookup by shortId
  const handlePatientLookup = async () => {
    const shortId = form.getValues("patientShortId");
    if (!shortId || !/^PAT-[A-Z0-9]{8}$/.test(shortId)) {
      form.setError("patientShortId", { 
        type: "manual", 
        message: "Please enter a valid Patient ID (e.g., PAT-XXXXXXXX)." 
      });
      setPatientName(null);
      setLookupError(null);
      return;
    }

    setIsSearching(true);
    setPatientName(null);
    setLookupError(null);
    setError(null); // Clear main form error

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLookupError("Authentication required.");
        return;
      }
      
      const response = await patientService.findByShortId(shortId, token);
      if (response.patient) {
        setPatientName(response.patient.name);
        form.clearErrors("patientShortId"); // Clear error if found
      } else {
        setLookupError("Patient not found.");
        form.setError("patientShortId", { type: "manual", message: "Patient not found." });
      }
    } catch (err) {
      console.error("Patient lookup error:", err);
      const apiError = err as { message?: string };
      setLookupError(apiError.message ?? "Failed to find patient.");
      form.setError("patientShortId", { type: "manual", message: apiError.message ?? "Lookup failed." });
    } finally {
      setIsSearching(false);
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
                  name="patientShortId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Patient Short ID</FormLabel>
                      <div className="flex items-center space-x-2">
                        <FormControl>
                          <Input 
                            placeholder="Enter Patient ID (e.g., PAT-ABC123XY)" 
                            {...field} 
                            className="flex-grow"
                          />
                        </FormControl>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="icon" 
                          onClick={handlePatientLookup}
                          disabled={isSearching}
                        >
                          {isSearching ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Search className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      {patientName && !lookupError && (
                        <p className="text-sm text-green-600 mt-1">
                          Found: {patientName}
                        </p>
                      )}
                      {lookupError && (
                        <p className="text-sm text-destructive mt-1">
                          {lookupError}
                        </p>
                      )}
                      <FormMessage /> {/* Shows Zod validation errors */}
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
                        <FormItem className="sm:col-span-2 flex flex-col">
                          <FormLabel className="sr-only">Name</FormLabel>
                          <Popover open={popoverOpen[index]} onOpenChange={(isOpen) => setPopoverOpen(prev => ({ ...prev, [index]: isOpen }))}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={popoverOpen[index]}
                                  className="w-full justify-between font-normal"
                                >
                                  {medField.value
                                    ? medicationSearchResults[index]?.find(
                                        (med) => med.name === medField.value
                                      )?.name ?? medField.value // Show selected value or typed value
                                    : "Select or type medicine..."}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
                              <Command shouldFilter={false}> {/* Disable default filtering */}
                                <CommandInput
                                  placeholder="Search medicine..."
                                  value={medicationSearchQuery[index] || ''}
                                  onValueChange={(search) => {
                                    setMedicationSearchQuery(prev => ({ ...prev, [index]: search }));
                                    const token = localStorage.getItem('token');
                                    if (token) {
                                      debouncedMedicationSearch(search, index, token);
                                    }
                                    // Also update the form field value as user types if needed, or only on select
                                    // medField.onChange(search); // Optional: update form value while typing
                                  }}
                                />
                                <CommandList>
                                  {medicationSearchLoading[index] && <CommandItem disabled>Loading...</CommandItem>}
                                  <CommandEmpty>
                                    {medicationSearchQuery[index]?.length >= 2 ? 'No medicine found.' : 'Type at least 2 characters.'}
                                  </CommandEmpty>
                                  <CommandGroup>
                                    {medicationSearchResults[index]?.map((med) => (
                                      <CommandItem
                                        key={med.id}
                                        value={med.name} // Use name for Command's internal value handling
                                        onSelect={(currentValue) => {
                                          // When an item is selected from the list
                                          form.setValue(`medications.${index}.name`, currentValue === medField.value ? "" : currentValue); // Set the form value
                                          setMedicationSearchQuery(prev => ({ ...prev, [index]: currentValue })); // Update display query
                                          setPopoverOpen(prev => ({ ...prev, [index]: false })); // Close popover
                                        }}
                                      >
                                        <Check
                                          className={`mr-2 h-4 w-4 ${
                                            medField.value === med.name ? "opacity-100" : "opacity-0"
                                          }`}
                                        />
                                        {med.name}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
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
