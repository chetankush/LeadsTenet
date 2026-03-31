import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createDbService } from '@/lib/database-service'
import { getSupabaseAdmin } from '@/utils/supabase/admin'

export async function DELETE() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await createDbService()
    const dbUser = await db.getCurrentUser()
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Delete user data from database using admin client (cascading deletes)
    const adminDb = getSupabaseAdmin()
    const { error: deleteError } = await adminDb
      .from('users')
      .delete()
      .eq('id', dbUser.id)

    if (deleteError) {
      console.error('Error deleting user data:', deleteError)
      return NextResponse.json({ error: 'Failed to delete user data' }, { status: 500 })
    }

    // Delete user from Supabase Auth
    try {
      await adminDb.auth.admin.deleteUser(user.id)
    } catch (authError) {
      console.error('Error deleting auth user:', authError)
      // Data is already deleted from DB, so we proceed
    }

    return NextResponse.json({ success: true, message: 'Account deleted successfully' })
  } catch (error) {
    console.error('Error deleting account:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
