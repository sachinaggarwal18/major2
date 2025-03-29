import { FC } from "react";
import { Link } from "react-router-dom";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

const Navbar: FC = () => {
  return (
    <div className="w-full border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto">
        <div className="flex justify-between items-center h-16">
          {/* Logo - Left side */}
          <div className="flex-none">
            <Link to="/" className="text-lg font-semibold">
              E-Prescription Manager
            </Link>
          </div>

          {/* Navigation Items - Right side */}
          <NavigationMenu viewport={false}>
            <NavigationMenuList className="flex space-x-2">
              <NavigationMenuItem>
                <Link to="/" className={navigationMenuTriggerStyle()}>
                  Home
                </Link>
              </NavigationMenuItem>

              {/* Doctor Menu */}
              <NavigationMenuItem>
                <NavigationMenuTrigger 
                  className="hover:bg-accent/80 data-[state=open]:bg-accent/80"
                >
                  Doctor
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="w-[200px] gap-3 rounded-md border bg-popover p-4 text-popover-foreground shadow-lg backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
                    <li className="group">
                      <Link
                        to="/doctor/login"
                        className="relative flex select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground group-hover:cursor-pointer"
                      >
                        <div>
                          <p className="font-medium">Login</p>
                          <p className="text-xs text-muted-foreground">Access your doctor account</p>
                        </div>
                      </Link>
                    </li>
                    <li className="mt-2 group">
                      <Link
                        to="/doctor/signup"
                        className="relative flex select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground group-hover:cursor-pointer"
                      >
                        <div>
                          <p className="font-medium">Signup</p>
                          <p className="text-xs text-muted-foreground">Create a new doctor account</p>
                        </div>
                      </Link>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Patient Menu */}
              <NavigationMenuItem>
                <NavigationMenuTrigger
                  className="hover:bg-accent/80 data-[state=open]:bg-accent/80"
                >
                  Patient
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="w-[200px] gap-3 rounded-md border bg-popover p-4 text-popover-foreground shadow-lg backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
                    <li className="group">
                      <Link
                        to="/patient/login"
                        className="relative flex select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground group-hover:cursor-pointer"
                      >
                        <div>
                          <p className="font-medium">Login</p>
                          <p className="text-xs text-muted-foreground">Access your patient account</p>
                        </div>
                      </Link>
                    </li>
                    <li className="mt-2 group">
                      <Link
                        to="/patient/signup"
                        className="relative flex select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground group-hover:cursor-pointer"
                      >
                        <div>
                          <p className="font-medium">Signup</p>
                          <p className="text-xs text-muted-foreground">Create a new patient account</p>
                        </div>
                      </Link>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
