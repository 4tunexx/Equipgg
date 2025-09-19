import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from "../auth-provider";
import { useAuth } from "../../hooks/use-auth";

// Mock useAuth hook
jest.mock('../../hooks/use-auth', () => ({
  useAuth: jest.fn(),
}));

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
    },
  })),
}));

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('provides auth context to children', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
      enabled: true,
    });

    const TestComponent = () => {
      const auth = useAuth();
      return <div>User ID: {auth.user?.id || 'not logged in'}</div>;
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByText('User ID: not logged in')).toBeInTheDocument();
  });

  it('handles user sign in', async () => {
    const mockUser = {
      id: '123',
      uid: '123',
      email: 'test@example.com',
      provider: 'default' as const,
    };

    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
      enabled: true,
    });

    const TestComponent = () => {
      const { user } = useAuth();
      return <div>User Email: {user?.email || 'not logged in'}</div>;
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(await screen.findByText(`User Email: ${mockUser.email}`)).toBeInTheDocument();
  });

  it('handles sign in flow', async () => {
    const mockSignIn = jest.fn();
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
      enabled: true,
      signIn: mockSignIn,
    });

    const TestComponent = () => {
      const auth = useAuth();
      return (
        <button onClick={() => auth.signIn('test@example.com', 'password')}>
          Sign In
        </button>
      );
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const signInButton = screen.getByText('Sign In');
    await userEvent.click(signInButton);

    expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password');
  });
});