import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Test if Supabase connection works
    const { error } = await supabase
      .from('posts')
      .select('id')
      .limit(1);

    if (error) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Supabase connection failed',
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        status: 'success',
        message: 'All systems operational',
        supabase: 'connected',
        database: 'accessible',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      {
        status: 'error',
        message: 'Health check failed',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
