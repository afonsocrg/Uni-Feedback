# Error Handling Guide

All error handling logic is now consolidated in `./errorHandling.ts` for easy maintenance.

## Available Error Classes

```typescript
import { 
  BusinessLogicError,     // 400 - Business rule violations
  ValidationError,        // 400 - Input validation errors  
  UnauthorizedError,      // 401 - Authentication required
  ForbiddenError,         // 403 - Access denied
  NotFoundError,          // 404 - Resource not found
  InternalServerError,    // 500 - Server errors
  withErrorHandling       // Wrapper for automatic error handling
} from '../utils'
```

## Recommended Pattern: withErrorHandling Wrapper

```typescript
import { OpenAPIRoute } from 'chanfana'
import { withErrorHandling, BusinessLogicError, NotFoundError } from '../utils'

export class MyRoute extends OpenAPIRoute {
  async handle(request: IRequest, env: any, context: any) {
    return withErrorHandling(request, async () => {
      // Your route logic here - just throw errors!
      
      if (someValidationFails) {
        throw new BusinessLogicError('Invalid input provided')
      }
      
      if (resourceNotFound) {
        throw new NotFoundError('User not found')
      }
      
      // Any other errors are automatically caught and logged
      const result = await someAsyncOperation() 
      
      return Response.json(result)
    })
  }
}
```

## Alternative Pattern: Manual Error Handler

```typescript
export class MyRoute extends OpenAPIRoute {
  async handle(request: IRequest, env: any, context: any) {
    const startTime = Date.now()
    const errorHandler = createErrorHandler(request, startTime)
    
    try {
      // Your route logic here
      return Response.json(result)
    } catch (error) {
      return errorHandler(error, 'Custom error message')
    }
  }
}
```

## What You Get

✅ **Structured JSON logging** with stack traces, correlation IDs, timing  
✅ **Correlation ID headers** in all error responses for tracking  
✅ **Request context** automatically captured (IP, user agent, endpoint, params)  
✅ **Consistent error responses** across all routes  
✅ **Easy debugging** with rich error information

## Example Error Log Output

```json
{
  "level": "error",
  "message": "Invalid input provided",
  "statusCode": 400,
  "correlationId": "1754820325321-89ephwsdi",
  "timestamp": "2025-08-10T10:05:25.321Z",
  "errorType": "BusinessLogicError",
  "context": {
    "endpoint": "/admin/users",
    "method": "POST",
    "userAgent": "PostmanRuntime/7.32.3",
    "ip": "192.168.1.1",
    "duration": 15
  },
  "stack": "BusinessLogicError: Invalid input provided\n    at handle (/path/to/route.ts:45:15)..."
}
```