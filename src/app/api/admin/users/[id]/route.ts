import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!adminUser?.isAdmin) {
      return NextResponse.json(
        { error: 'You must be an admin to delete users' },
        { status: 401 }
      );
    }

    const userId = resolvedParams.id;

    // Prevent admin from deleting themselves
    if (userId === adminUser.id) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      );
    }

    // Check if user exists
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, isAdmin: true }
    });

    if (!userToDelete) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent deleting other admins (optional safety check)
    if (userToDelete.isAdmin) {
      return NextResponse.json(
        { error: 'Cannot delete admin accounts' },
        { status: 400 }
      );
    }

    // Delete user and all related data in a transaction
    await prisma.$transaction(async (tx) => {
      // First, delete all related records manually
      
      // Delete user's SMAC picks
      await tx.userSMACPick.deleteMany({
        where: { userId: userId }
      });
      
      // Delete user's SMAC articles
      await tx.sMACArticle.deleteMany({
        where: { authorId: userId }
      });
      
      // Delete user's SMAC picks (admin picks)
      await tx.sMACPick.deleteMany({
        where: { authorId: userId }
      });
      
      // Delete user's article votes
      await tx.articleVote.deleteMany({
        where: { userId: userId }
      });
      
      // Delete user's article comments
      await tx.articleComment.deleteMany({
        where: { userId: userId }
      });
      
      
      // Finally, delete the user
      await tx.user.delete({
        where: { id: userId }
      });
    });

    console.log(`Admin ${adminUser.name} deleted user ${userToDelete.name} (${userToDelete.email})`);

    return NextResponse.json({ 
      success: true,
      message: `User ${userToDelete.name} has been deleted successfully`
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if current user is admin
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, isAdmin: true },
    });

    if (!adminUser?.isAdmin) {
      return NextResponse.json(
        { error: 'You must be an admin to update users' },
        { status: 401 }
      );
    }

    const body = await request.json();
    if (typeof body?.isAdmin !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request. Expected boolean isAdmin' },
        { status: 400 }
      );
    }

    const userId = resolvedParams.id;
    const isAdmin = body.isAdmin as boolean;

    // Prevent admin from removing their own admin access
    if (userId === adminUser.id && isAdmin === false) {
      return NextResponse.json(
        { error: 'You cannot remove your own admin access' },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isAdmin },
      select: { id: true, name: true, email: true, isAdmin: true },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}