// Academic profile & subject types

export interface AcademicProfile {
  id: string;
  userId: string;
  university: string;
  branch: string;
  semester: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subject {
  id: string;
  userId: string;
  academicProfileId: string;
  name: string;
  examDate?: Date;
  createdAt: Date;
}

export interface OnboardingPayload {
  university: string;
  branch: string;
  semester: number;
  subjects: string[];
}
