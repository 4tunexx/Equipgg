import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import secureDb from "../secureDb";

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    eq: jest.fn(),
  })),
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase),
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
      where: { id: "'; DROP TABLE users; --" } as any,
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
    expect(mockSupabase.from().insert).toHaveBeenCalledWith({ name: 'Test User' });

    // Read
    await secureDb.select('users', { where: { id: '123' } as any });
    expect(mockSupabase.from().select).toHaveBeenCalled();

    // Update
    await secureDb.update('users', { id: '123' } as any, { name: 'Updated User' } as any);
    expect(mockSupabase.from().update).toHaveBeenCalledWith({ name: 'Updated User' });

    // Delete
    await secureDb.delete('users', { id: '123' });
    expect(mockSupabase.from().delete).toHaveBeenCalled();
  });
});