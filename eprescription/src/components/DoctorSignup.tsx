import { FC } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

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
  email: z.string().email({ message: "Invalid email address." }),
  specialization: z.string().min(2, { message: "Specialization is required." }),
  phoneNumber: z.string().min(10, { message: "Phone number must be at least 10 digits." }), // Basic validation
  licenseNumber: z.string().min(5, { message: "License number is required." }), // Basic validation
  hospitalAffiliation: z.string().optional(), // Optional field
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

// Infer the type from the schema
type SignupFormValues = z.infer<typeof formSchema>;

const DoctorSignup: FC = () => {
  const navigate = useNavigate();

  // Initialize the form using react-hook-form
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
    try {
      const response = await authService.doctorSignup(values); // Use validated values

      // Store the token in localStorage
      localStorage.setItem('token', response.token);
      localStorage.setItem('userType', 'doctor');

      alert("Doctor registered successfully!"); // Consider using a Toast component later
      navigate("/doctor-dashboard");
    } catch (error) {
      console.error("Signup Error:", error);
      // Display error message using form.setError or a toast notification
      const errorMessage = error instanceof Error ? error.message : "Signup failed. Please check your information.";
      alert(errorMessage); // Replace with better error handling UI
      // Example: form.setError("root", { type: "manual", message: errorMessage });
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <Card className="w-full max-w-lg"> {/* Increased max-width for more fields */}
        <CardHeader>
          <CardTitle>Doctor Signup</CardTitle>
          <CardDescription>Create your account to manage prescriptions.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4"> {/* Grid layout for fields */}
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
                      <Input type="password" placeholder="******" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Signing up..." : "Signup"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
};

export default DoctorSignup;
