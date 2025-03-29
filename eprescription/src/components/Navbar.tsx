import { FC } from "react";
import { Link } from "react-router-dom";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

const Navbar: FC = () => {
  return (
    <div className="w-full border-b bg-background">
      <div className="container mx-auto">
        <nav className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="text-lg font-semibold">
            E-Prescription Manager
          </Link>

          {/* Navigation Items */}
          <div className="relative">
            <NavigationMenu>
              <NavigationMenuList className="flex space-x-2">
                <NavigationMenuItem>
                  <Link to="/" className={navigationMenuTriggerStyle()}>
                    Home
                  </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger>Doctor</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="w-[200px] p-2">
                      <li>
                        <Link
                          to="/doctor/login"
                          className="block w-full rounded-md p-2 text-sm hover:bg-accent hover:text-accent-foreground"
                        >
                          Login
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/doctor/signup"
                          className="block w-full rounded-md p-2 text-sm hover:bg-accent hover:text-accent-foreground"
                        >
                          Signup
                        </Link>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger>Patient</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="w-[200px] p-2">
                      <li>
                        <Link
                          to="/patient/login"
                          className="block w-full rounded-md p-2 text-sm hover:bg-accent hover:text-accent-foreground"
                        >
                          Login
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/patient/signup"
                          className="block w-full rounded-md p-2 text-sm hover:bg-accent hover:text-accent-foreground"
                        >
                          Signup
                        </Link>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>

              <NavigationMenuViewport className="origin-top-right" />
            </NavigationMenu>
          </div>
        </nav>
      </div>
    </div>
  );
};

export default Navbar;
