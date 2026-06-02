export type UserRole = 'DEVELOPER' | 'RECRUITER';

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  profile_photo: string | null;
  gender: string | null;
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

export type JobApplicationStatus = 'APPLIED' | 'REVIEWING' | 'INTERVIEW' | 'REJECTED' | 'ACCEPTED';

export interface JobApplication {
  id: number;
  developer: number;
  developer_name: string;
  developer_email: string;
  job_post: number;
  job_title: string;
  company_name: string;
  recruiter_name: string;
  status: JobApplicationStatus;
  cover_letter: string;
  interview_date: string | null;
  interview_link: string;
  interview_note: string;
  created_at: string;
  updated_at: string;
}

export type RescheduleStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface InterviewRescheduleRequest {
  id: number;
  job_application: number;
  job_title: string;
  company_name: string;
  developer_name: string;
  developer_email: string;
  requested_by: number;
  reason: string;
  available_slots: string;
  status: RescheduleStatus;
  recruiter_response: string;
  created_at: string;
  updated_at: string;
}

export interface JobPost {
  id: number;
  company: number;
  company_name: string;
  recruiter_name: string;
  title: string;
  description: string;
  requirements: string;
  location: string;
  work_type: string;
  salary_range: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DeveloperProfile {
  id: number;
  title: string;
  bio: string;
  skills: string;
  github_url: string;
  linkedin_url: string;
  portfolio_url: string;
  location: string;
  years_of_experience: number | null;
  is_open_to_work: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecruiterProfile {
  id: number;
  company_name: string;
  company_website: string;
  company_industry: string;
  company_location: string;
  position_title: string;
  bio: string;
  linkedin_url: string;
  is_hiring: boolean;
  created_at: string;
  updated_at: string;
}

export interface FeedPost {
  id: number;
  author: number;
  author_name: string;
  author_email: string;
  author_role: "DEVELOPER" | "RECRUITER" | string;
  author_profile_photo: string | null;
  author_gender: string | null;
  content: string;
  image: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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
