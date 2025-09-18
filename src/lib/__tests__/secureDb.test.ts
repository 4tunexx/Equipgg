import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { secureDb } from '@/lib/secureDb';

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    })),
  })),
}));

describe('secureDb', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('validates table names correctly', async () => {
    await expect(secureDb.select('invalid_table')).rejects.toThrow('Invalid table name');
    await expect(secureDb.select('users')).resolves.not.toThrow();
  });

  it('sanitizes where clauses', async () => {
    await secureDb.select('users', {
      id: "'; DROP TABLE users; --",
    });

    const supabaseClient = require('@supabase/supabase-js').createClient();
    expect(supabaseClient.from).toHaveBeenCalledWith('users');
    expect(supabaseClient.from().select().eq).toHaveBeenCalledWith('id', "DROP TABLE users");
  });

  it('handles query errors', async () => {
    const mockError = new Error('Database error');
    const supabaseClient = require('@supabase/supabase-js').createClient();
    supabaseClient.from().select.mockImplementationOnce(() => ({
      error: mockError,
    }));

    await expect(secureDb.select('users')).rejects.toThrow('Database error');
  });

  it('supports basic CRUD operations', async () => {
    // Create
    await secureDb.insert('users', { name: 'Test User' });
    expect(supabase.from().insert).toHaveBeenCalledWith({ name: 'Test User' });

    // Read
    await secureDb.select('users', { id: '123' });
    expect(supabase.from().select).toHaveBeenCalled();

    // Update
    await secureDb.update('users', { id: '123' }, { name: 'Updated User' });
    expect(supabase.from().update).toHaveBeenCalledWith({ name: 'Updated User' });

    // Delete
    await secureDb.delete('users', { id: '123' });
    expect(supabase.from().delete).toHaveBeenCalled();
  });
});