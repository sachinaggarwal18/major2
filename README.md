# E-Prescription Application

A full-stack application designed for managing electronic prescriptions securely and efficiently in the Indian context. This project features a robust backend API and a modern frontend user interface.

## Features

* **Secure Authentication:** Separate login/signup for Doctors and Patients using JWT and Argon2 hashing.
* **Prescription Management:** Doctors can create, view, and manage electronic prescriptions.
* **Patient Dashboard:** Patients can view their prescriptions.
* **Medication Database:** Includes functionality related to medication data (inferred from backend routes).
* **PDF Generation:** Prescriptions can be generated as PDF documents (inferred from frontend components).
* **Structured Logging:** Comprehensive backend logging using Pino for monitoring and debugging.
* **RESTful API:** Well-defined API endpoints for interaction between frontend and backend.

## Tech Stack

**Backend:**

* Runtime: Node.js (>=18.0.0)
* Framework: Express.js
* Language: TypeScript
* ORM: Prisma
* Database: PostgreSQL (Implicitly required by Prisma)
* Authentication: JWT, Argon2
* Logging: Pino
* Validation: express-validator
* File Uploads: Multer

**Frontend:**

* Framework: React
* Build Tool: Vite
* Language: TypeScript
* Styling: Tailwind CSS, CSS Modules
* UI Components: Shadcn UI
* Routing: React Router DOM
* State Management: React Hooks/Context (Implicit)
* HTTP Client: Axios
* Form Handling: React Hook Form, Zod

## Project Structure

This project is organized as a monorepo:

```file_structure
.
├── backend/         # Node.js/Express backend application
├── eprescription/   # React/Vite frontend application
└── README.md        # This file
```

## Prerequisites

* Node.js (v18.0.0 or higher)
* npm (usually comes with Node.js)
* PostgreSQL Database Server

## Getting Started

Follow these steps to set up and run the project locally:

1. **Clone the repository:**

    ```bash
    git clone <your-repository-url>
    cd <repository-directory>
    ```

2. **Set up the Backend:**

    ```bash
    cd backend

    # Install dependencies
    npm install

    # Set up environment variables
    # Create a .env file based on .env.example and fill in your database URL, JWT secret, etc.
    cp .env.example .env

    # Apply database migrations
    # Ensure your PostgreSQL server is running and the database exists
    npx prisma migrate dev

    # (Optional) Seed the database with initial data
    npx prisma db seed

    # Start the backend development server
    npm run dev
    ```

    The backend server will typically run on `http://localhost:3000` (or the port specified in your `.env`).

3. **Set up the Frontend:**

    ```bash
    # Navigate back to the root and into the frontend directory
    cd ../eprescription

    # Install dependencies
    npm install

    # Start the frontend development server
    npm run dev
    ```

    The frontend development server will typically run on `http://localhost:5173` (or another available port).

4. **Access the Application:**
    Open your browser and navigate to the frontend development server URL (e.g., `http://localhost:5173`).

## Available Scripts

### Backend (`cd backend`)

* `npm run dev`: Starts the backend development server with hot-reloading (`tsx`).
* `npm run build`: Compiles TypeScript code to JavaScript.
* `npm run start`: Starts the compiled backend application (for production).
* `npm run lint`: Lints the backend codebase using ESLint.
* `npm run test`: Runs backend tests using Jest.
* `npm run clean`: Removes build artifacts (`dist`) and log files.
* `npx prisma migrate dev`: Applies database migrations.
* `npx prisma db seed`: Seeds the database.

### Frontend (`cd eprescription`)

* `npm run dev`: Starts the frontend development server using Vite.
* `npm run build`: Builds the frontend application for production.
* `npm run lint`: Lints the frontend codebase using ESLint.
* `npm run preview`: Serves the production build locally for preview.

## Backend Logging System

The backend utilizes Pino for structured logging. Key features include:

* **Levels:** TRACE, DEBUG, INFO, WARN, ERROR, FATAL
* **Environments:** Pretty-printing in development, JSON logging with rotation in production.
* **Context:** Request ID tracking, response time monitoring, user context.
* **Security:** Sensitive data redaction.
* **Directories:** Logs are stored in the `backend/logs/` directory, separated by type (app, access, error).

Refer to `backend/README.md` for more detailed information on the logging system.
