import { supabase } from "@/integrations/supabase/client";

export async function createAdminUser(email: string, password: string, role: 'admin' | 'user' = 'admin') {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-admin-user`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, role }),
    }
  );

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || 'Failed to create user');
  }

  return result;
}