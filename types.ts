export enum UserRole {
  ADMIN = 'ADMIN',
  ORG_MANAGER = 'ORG_MANAGER',
}

export enum CampaignStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ENDED = 'ENDED',
  PAUSED = 'PAUSED',
}

export enum MissionType {
  PHOTO = 'PHOTO',
  QUIZ = 'QUIZ',
  LOCATION = 'LOCATION',
  TEXT = 'TEXT',
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  type: MissionType;
  points: number;
  order: number;
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  startDate: string;
  endDate: string;
  region: string;
  status: CampaignStatus;
  missions: Mission[];
  participantCount: number;
}

export interface AnalyticsSummary {
  totalCampaigns: number;
  totalParticipants: number;
  totalMissionsCompleted: number;
  totalPointsDistributed: number;
}

export interface DailyStat {
  date: string;
  participants: number;
  completions: number;
}
