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
  is_email_verified: boolean;
  phone_number: string | null;
  is_phone_verified: boolean;
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
  is_verified: boolean;
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

export interface CvLanguage {
  language: string;
  level: string;
}

export interface CvEducation {
  school: string;
  degree: string;
  start_year: string;
  end_year: string;
  is_current?: boolean;
  description: string;
}

export interface CvWorkExperience {
  company: string;
  position: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  description: string;
}

export interface CvProject {
  name: string;
  description: string;
  technologies: string;
  url: string;
  start_date?: string;
  end_date?: string;
  is_current?: boolean;
}

export interface CvCertificate {
  name: string;
  issuer: string;
  year: string;
  url: string;
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
  phone?: string;
  website?: string;
  languages?: CvLanguage[];
  education?: CvEducation[];
  work_experience?: CvWorkExperience[];
  projects?: CvProject[];
  certificates?: CvCertificate[];
  cv_language_preference?: string;
  include_profile_photo_in_cv?: boolean;
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
  likes_count: number;
  is_liked_by_me: boolean;
  comments_count: number;
  reposts_count: number;
  is_reposted_by_me: boolean;
  created_at: string;
  updated_at: string;
}

export interface PostComment {
  id: number;
  user: number;
  user_name: string;
  user_role: string;
  user_profile_photo: string | null;
  user_gender: string | null;
  content: string;
  created_at: string;
}

export interface UserSearchResult {
  id: number;
  name: string;
  email: string;
  role: string;
  profile_photo: string | null;
  gender: string | null;
}

export interface Notification {
  id: number;
  actor: number | null;
  actor_name: string | null;
  actor_role: string | null;
  type: string;
  title: string;
  message: string;
  link: string;
  is_read: boolean;
  created_at: string;
}

export interface SharedPostData {
  id: number;
  author_name: string;
  author_profile_photo: string | null;
  author_gender: string | null;
  content: string;
  image: string | null;
  created_at: string;
  is_active: boolean;
}

export interface Message {
  id: number;
  conversation: number;
  sender: number;
  sender_name: string;
  sender_role: string;
  body: string;
  is_read: boolean;
  shared_post_data?: SharedPostData | null;
  created_at: string;
}

export interface ConversationLastMessage {
  id: number;
  body: string;
  sender: number;
  sender_name: string;
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  id: number;
  other_user: number | null;
  other_user_name: string;
  other_user_role: string;
  other_user_profile_photo?: string | null;
  other_user_gender?: string | null;
  job_application?: number | null;
  job_post?: number | null;
  job_title?: string | null;
  last_message?: ConversationLastMessage | null;
  last_message_at?: string | null;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProfileTimelineItem {
  type: "post" | "repost";
  sort_at: string;
  repost_id?: number;
  repost_at?: string;
  post: FeedPost;
}

export interface PublicProfile {
  user: User;
  developer_profile: DeveloperProfile | null;
  recruiter_profile: RecruiterProfile | null;
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

export interface PublicDeveloper {
  id: number;
  name: string;
  role: string;
  profile_photo: string | null;
  gender: string | null;
  title: string;
  location: string;
  skills: string;
  open_to_work: boolean;
}

export interface PublicRecruiter {
  id: number;
  name: string;
  role: string;
  profile_photo: string | null;
  gender: string | null;
  title: string;
  company_name: string;
  industry: string;
  location: string;
  is_hiring: boolean;
}
