import { Response } from 'express';
import supabase from '../config/supabase';
import { AuthRequest } from '../middleware/auth';

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
};

export const getUserById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user'
    });
  }
};

export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, full_name, role } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and full name are required'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters'
      });
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        return res.status(409).json({
          success: false,
          error: 'User with this email already exists'
        });
      }
      throw authError;
    }

    // Create user record in database
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        full_name,
        role: role || 'user',
        is_active: true
      })
      .select()
      .single();

    if (dbError) {
      // Rollback: delete auth user if database insert fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw dbError;
    }

    res.status(201).json({
      success: true,
      data: userData
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create user'
    });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { email, full_name, role, is_active } = req.body;

    const updates: Record<string, string | boolean> = {
      updated_at: new Date().toISOString()
    };

    if (full_name) updates.full_name = full_name;
    if (role) updates.role = role;
    if (is_active !== undefined) updates.is_active = is_active;

    // Update email in auth if changed
    if (email) {
      const { error: authError } = await supabase.auth.admin.updateUserById(id, { email });
      if (authError) throw authError;
      updates.email = email;
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user'
    });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Prevent deleting own account
    if (req.user && req.user.id === id) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete your own account'
      });
    }

    // Delete from auth
    const { error: authError } = await supabase.auth.admin.deleteUser(id);
    if (authError) {
      console.error('Auth delete error:', authError);
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (dbError) throw dbError;

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user'
    });
  }
};

export const toggleUserStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Get current status
    const { data: currentUser, error: fetchError } = await supabase
      .from('users')
      .select('is_active')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Toggle status
    const { data, error } = await supabase
      .from('users')
      .update({
        is_active: !currentUser.is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle user status'
    });
  }
};
