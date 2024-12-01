import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { vi } from 'vitest';

// Mock Supabase client
vi.mock('../lib/supabase', () => ({
  default: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      insert: vi.fn(),
    })),
  },
}));

const wrapper = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>{children}</AuthProvider>
  </BrowserRouter>
);

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with null user and profile', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user).toBeNull();
    expect(result.current.userProfile).toBeNull();
    expect(result.current.loading).toBe(true);
  });

  it('should handle successful sign in', async () => {
    const mockUser = { id: '123', email: 'test@example.com' };
    const mockProfile = { id: '123', role: 'owner' };

    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
      data: { user: mockUser },
      error: null,
    });

    vi.mocked(supabase.from().select().eq().single).mockResolvedValueOnce({
      data: mockProfile,
      error: null,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signIn('test@example.com', 'password');
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.userProfile).toEqual(mockProfile);
    expect(result.current.loading).toBe(false);
  });

  it('should handle sign in errors', async () => {
    const mockError = new Error('Invalid credentials');

    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
      data: null,
      error: mockError,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signIn('test@example.com', 'wrong-password');
    });

    expect(result.current.user).toBeNull();
    expect(result.current.userProfile).toBeNull();
    expect(result.current.error).toBe(mockError.message);
  });

  it('should handle successful sign up', async () => {
    const mockUser = { id: '123', email: 'new@example.com' };

    vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
      data: { user: mockUser },
      error: null,
    });

    vi.mocked(supabase.from().insert).mockResolvedValueOnce({
      data: null,
      error: null,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signUp('new@example.com', 'password', 'owner');
    });

    expect(result.current.error).toBeNull();
  });

  it('should handle sign out', async () => {
    vi.mocked(supabase.auth.signOut).mockResolvedValueOnce({
      error: null,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signOut();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.userProfile).toBeNull();
    expect(result.current.loading).toBe(false);
  });
});
