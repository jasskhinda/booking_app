import { adminSupabase } from '@/lib/admin-supabase';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find and delete users with this email
    const { data: users, error: fetchError } = await adminSupabase.auth.admin.listUsers();
    
    if (fetchError) {
      console.error('Error fetching users:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    const usersToDelete = users.users.filter(user => 
      user.email === email && 
      (user.user_metadata?.temp_signup || user.email_confirmed_at === null)
    );

    console.log(`Found ${usersToDelete.length} test/temp accounts to delete for ${email}`);

    for (const user of usersToDelete) {
      try {
        await adminSupabase.auth.admin.deleteUser(user.id);
        console.log(`Deleted user: ${user.id} (${user.email})`);
      } catch (deleteError) {
        console.error(`Error deleting user ${user.id}:`, deleteError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Cleaned up ${usersToDelete.length} test accounts for ${email}`,
      deletedCount: usersToDelete.length
    });
    
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup accounts' },
      { status: 500 }
    );
  }
}