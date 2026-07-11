import { supabase, isRealSupabaseConfigured } from './supabase';

export function deriveNameFromEmail(email: string): string {
  if (!email) return '';
  const part = email.split('@')[0];
  const words = part.split(/[\._\-0-9]+/);
  const cleanWords = words.filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  if (cleanWords.length === 0) {
    return part.charAt(0).toUpperCase() + part.slice(1);
  }
  return cleanWords.join(' ');
}

export async function getSavedFullName(userId: string, email: string): Promise<string> {
  if (isRealSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .maybeSingle();
      if (!error && data?.full_name) {
        return data.full_name;
      }
    } catch (e) {
      // ignore
    }
  }
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(`aura_premium_profile_${userId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed?.fullName) return parsed.fullName;
      } catch {
        // ignore
      }
    }
  }
  return '';
}

export interface UserSession {
  user: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
    };
  } | null;
  isMock: boolean;
}

// Sandbox local mock user table
const MOCK_USERS_KEY = 'aura_sandbox_users';

interface MockUser {
  id: string;
  email: string;
  password?: string;
  fullName: string;
}

const getMockUsers = (): MockUser[] => {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(MOCK_USERS_KEY) || '[]');
  } catch {
    return [];
  }
};

const saveMockUser = (user: MockUser) => {
  if (typeof window === 'undefined') return;
  const users = getMockUsers();
  users.push(user);
  localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
};

export const authService = {
  async getSession(): Promise<UserSession> {
    if (isRealSupabaseConfigured) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const emailVal = session.user.email || '';
          const savedName = await getSavedFullName(session.user.id, emailVal);
          const fullName = savedName || session.user.user_metadata?.full_name || deriveNameFromEmail(emailVal);
          return {
            user: {
              id: session.user.id,
              email: emailVal,
              user_metadata: {
                ...session.user.user_metadata,
                full_name: fullName
              }
            },
            isMock: false
          };
        }
      } catch (e) {
        console.warn('Supabase getSession connection error, using sandbox fallback:', e);
      }
    }
    
    // Sandbox development only bypass or local connection fallback
    if (typeof window !== 'undefined') {
      const sandboxSession = localStorage.getItem('aura_sandbox_session');
      if (sandboxSession) {
        try {
          const parsed = JSON.parse(sandboxSession);
          if (parsed.user) {
            const emailVal = parsed.user.email || '';
            const savedName = await getSavedFullName(parsed.user.id, emailVal);
            parsed.user.user_metadata = {
              ...parsed.user.user_metadata,
              full_name: savedName || parsed.user.user_metadata?.full_name || deriveNameFromEmail(emailVal)
            };
          }
          return parsed;
        } catch {
          // ignore
        }
      }
    }

    return { user: null, isMock: false };
  },

  async signUp(email: string, password: string, fullName: string): Promise<UserSession> {
    if (isRealSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName }
          }
        });
        if (error) throw error;
        if (data.user) {
          const emailVal = data.user.email || email;
          const userObj = {
            id: data.user.id,
            email: emailVal,
            user_metadata: { full_name: fullName || deriveNameFromEmail(emailVal) }
          };
          return { user: userObj, isMock: false };
        }
        throw new Error('Registration did not return user data');
      } catch (e: any) {
        console.warn('Supabase signup error, falling back to local sandbox registration:', e);
        if (e.message !== 'Failed to fetch' && !e.message?.includes('fetch')) {
          throw new Error(e.message || 'Registration failed');
        }
      }
    }

    // Local sandbox signup fallback
    const users = getMockUsers();
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('Email already registered in local sandbox database.');
    }

    const newId = 'sandbox-uid-' + Math.random().toString(36).substr(2, 9);
    const mockUser: MockUser = { id: newId, email, password, fullName };
    saveMockUser(mockUser);

    const userObj = {
      id: newId,
      email,
      user_metadata: { full_name: fullName }
    };
    const sessionObj = { user: userObj, isMock: true };
    if (typeof window !== 'undefined') {
      localStorage.setItem('aura_sandbox_session', JSON.stringify(sessionObj));
    }
    return sessionObj;
  },

  async signIn(email: string, password: string): Promise<UserSession> {
    // Check for demo credentials bypass
    if (email === 'demo@aura.fit' && password === 'demo123') {
      const demoUser = {
        id: 'aura-demo-user-id',
        email: 'demo@aura.fit',
        user_metadata: { full_name: 'Alex Rivera' }
      };
      const sessionObj = { user: demoUser, isMock: true };
      if (typeof window !== 'undefined') {
        localStorage.setItem('aura_sandbox_session', JSON.stringify(sessionObj));
      }
      return sessionObj;
    }

    if (isRealSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        if (data.user) {
          const emailVal = data.user.email || email;
          const savedName = await getSavedFullName(data.user.id, emailVal);
          const fullName = savedName || data.user.user_metadata?.full_name || deriveNameFromEmail(emailVal);
          const userObj = {
            id: data.user.id,
            email: emailVal,
            user_metadata: {
              ...data.user.user_metadata,
              full_name: fullName
            }
          };
          return { user: userObj, isMock: false };
        }
        throw new Error('Sign in failed');
      } catch (e: any) {
        console.warn('Supabase signin error, checking local sandbox credentials:', e);
        if (e.message !== 'Failed to fetch' && !e.message?.includes('fetch')) {
          throw new Error(e.message || 'Invalid email or password.');
        }
      }
    }

    // Sandbox fallback: Check credentials in local mock table or create dynamic mock session to allow testing
    const users = getMockUsers();
    const matched = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (matched) {
      if (matched.password === password) {
        const savedName = await getSavedFullName(matched.id, matched.email);
        const userObj = {
          id: matched.id,
          email: matched.email,
          user_metadata: { full_name: savedName || matched.fullName || deriveNameFromEmail(matched.email) }
        };
        const sessionObj = { user: userObj, isMock: true };
        if (typeof window !== 'undefined') {
          localStorage.setItem('aura_sandbox_session', JSON.stringify(sessionObj));
        }
        return sessionObj;
      } else {
        throw new Error('Invalid password for this local sandbox account.');
      }
    }

    // Dynamic sandbox login auto-generation (for easy testing/bypass of registration flow)
    const newId = 'sandbox-uid-' + Math.random().toString(36).substr(2, 9);
    const fallbackName = deriveNameFromEmail(email);
    const userObj = {
      id: newId,
      email,
      user_metadata: { full_name: fallbackName }
    };
    const sessionObj = { user: userObj, isMock: true };
    if (typeof window !== 'undefined') {
      localStorage.setItem('aura_sandbox_session', JSON.stringify(sessionObj));
    }
    return sessionObj;
  },

  async signOut(): Promise<void> {
    if (isRealSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error('Supabase signout error:', e);
      }
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('aura_sandbox_session');
    }
  },

  async resetPassword(email: string): Promise<void> {
    if (isRealSupabaseConfigured) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/login`
        });
        if (error) throw error;
        return;
      } catch (e: any) {
        console.warn('Supabase resetPassword error, falling back locally:', e);
        if (e.message !== 'Failed to fetch' && !e.message?.includes('fetch')) {
          throw new Error(e.message || 'Failed to send password reset email.');
        }
      }
    }
    // Sandbox feedback simulation
    console.log(`[Sandbox] Password reset mock email triggered for: ${email}`);
  },

  onAuthStateChange(callback: (session: UserSession) => void) {
    let unsubscribeSupabase = () => {};

    if (isRealSupabaseConfigured) {
      try {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
          if (session?.user) {
            const emailVal = session.user.email || '';
            const savedName = await getSavedFullName(session.user.id, emailVal);
            const fullName = savedName || session.user.user_metadata?.full_name || deriveNameFromEmail(emailVal);
            callback({
              user: {
                id: session.user.id,
                email: emailVal,
                user_metadata: {
                  ...session.user.user_metadata,
                  full_name: fullName
                }
              },
              isMock: false
            });
          } else {
            // Check fallback sandbox session
            if (typeof window !== 'undefined') {
              const sandboxSession = localStorage.getItem('aura_sandbox_session');
              if (sandboxSession) {
                try {
                  const parsed = JSON.parse(sandboxSession);
                  if (parsed.user) {
                    const emailVal = parsed.user.email || '';
                    const savedName = await getSavedFullName(parsed.user.id, emailVal);
                    parsed.user.user_metadata = {
                      ...parsed.user.user_metadata,
                      full_name: savedName || parsed.user.user_metadata?.full_name || deriveNameFromEmail(emailVal)
                    };
                  }
                  callback(parsed);
                  return;
                } catch {
                  // ignore
                }
              }
            }
            callback({ user: null, isMock: false });
          }
        });
        unsubscribeSupabase = () => subscription.unsubscribe();
      } catch (e) {
        console.warn('Supabase onAuthStateChange error:', e);
      }
    }

    // Immediate callback for local sandbox
    if (typeof window !== 'undefined') {
      const sandboxSession = localStorage.getItem('aura_sandbox_session');
      if (sandboxSession) {
        try {
          const parsed = JSON.parse(sandboxSession);
          if (parsed.user) {
            const emailVal = parsed.user.email || '';
            getSavedFullName(parsed.user.id, emailVal).then(savedName => {
              parsed.user.user_metadata = {
                ...parsed.user.user_metadata,
                full_name: savedName || parsed.user.user_metadata?.full_name || deriveNameFromEmail(emailVal)
              };
              callback(parsed);
            }).catch(() => {
              callback(parsed);
            });
          } else {
            callback(parsed);
          }
        } catch {
          callback({ user: null, isMock: false });
        }
      } else {
        if (!isRealSupabaseConfigured) {
          callback({ user: null, isMock: false });
        }
      }
    }

    return () => {
      unsubscribeSupabase();
    };
  }
};
