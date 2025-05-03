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
import { authService } from "../services/api";

// Define the validation schema using Zod
const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  specialization: z.string().min(2, { message: "Specialization is required." }),
  phoneNumber: z.string().min(10, { message: "Phone number must be at least 10 digits." }), // Basic validation
  licenseNumber: z.string().min(5, { message: "License number is required (min 5 chars)." }), // Basic validation
  hospitalAffiliation: z.string().optional(), // Optional field
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

// Infer the type from the schema
type SignupFormValues = z.infer<typeof formSchema>;

const DoctorSignup: FC = () => {
  const navigate = useNavigate();
  const [signupError, setSignupError] = useState<string | null>(null); // State for signup error

  // Initialize the form
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      specialization: "",
      phoneNumber: "",
      licenseNumber: "",
      hospitalAffiliation: "",
      password: "",
    },
  });

  // Define the submit handler
  const onSubmit = async (values: SignupFormValues): Promise<void> => {
    setSignupError(null); // Clear previous errors
    try {
      const response = await authService.doctorSignup(values); 

      localStorage.setItem('token', response.token);
      localStorage.setItem('userType', 'doctor');

      // No alert needed, navigate directly
      navigate("/doctor-dashboard"); 
    } catch (error) {
      console.error("Signup Error:", error);
      const errorMessage = error instanceof Error ? error.message : "Signup failed. Please check your information or try a different email.";
      setSignupError(errorMessage); // Set the error state
    }
  };

  return (
    // Use background from App.tsx, add padding top/bottom
    <div className="flex justify-center items-center min-h-screen p-4 pt-16 pb-8"> 
      <Card className="w-full max-w-lg shadow-md"> {/* Consistent styling */}
        <CardHeader className="text-center"> {/* Center align header */}
          <CardTitle className="text-2xl">Create Doctor Account</CardTitle>
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
                        <Input placeholder="Dr. John Doe" {...field} />
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
                        <Input type="email" placeholder="doctor@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="specialization"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specialization</FormLabel>
                      <FormControl>
                        <Input placeholder="Cardiology" {...field} />
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
                  name="licenseNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>License Number</FormLabel>
                      <FormControl>
                        <Input placeholder="ABC12345" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hospitalAffiliation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hospital Affiliation (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="General Hospital" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2"> {/* Span across columns */}
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Choose a strong password" {...field} />
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
                <Link to="/doctor/login" className="underline text-primary hover:text-primary/80">
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

export default DoctorSignup;
