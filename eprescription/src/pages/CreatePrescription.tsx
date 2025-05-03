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

  // Define the type for a medication search result based on the updated API
  interface MedicationSearchResult {
    id: string;
    productName: string;
    saltComposition: string;
    manufacturer: string;
  }
  
  // State for medication search results and loading status for each row
  const [medicationSearchResults, setMedicationSearchResults] = useState<Record<number, MedicationSearchResult[]>>({}); // Updated type
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
        // Assuming medicationService.searchMedications now returns { medications: MedicationSearchResult[] }
        const response = await medicationService.searchMedications(query, token); 
        // Ensure the response structure matches expectations
        const results: MedicationSearchResult[] = response.medications || []; 
        setMedicationSearchResults(prev => ({ ...prev, [index]: results }));
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
    <div className="container mx-auto p-4 md:p-6 lg:p-8"> {/* Consistent padding */}
      <Card className="w-full max-w-4xl mx-auto shadow-lg border-border/40"> {/* Increased max-width */}
        <CardHeader className="border-b pb-4"> {/* Added border */}
          <CardTitle className="text-2xl font-bold tracking-tight">Create New Prescription</CardTitle>
          <CardDescription className="text-muted-foreground pt-1"> {/* Added padding */}
            Fill in the patient details and add medications below.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="p-6 space-y-8"> {/* Adjusted padding and spacing */}
              {/* Combined Alerts */}
              {(error || success) && (
                <Alert variant={error ? "destructive" : "default"} className={success ? "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700 text-green-800 dark:text-green-200" : ""}>
                  <AlertDescription>{error || "Prescription created successfully! Redirecting..."}</AlertDescription>
                </Alert>
              )}
              
              {/* Patient ID and Diagnosis Section */}
              <div className="space-y-4">
                 <h3 className="text-lg font-medium border-b pb-2">Patient Information</h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                    <FormField
                      control={form.control}
                      name="patientShortId"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Patient Short ID*</FormLabel>
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
                              aria-label="Search Patient"
                            >
                              {isSearching ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Search className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          {/* Combined Lookup Status */}
                          {(patientName || lookupError) && (
                            <p className={`text-sm mt-1 ${patientName ? 'text-green-600' : 'text-destructive'}`}>
                              {patientName ? `Found: ${patientName}` : lookupError}
                            </p>
                          )}
                          <FormMessage /> {/* Shows Zod validation errors */}
                        </FormItem>
                      )}
                    />
                    {/* Diagnosis field moved here */}
                    <FormField
                      control={form.control}
                      name="diagnosis"
                      render={({ field }) => (
                        <FormItem className="md:col-span-3"> {/* Span full width */}
                          <FormLabel>Diagnosis*</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Describe the diagnosis (e.g., Viral Fever, Hypertension)" {...field} rows={2} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                 </div>
              </div>

              {/* Medications Array Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">Medications*</h3>
                <div className="space-y-4"> {/* Wrapper for medication rows */}
                  {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-12 gap-x-3 gap-y-2 items-start bg-muted/30 dark:bg-muted/10 p-4 rounded-md border relative">
                      {/* Medication Name - Adjusted grid span */}
                      <FormField
                        control={form.control}
                        name={`medications.${index}.name`}
                        render={({ field: medField }) => (
                          <FormItem className="col-span-12 sm:col-span-6 md:col-span-4 flex flex-col">
                            <FormLabel className="mb-1 text-xs font-medium">Name*</FormLabel>
                            <Popover open={popoverOpen[index]} onOpenChange={(isOpen) => setPopoverOpen(prev => ({ ...prev, [index]: isOpen }))}>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={popoverOpen[index]}
                                    className="w-full justify-between font-normal bg-background text-left h-auto min-h-10" // Ensure background, allow wrapping
                                  >
                                    {medField.value
                                      ? // Find the selected medication in the results (if available) or just show the value
                                        medicationSearchResults[index]?.find(
                                          (med) => med.productName === medField.value // Match by productName
                                        )?.productName ?? medField.value 
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
                                      // Update form field as user types for immediate validation feedback
                                      medField.onChange(search); 
                                    }}
                                  />
                                  <CommandList>
                                    {medicationSearchLoading[index] && <CommandItem disabled>Loading...</CommandItem>}
                                    <CommandEmpty>
                                      {medicationSearchQuery[index]?.length >= 2 ? 'No medicine found.' : 'Type at least 2 characters.'}
                                    </CommandEmpty>
                                    <CommandGroup heading="Search Results">
                                      {medicationSearchResults[index]?.map((med) => (
                                        <CommandItem
                                          key={med.id}
                                          value={med.productName} // Use productName for Command's internal value handling
                                          onSelect={(currentValue) => {
                                            // When an item is selected from the list
                                            form.setValue(`medications.${index}.name`, currentValue); // Set the form value to productName
                                            setMedicationSearchQuery(prev => ({ ...prev, [index]: currentValue })); // Update display query
                                            setPopoverOpen(prev => ({ ...prev, [index]: false })); // Close popover
                                          }}
                                          className="flex flex-col items-start px-2 py-1.5" // Allow multi-line display
                                        >
                                          <div className="flex items-center w-full">
                                            <Check
                                              className={`mr-2 h-4 w-4 shrink-0 ${ // Ensure Check icon doesn't prevent wrapping
                                                medField.value === med.productName ? "opacity-100" : "opacity-0"
                                              }`}
                                            />
                                            <span className="font-medium flex-grow">{med.productName}</span> {/* Brand Name */}
                                          </div>
                                          {/* Add salt composition and manufacturer below */}
                                          <div className="ml-6 text-xs text-muted-foreground"> 
                                            {med.saltComposition} ({med.manufacturer})
                                          </div>
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
                      {/* Dosage - Adjusted grid span */}
                      <FormField
                        control={form.control}
                        name={`medications.${index}.dosage`}
                        render={({ field: medField }) => (
                          <FormItem className="col-span-6 sm:col-span-3 md:col-span-2">
                            <FormLabel className="mb-1 text-xs font-medium">Dosage*</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., 500mg" {...medField} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {/* Frequency - Adjusted grid span */}
                      <FormField
                        control={form.control}
                        name={`medications.${index}.frequency`}
                        render={({ field: medField }) => (
                          <FormItem className="col-span-6 sm:col-span-3 md:col-span-2">
                            <FormLabel className="mb-1 text-xs font-medium">Frequency*</FormLabel>
                            <Select
                              onValueChange={medField.onChange}
                              defaultValue={medField.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select" />
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
                      {/* Duration - Adjusted grid span */}
                      <FormField
                        control={form.control}
                        name={`medications.${index}.duration`}
                        render={({ field: medField }) => (
                          <FormItem className="col-span-9 sm:col-span-4 md:col-span-3">
                            <FormLabel className="mb-1 text-xs font-medium">Duration*</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., 7 days" {...medField} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {/* Remove Button - Adjusted grid span and positioning */}
                      {fields.length > 1 && (
                        <div className="col-span-3 sm:col-span-1 flex items-end pb-1"> {/* Align button to bottom */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive h-9 w-9"
                            onClick={() => remove(index)}
                            aria-label="Remove Medication"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                 <Button
                   type="button"
                   variant="outline"
                   size="sm"
                   className="mt-4" // Add margin top
                   onClick={() => append({ name: "", dosage: "", frequency: "", duration: "" })}
                 >
                   <PlusCircle className="mr-2 h-4 w-4" />
                   Add Medication Row
                 </Button>
                 {/* Display root error for medications array */}
                 {form.formState.errors.medications?.root?.message && (
                    <p className="text-sm font-medium text-destructive pt-2">{form.formState.errors.medications.root.message}</p>
                 )}
              </div>

              {/* Notes Section */}
              <div className="space-y-2">
                 <h3 className="text-lg font-medium border-b pb-2">Additional Notes</h3>
                 <FormField
                   control={form.control}
                   name="notes"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel className="sr-only">Additional Notes (Optional)</FormLabel>
                       <FormControl>
                         <Textarea
                           placeholder="e.g., Advice, next follow-up date..."
                           className="resize-y min-h-[80px]" // Allow vertical resize
                           {...field}
                         />
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-3 border-t pt-6"> {/* Adjusted padding and alignment */}
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
