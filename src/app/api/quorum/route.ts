import { NextResponse } from 'next/server';
import { thresholdVault } from '@/lib/crypto/thresholdVault';

export async function GET() {
  const requests = thresholdVault.getAllPendingRequests();
  return NextResponse.json({ success: true, requests });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { requestId, adminPseudonym, action } = body;

    if (action === 'RESET') {
      thresholdVault.resetVotes(requestId);
      return NextResponse.json({ success: true, message: 'Votes reset successfully' });
    }

    if (!requestId || !adminPseudonym) {
      return NextResponse.json({ success: false, message: 'Missing parameters' }, { status: 400 });
    }

    const result = thresholdVault.castVote(requestId, adminPseudonym);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
