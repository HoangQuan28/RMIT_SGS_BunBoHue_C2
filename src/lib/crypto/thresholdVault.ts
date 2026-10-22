import { QuorumRequest, ChannelMessage } from '../types';

/**
 * In-memory state store simulating TideCloak threshold state machine
 * and encrypted ciphertext message records.
 */
class ThresholdStateStore {
  private requests: Map<string, QuorumRequest> = new Map();
  private adminKeys: string[] = ['Admin-Krypton', 'Admin-Argon', 'Admin-Xenon']; // 3 designated group admins

  constructor() {
    // Seed initial quorum request for the past exam vault
    this.requests.set('req-exam-2025', {
      id: 'req-exam-2025',
      channelId: 'exam-archive-vault',
      title: 'Decryption Request: 2025 Midterm Exam Solutions (PDF + Code)',
      requesterPseudonym: 'Anonymous Duck #49',
      requestedAt: '10:45 AM',
      approvals: ['Admin-Krypton'], // 1 out of 3 approved initially
      threshold: 2,
      totalAdmins: 3,
      status: 'PENDING'
    });
  }

  public getQuorumRequest(requestId: string): QuorumRequest | undefined {
    return this.requests.get(requestId);
  }

  public getAllPendingRequests(): QuorumRequest[] {
    return Array.from(this.requests.values());
  }

  public castVote(requestId: string, adminPseudonym: string): { success: boolean; request: QuorumRequest; message: string } {
    const req = this.requests.get(requestId);
    if (!req) {
      return { success: false, request: {} as any, message: 'Request not found' };
    }

    if (!this.adminKeys.includes(adminPseudonym)) {
      return { success: false, request: req, message: 'Unauthorized: Voter is not a recognized group admin' };
    }

    if (req.approvals.includes(adminPseudonym)) {
      return { success: false, request: req, message: 'Admin has already cast approval' };
    }

    req.approvals.push(adminPseudonym);

    // Verify if threshold (2/3) is achieved
    if (req.approvals.length >= req.threshold) {
      req.status = 'APPROVED';
    }

    this.requests.set(requestId, req);
    return { 
      success: true, 
      request: req, 
      message: req.status === 'APPROVED' ? '2/3 Quorum threshold reached! Decryption key minted.' : 'Approval registered. Awaiting 2nd signature.' 
    };
  }

  public resetVotes(requestId: string) {
    const req = this.requests.get(requestId);
    if (req) {
      req.approvals = [];
      req.status = 'PENDING';
      this.requests.set(requestId, req);
    }
  }
}

export const thresholdVault = new ThresholdStateStore();
