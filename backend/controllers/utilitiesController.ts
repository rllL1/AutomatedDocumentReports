import { Response } from 'express';
import supabase from '../config/supabase';
import { AuthRequest } from '../middleware/auth';

export const getAllUtilities = async (req: AuthRequest, res: Response) => {
  try {
    const { type } = req.query;

    let query = supabase.from('utilities').select('*').eq('is_active', true);

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query.order('value', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Get utilities error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch utilities'
    });
  }
};

export const getUtilityById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('utilities')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Utility not found'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Get utility by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch utility'
    });
  }
};

export const getUtilitiesByType = async (req: AuthRequest, res: Response) => {
  try {
    const { type } = req.params;

    const { data, error } = await supabase
      .from('utilities')
      .select('*')
      .eq('type', type)
      .eq('is_active', true)
      .order('value', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Get utilities by type error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch utilities'
    });
  }
};

export const createUtility = async (req: AuthRequest, res: Response) => {
  try {
    const { type, value, description } = req.body;

    if (!type || !value) {
      return res.status(400).json({
        success: false,
        error: 'Type and value are required'
      });
    }

    const validTypes = ['classification', 'document_type', 'summary_basis', 'division_office', 'destination_office'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid utility type'
      });
    }

    const { data, error } = await supabase
      .from('utilities')
      .insert({
        type,
        value,
        description
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return res.status(409).json({
          success: false,
          error: 'This utility already exists'
        });
      }
      throw error;
    }

    res.status(201).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Create utility error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create utility'
    });
  }
};

export const updateUtility = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { value, description, is_active } = req.body;

    const updates: Record<string, string | boolean> = {
      updated_at: new Date().toISOString()
    };

    if (value !== undefined) updates.value = value;
    if (description !== undefined) updates.description = description;
    if (is_active !== undefined) updates.is_active = is_active;

    const { data, error } = await supabase
      .from('utilities')
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
    console.error('Update utility error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update utility'
    });
  }
};

export const deleteUtility = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('utilities')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Utility deleted successfully'
    });
  } catch (error) {
    console.error('Delete utility error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete utility'
    });
  }
};
