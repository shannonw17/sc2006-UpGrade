import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { sendVerificationCode } from '@/app/(backend)/AccountController/verifyEmail';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'No account found with this email' },
        { status: 404 }
      );
    }

    if (user.status === 'ACTIVE') {
      return NextResponse.json(
        { success: false, message: 'Account is already verified' },
        { status: 400 }
      );
    }

    // Resend verification code
    await sendVerificationCode(user.id);

    return NextResponse.json({
      success: true,
      message: 'Verification code has been sent to your email',
    });
  } catch (error: any) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to resend verification code' },
      { status: 500 }
    );
  }
}