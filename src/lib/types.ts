export type UniversityTag = 'ANY' | 'HCMUT' | 'RMIT' | 'HUST' | 'VNU' | 'NEU' | 'OTHER';

export type KnowledgeLevel = 0 | 1 | 2 | 3 | 4 | 5;

export interface ChannelMessage {
  id: string;
  channelId: string;
  senderPseudonym: string;
  senderAvatar: string;
  content: string;
  timestamp: string;
  isArchiveLocked?: boolean;
  archiveMeta?: {
    title: string;
    description: string;
    unlockRequestId: string;
    isDecrypted: boolean;
    decryptedContent?: string;
  };
  knowledgeLevel?: KnowledgeLevel;
  university?: UniversityTag;
  tags?: string[];
}

export interface Channel {
  id: string;
  name: string;
  category: 'STUDY_HUBS' | 'THRESHOLD_VAULTS' | 'ANONYMOUS_LOUNGE';
  description: string;
  isLockedArchiveRoom?: boolean;
  activeUsersCount: number;
}

export interface QuorumRequest {
  id: string;
  channelId: string;
  title: string;
  requesterPseudonym: string;
  requestedAt: string;
  approvals: string[]; // List of admin pseudonyms who approved
  threshold: number;   // e.g. 2
  totalAdmins: number; // e.g. 3
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface GroupRecord {
  id: string;
  name: string;
  description: string;
  admin_id: string;
  tags: string[];
  university: UniversityTag;
  member_count: number;
  embedding?: number[];
  description_version: number;
}

export interface TagCount {
  tag: string;
  count: number;
}

export interface RankedGroup extends GroupRecord {
  similarityScore?: number;
  matchingTagCount: number;
}

export interface QuestionItem {
  id: string;
  label: string;
  required: boolean;
  order_index: number;
}

export interface QuestionnaireDefinition {
  groupId: string;
  version: number;
  isPublished: boolean;
  questions: QuestionItem[];
}

export interface SubmittedAnswer {
  questionId: string;
  questionLabel: string;
  answerText: string;
}

export interface ApplicationRecord {
  id: string;
  group_id: string;
  group_name?: string;
  questionnaire_version: number;
  applicant_id: string;
  applicant_pseudonym: string;
  answers: SubmittedAnswer[];
  submitted_at: string;
}

export interface NotificationRecord {
  id: string;
  recipient_admin_id: string;
  application_id: string;
  group_name: string;
  applicant_pseudonym: string;
  read_status: number; // 0 = unread, 1 = read
  created_at: string;
}

