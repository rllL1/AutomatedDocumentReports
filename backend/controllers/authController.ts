import { Response } from 'express';
import supabase from '../config/supabase';
import { AuthRequest } from '../middleware/auth';

export const login = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Fetch user details from database
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (dbError || !userData) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (!userData.is_active) {
      return res.status(403).json({
        success: false,
        error: 'Account is disabled'
      });
    }

    if (userData.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    res.json({
      success: true,
      data: {
        user: userData,
        session: data.session
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
};

export const logout = async (req: AuthRequest, res: Response) => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }

    res.json({
      success: true,
      data: req.user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile'
    });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }

    const { full_name, email, department, division } = req.body;

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    if (full_name) updates.full_name = full_name;
    if (department !== undefined) updates.department = department;
    if (division !== undefined) updates.division = division;
    
    if (email && email !== req.user.email) {
      // Update email in auth
      const { error: authError } = await supabase.auth.updateUser({ email });
      if (authError) throw authError;
      updates.email = email;
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) {
      console.error('Update profile error:', error);
      throw new Error(error.message || 'Failed to update profile');
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Update profile error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current and new passwords are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 8 characters'
      });
    }

    // Verify current password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: req.user.email,
      password: currentPassword
    });

    if (signInError) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (updateError) throw updateError;

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password'
    });
  }
};
