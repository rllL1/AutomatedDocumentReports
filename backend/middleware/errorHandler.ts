import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: Error & { statusCode?: number },
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) => {
  console.error('Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export const notFound = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`
  });
};
