export interface AuthUser {
  id: string;
  pseudonym: string;
  university: string;
  role: 'student' | 'admin';
  tideDpopJkt?: string;
  tideTier?: 'standard' | 'premium';
}

/**
 * Resolves current user identity from TideCloak DPoP headers or session headers.
 */
export function resolveSessionUser(req: Request): AuthUser {
  const customUserId = req.headers.get('x-mock-user-id') || req.headers.get('x-actor-id');
  const customPseudonym =
    req.headers.get('x-mock-pseudonym') || req.headers.get('x-actor-pseudonym');
  const dpopJkt = req.headers.get('x-tide-dpop-jkt') || undefined;
  const tideTier = (req.headers.get('x-tide-tier') as 'standard' | 'premium') || 'standard';

  if (customUserId === 'admin_rmit_lead') {
    return {
      id: 'admin_rmit_lead',
      pseudonym: 'Admin Krypton (COSC2759 Lead)',
      university: 'RMIT',
      role: 'admin',
      tideDpopJkt: dpopJkt,
      tideTier,
    };
  }

  if (customUserId === 'admin_hcmut_lead') {
    return {
      id: 'admin_hcmut_lead',
      pseudonym: 'Admin Argon (HCMUT Lead)',
      university: 'HCMUT',
      role: 'admin',
      tideDpopJkt: dpopJkt,
      tideTier,
    };
  }

  if (customUserId === 'unrelated_student_c') {
    return {
      id: 'unrelated_student_c',
      pseudonym: 'Anonymous Cat #99',
      university: 'VNU',
      role: 'student',
      tideDpopJkt: dpopJkt,
      tideTier,
    };
  }

  if (customUserId) {
    return {
      id: customUserId,
      pseudonym: customPseudonym || `Student ${customUserId}`,
      university: 'HCMUT',
      role: 'student',
      tideDpopJkt: dpopJkt,
      tideTier,
    };
  }

  return {
    id: 'user_owl_84',
    pseudonym: 'Anonymous Owl #84 (You)',
    university: 'HCMUT (*.edu.vn)',
    role: 'student',
    tideDpopJkt: dpopJkt,
    tideTier,
  };
}
