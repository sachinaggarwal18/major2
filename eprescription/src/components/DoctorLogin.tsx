import { FC, useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // Added Link
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, AlertCircle } from "lucide-react"; // Added Loader2, AlertCircle

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Added AlertTitle
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
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }), // Min 1 for presence check
});

// Infer the type from the schema
type LoginFormValues = z.infer<typeof formSchema>;

const DoctorLogin: FC = () => {
  const navigate = useNavigate();
  const [loginError, setLoginError] = useState<string | null>(null); // Renamed state

  // Initialize the form
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Define the submit handler
  const onSubmit = async (values: LoginFormValues): Promise<void> => {
    setLoginError(null); // Clear previous errors
    try {
      const response = await authService.doctorLogin(values);
      localStorage.setItem('token', response.token);
      localStorage.setItem('userType', 'doctor');
      navigate("/doctor-dashboard");
    } catch (error) {
      console.error("Login Error:", error);
      const errorMessage = error instanceof Error ? error.message : "Login failed. Please check your credentials.";
      setLoginError(errorMessage); // Set the error state
    }
  };

  return (
    // Use background from App.tsx, add padding top/bottom
    <div className="flex justify-center items-center min-h-screen p-4 pt-16 pb-8"> 
      <Card className="w-full max-w-sm shadow-md"> {/* Consistent max-width */}
        <CardHeader className="text-center"> {/* Center align header */}
          <CardTitle className="text-2xl">Doctor Login</CardTitle>
          <CardDescription>Welcome back! Please enter your details.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4"> {/* Consistent spacing */}
              {/* Display Login Error using loginError state */}
              {loginError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Login Failed</AlertTitle>
                  <AlertDescription>{loginError}</AlertDescription>
                </Alert>
              )}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="doctor@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="******" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex flex-col gap-4"> {/* Consistent gap */}
              <Button 
                type="submit" 
                className="w-full" 
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  <>
                    {/* Use Loader2 icon */}
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                {/* Use Link component */}
                <Link to="/doctor/signup" className="underline text-primary hover:text-primary/80">
                  Sign up
                </Link>
              </p>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
};

export default DoctorLogin;
