import { NextRequest, NextResponse } from 'next/server';
import { verifyCode } from '@/app/(backend)/AccountController/verifyEmail';

export async function POST(request: NextRequest) {
  try {
    const { userId, code } = await request.json();

    if (!userId || !code) {
      return NextResponse.json(
        { success: false, message: 'User ID and code are required' },
        { status: 400 }
      );
    }

    const result = await verifyCode(userId, code);

    if (result) {
      return NextResponse.json({
        success: true,
        message: 'Account verified successfully',
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired verification code' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Verify code error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to verify code' },
      { status: 500 }
    );
  }
}