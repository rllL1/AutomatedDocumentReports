import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import documentsRoutes from './routes/documents';
import utilitiesRoutes from './routes/utilities';
import usersRoutes from './routes/users';
import { errorHandler, notFound } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/utilities', utilitiesRoutes);
app.use('/api/users', usersRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 API URL: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
