import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar'; // Assuming Navbar is in the same directory

const Layout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        {/* Outlet renders the matched child route component */}
        <Outlet /> 
      </main>
      {/* Optional: Add a footer here if needed later */}
      {/* <footer className="bg-muted text-muted-foreground text-center p-4 text-sm">
        © {new Date().getFullYear()} E-Prescription App
      </footer> */}
    </div>
  );
};

export default Layout;
