declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      PORT: string;
      MONGO_URI: string;
      JWT_SECRET: string;
      JWT_EXPIRY: string;
    }
  }
}

// This export is needed to make TypeScript recognize this as a module
export {};