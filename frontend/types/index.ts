export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  date_joined: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
  user: User;
}

export interface Company {
  id: number;
  name: string;
  website: string;
  industry: string;
  location: string;
  contact_person: string;
  contact_email: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export type ApplicationStatus =
  | "APPLIED"
  | "IN_REVIEW"
  | "INTERVIEW"
  | "OFFER"
  | "REJECTED"
  | "ACCEPTED";

export type WorkType = "REMOTE" | "HYBRID" | "ONSITE";

export interface Application {
  id: number;
  company: number;
  company_name: string;
  position: string;
  job_url: string;
  status: ApplicationStatus;
  applied_date: string;
  interview_date: string | null;
  location: string;
  work_type: WorkType | "";
  salary_range: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface KanbanApplication {
  id: number;
  company: number;
  company_name: string;
  position: string;
  status: ApplicationStatus;
  applied_date: string;
  work_type: WorkType | "";
  location: string;
}

export type InterviewType = "HR" | "TECHNICAL" | "CASE_STUDY" | "FINAL";
export type InterviewResult = "PENDING" | "PASSED" | "FAILED" | "CANCELLED";

export interface Interview {
  id: number;
  application: number;
  application_position: string;
  company_name: string;
  interview_date: string;
  interview_type: InterviewType;
  interviewer_name: string;
  meeting_link: string;
  notes: string;
  result: InterviewResult;
  reminder_enabled: boolean;
  reminder_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: number;
  application: number;
  application_position: string;
  company_name: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface UpcomingInterview {
  id: number;
  interview_date: string;
  interview_type: InterviewType;
  application_position: string;
  company_name: string;
}

export interface RecentApplication {
  id: number;
  position: string;
  company_name: string;
  status: ApplicationStatus;
  applied_date: string;
}

export interface DashboardStats {
  total_applications: number;
  pending_applications: number;
  interview_applications: number;
  offer_applications: number;
  rejected_applications: number;
  accepted_applications: number;
  total_companies: number;
  total_interviews: number;
  total_notes: number;
  upcoming_interviews: UpcomingInterview[];
  recent_applications: RecentApplication[];
}

export interface EmailLog {
  id: number;
  email_type: string;
  recipient: string;
  subject: string;
  status: "PENDING" | "SENT" | "FAILED";
  provider: string;
  error_message: string;
  sent_at: string | null;
  created_at: string;
}
