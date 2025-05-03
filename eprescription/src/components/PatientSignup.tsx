import { FC, useState } from "react"; // Added useState
import { Link, useNavigate } from "react-router-dom"; // Added Link
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, AlertCircle } from "lucide-react"; // Added Loader2, AlertCircle

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Added Alert components
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { authService } from "../services/api";

// Define the validation schema using Zod
const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  phoneNumber: z.string().min(10, { message: "Phone number must be at least 10 digits." }), // Basic validation
  age: z.coerce.number().int().positive({ message: "Age must be a positive number." }), // Coerce to number
  gender: z.enum(["Male", "Female", "Other"], { required_error: "Gender is required." }),
  address: z.string().min(5, { message: "Address is required (min 5 chars)." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  medicalHistory: z.string().optional(), // Optional field
});

// Infer the type from the schema
type SignupFormValues = z.infer<typeof formSchema>;

const PatientSignup: FC = () => {
  const navigate = useNavigate();
  const [signupError, setSignupError] = useState<string | null>(null); // State for signup error

  // Initialize the form
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phoneNumber: "",
      age: undefined, 
      gender: undefined, 
      address: "",
      password: "",
      medicalHistory: "",
    },
  });

  // Define the submit handler
  const onSubmit = async (values: SignupFormValues): Promise<void> => {
    setSignupError(null); // Clear previous errors
    try {
      // Ensure age is sent as a number
      const dataToSend = { ...values, age: Number(values.age) };
      const response = await authService.patientSignup(dataToSend); 

      localStorage.setItem('token', response.token);
      localStorage.setItem('userType', 'patient');

      // No alert needed, navigate directly
      navigate("/patient-dashboard"); 
    } catch (error) {
      console.error("Signup Error:", error);
      const errorMessage = error instanceof Error ? error.message : "Signup failed. Please check your information or try a different email.";
      setSignupError(errorMessage); // Set the error state
    }
  };

  return (
    // Use background from App.tsx, add padding top/bottom
    <div className="flex justify-center items-center min-h-screen p-4 pt-16 pb-8"> 
      <Card className="w-full max-w-lg shadow-md"> {/* Adjusted max-width */}
        <CardHeader className="text-center"> {/* Center align header */}
          <CardTitle className="text-2xl">Create Patient Account</CardTitle>
          <CardDescription>Fill in the details below to register.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4"> {/* Changed grid to space-y */}
               {/* Display Signup Error */}
              {signupError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Signup Failed</AlertTitle>
                  <AlertDescription>{signupError}</AlertDescription>
                </Alert>
              )}
              {/* Use grid for form fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> 
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Jane Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="patient@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="9876543210" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="30" {...field} onChange={event => field.onChange(+event.target.value)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St, Anytown" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Choose a strong password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="medicalHistory"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Medical History (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any relevant medical conditions, allergies, etc."
                          className="resize-y min-h-[80px]" // Allow resize
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4"> {/* Use flex-col for button and link */}
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing up...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/patient/login" className="underline text-primary hover:text-primary/80">
                  Log in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
};

export default PatientSignup;
