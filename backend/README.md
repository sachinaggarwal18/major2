# E-Prescription Backend

A secure and efficient backend for managing electronic prescriptions.

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
cp .env.example .env
```

3. Start the development server:

```bash
npm run dev
```

## Logging System

The application uses Pino for structured logging with the following features:

### Log Levels

- **FATAL** (60): System is unusable
- **ERROR** (50): Error conditions
- **WARN** (40): Warning conditions
- **INFO** (30): Informational messages
- **DEBUG** (20): Debug messages
- **TRACE** (10): Trace messages

### Log Directories

```
logs/
├── app/      # Application logs (info, warn, error)
├── access/   # HTTP access logs
└── error/    # Error-only logs
```

### Features

- Request ID tracking
- Response time monitoring
- Automatic request/response logging
- Database query logging (development)
- Error stack traces (development)
- Log rotation (production)
- Sensitive data redaction
- Structured JSON logging
- Pretty printing in development

### Environment-Specific Behavior

#### Development

- Pretty-printed console output
- Debug-level logging enabled
- Query logging enabled
- Stack traces included
- Detailed error responses

#### Production

- JSON formatted logs
- Info-level logging
- Daily log rotation
- 10MB size limit per file
- Sensitive data redaction
- Minimal error responses

### Examples

Basic logging:

```typescript
logger.info('Server started');
logger.error({ err }, 'Database connection failed');
```

With context:

```typescript
logger.info({ userId, action: 'login' }, 'User logged in');
```

Error handling:

```typescript
try {
  // Operation
} catch (error) {
  logger.error({ 
    err: error,
    context: { resource, operation }
  }, 'Operation failed');
}
```

## API Documentation

[API documentation goes here]
