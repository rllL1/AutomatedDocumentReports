import { Request, Response, NextFunction } from 'express';
import supabase from '../config/supabase';
import { User } from '../types';

export interface AuthRequest extends Request {
  user?: User;
  token?: string;
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No authorization token provided'
      });
    }

    const token = authHeader.substring(7);

    // Verify JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error) {
      console.error('Token verification error:', error.message);
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    // Fetch user details from database
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (dbError || !userData) {
      console.error('User fetch error:', dbError?.message);
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    if (!userData.is_active) {
      return res.status(403).json({
        success: false,
        error: 'User account is disabled'
      });
    }

    req.user = userData;
    req.token = token;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

export const adminMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }
  next();
};
