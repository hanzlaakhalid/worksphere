import {
  ApplicationStatus,
  AttendanceStatus,
  DocumentCategory,
  EmployeeStatus,
  EmploymentType,
  Gender,
  JobStatus,
  LeaveStatus,
  LeaveType,
  NotificationType,
  PaymentStatus,
  PerformanceRating,
  PrismaClient,
  Role,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEV_PASSWORD = 'Password123!';

// Documents point at real (placeholder) files under uploads/ so "view/download"
// works out of the box instead of a dead link.
const UPLOADS_DIR = path.join(__dirname, '../uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
function ensureSeedFile(filename: string, content: string): string {
  const filePath = path.join(UPLOADS_DIR, filename);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, content);
  }
  return `/uploads/${filename}`;
}

interface SeedUser {
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
}

interface SeedEmployee {
  email: string;
  department: string | null;
  position: string;
  managerEmail: string | null;
  phone: string;
  gender: Gender;
  dateOfBirth: string;
  address: string;
  joiningDate: string;
  employmentType: EmploymentType;
  salary: number;
  status: EmployeeStatus;
}

const seedUsers: SeedUser[] = [
  { email: 'admin@worksphere.local', firstName: 'Alex', lastName: 'Admin', role: Role.ADMIN },
  { email: 'hr1@worksphere.local', firstName: 'Hana', lastName: 'Reyes', role: Role.HR_MANAGER },
  { email: 'hr2@worksphere.local', firstName: 'Omar', lastName: 'Siddiqui', role: Role.HR_MANAGER },
  { email: 'manager1@worksphere.local', firstName: 'Maria', lastName: 'Novak', role: Role.MANAGER },
  { email: 'manager2@worksphere.local', firstName: 'Liam', lastName: 'Chen', role: Role.MANAGER },
  { email: 'employee1@worksphere.local', firstName: 'Sofia', lastName: 'Costa', role: Role.EMPLOYEE },
  { email: 'employee2@worksphere.local', firstName: 'Noah', lastName: 'Kim', role: Role.EMPLOYEE },
  { email: 'employee3@worksphere.local', firstName: 'Ava', lastName: 'Johansson', role: Role.EMPLOYEE },
  { email: 'employee4@worksphere.local', firstName: 'Liam', lastName: "O'Brien", role: Role.EMPLOYEE },
  { email: 'employee5@worksphere.local', firstName: 'Mia', lastName: 'Tanaka', role: Role.EMPLOYEE },
  { email: 'employee6@worksphere.local', firstName: 'Ethan', lastName: 'Silva', role: Role.EMPLOYEE },
  { email: 'employee7@worksphere.local', firstName: 'Zara', lastName: 'Ahmed', role: Role.EMPLOYEE },
  { email: 'employee8@worksphere.local', firstName: 'Lucas', lastName: 'Fischer', role: Role.EMPLOYEE },
  { email: 'employee9@worksphere.local', firstName: 'Grace', lastName: 'Park', role: Role.EMPLOYEE },
  { email: 'employee10@worksphere.local', firstName: 'Daniel', lastName: 'Rossi', role: Role.EMPLOYEE },
];

const departmentDescriptions: Record<string, string> = {
  Engineering: 'Builds and maintains WorkSphere and internal tooling.',
  'Human Resources': 'Owns hiring, onboarding, and employee relations.',
  Finance: 'Manages payroll, budgeting, and financial reporting.',
  Marketing: 'Drives brand, content, and demand generation.',
  Sales: 'Owns the customer pipeline from lead to close.',
};

const departmentHeads: {
  department: string;
  email: string;
  position: string;
  phone: string;
  gender: Gender;
  dateOfBirth: string;
  address: string;
  joiningDate: string;
  salary: number;
}[] = [
  {
    department: 'Engineering',
    email: 'manager1@worksphere.local',
    position: 'Engineering Manager',
    phone: '+1-555-0201',
    gender: Gender.FEMALE,
    dateOfBirth: '1986-01-19',
    address: '4 Redwood Ct, Austin, TX',
    joiningDate: monthsAgoISO(24),
    salary: 145000,
  },
  {
    department: 'Sales',
    email: 'manager2@worksphere.local',
    position: 'Sales Manager',
    phone: '+1-555-0202',
    gender: Gender.MALE,
    dateOfBirth: '1988-08-03',
    address: '22 Cypress Ave, Chicago, IL',
    joiningDate: monthsAgoISO(20),
    salary: 132000,
  },
  {
    department: 'Human Resources',
    email: 'hr1@worksphere.local',
    position: 'HR Manager',
    phone: '+1-555-0203',
    gender: Gender.FEMALE,
    dateOfBirth: '1985-05-27',
    address: '10 Chestnut St, Denver, CO',
    joiningDate: monthsAgoISO(30),
    salary: 118000,
  },
  {
    department: 'Finance',
    email: 'hr2@worksphere.local',
    position: 'Finance Manager',
    phone: '+1-555-0204',
    gender: Gender.MALE,
    dateOfBirth: '1987-02-11',
    address: '55 Hickory Rd, Seattle, WA',
    joiningDate: monthsAgoISO(26),
    salary: 136000,
  },
];

const seedEmployees: SeedEmployee[] = [
  {
    email: 'employee1@worksphere.local',
    department: 'Engineering',
    position: 'Software Engineer',
    managerEmail: 'manager1@worksphere.local',
    phone: '+1-555-0101',
    gender: Gender.FEMALE,
    dateOfBirth: '1994-03-12',
    address: '12 Birch St, Austin, TX',
    joiningDate: monthsAgoISO(10),
    employmentType: EmploymentType.FULL_TIME,
    salary: 98000,
    status: EmployeeStatus.ACTIVE,
  },
  {
    email: 'employee2@worksphere.local',
    department: 'Engineering',
    position: 'Software Engineer',
    managerEmail: 'manager1@worksphere.local',
    phone: '+1-555-0102',
    gender: Gender.MALE,
    dateOfBirth: '1996-07-22',
    address: '45 Cedar Ave, Austin, TX',
    joiningDate: monthsAgoISO(6),
    employmentType: EmploymentType.FULL_TIME,
    salary: 95000,
    status: EmployeeStatus.ACTIVE,
  },
  {
    email: 'employee3@worksphere.local',
    department: 'Engineering',
    position: 'Senior Software Engineer',
    managerEmail: 'manager1@worksphere.local',
    phone: '+1-555-0103',
    gender: Gender.FEMALE,
    dateOfBirth: '1990-11-05',
    address: '9 Maple Dr, Austin, TX',
    joiningDate: monthsAgoISO(18),
    employmentType: EmploymentType.FULL_TIME,
    salary: 128000,
    status: EmployeeStatus.ACTIVE,
  },
  {
    email: 'employee4@worksphere.local',
    department: 'Sales',
    position: 'Sales Executive',
    managerEmail: 'manager2@worksphere.local',
    phone: '+1-555-0104',
    gender: Gender.MALE,
    dateOfBirth: '1993-02-18',
    address: '78 Elm St, Chicago, IL',
    joiningDate: monthsAgoISO(8),
    employmentType: EmploymentType.FULL_TIME,
    salary: 72000,
    status: EmployeeStatus.ACTIVE,
  },
  {
    email: 'employee5@worksphere.local',
    department: 'Sales',
    position: 'Account Manager',
    managerEmail: 'manager2@worksphere.local',
    phone: '+1-555-0105',
    gender: Gender.FEMALE,
    dateOfBirth: '1995-05-30',
    address: '21 Spruce Ln, Chicago, IL',
    joiningDate: monthsAgoISO(5),
    employmentType: EmploymentType.FULL_TIME,
    salary: 76000,
    status: EmployeeStatus.ACTIVE,
  },
  {
    email: 'employee6@worksphere.local',
    department: 'Human Resources',
    position: 'HR Coordinator',
    managerEmail: 'hr1@worksphere.local',
    phone: '+1-555-0106',
    gender: Gender.MALE,
    dateOfBirth: '1997-09-14',
    address: '5 Willow Ct, Denver, CO',
    joiningDate: monthsAgoISO(4),
    employmentType: EmploymentType.FULL_TIME,
    salary: 61000,
    status: EmployeeStatus.ACTIVE,
  },
  {
    email: 'employee7@worksphere.local',
    department: 'Human Resources',
    position: 'Recruiter',
    managerEmail: 'hr1@worksphere.local',
    phone: '+1-555-0107',
    gender: Gender.FEMALE,
    dateOfBirth: '1992-12-01',
    address: '33 Poplar Ave, Denver, CO',
    joiningDate: monthsAgoISO(14),
    employmentType: EmploymentType.FULL_TIME,
    salary: 64000,
    status: EmployeeStatus.ON_LEAVE,
  },
  {
    email: 'employee8@worksphere.local',
    department: 'Finance',
    position: 'Financial Analyst',
    managerEmail: 'hr2@worksphere.local',
    phone: '+1-555-0108',
    gender: Gender.MALE,
    dateOfBirth: '1991-04-27',
    address: '88 Aspen Way, Seattle, WA',
    joiningDate: monthsAgoISO(16),
    employmentType: EmploymentType.FULL_TIME,
    salary: 82000,
    status: EmployeeStatus.INACTIVE,
  },
  {
    email: 'employee9@worksphere.local',
    department: 'Marketing',
    position: 'Marketing Specialist',
    managerEmail: null,
    phone: '+1-555-0109',
    gender: Gender.FEMALE,
    dateOfBirth: '1998-06-19',
    address: '17 Magnolia St, Portland, OR',
    joiningDate: monthsAgoISO(3),
    employmentType: EmploymentType.PART_TIME,
    salary: 48000,
    status: EmployeeStatus.ACTIVE,
  },
  {
    email: 'employee10@worksphere.local',
    department: 'Marketing',
    position: 'Content Strategist',
    managerEmail: null,
    phone: '+1-555-0110',
    gender: Gender.MALE,
    dateOfBirth: '1999-10-08',
    address: '60 Sycamore Blvd, Portland, OR',
    joiningDate: monthsAgoISO(1),
    employmentType: EmploymentType.INTERN,
    salary: 38000,
    status: EmployeeStatus.ACTIVE,
  },
];

function daysFromToday(offset: number): Date {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + offset);
  return date;
}

/** ISO date string N months before today - keeps joiningDate evergreen so the employee-growth chart has real recent data on every reseed. */
function monthsAgoISO(months: number): string {
  const now = new Date();
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - months, now.getUTCDate()));
  return date.toISOString().slice(0, 10);
}

function withTime(date: Date, hours: number, minutes: number): Date {
  const result = new Date(date);
  result.setUTCHours(hours, minutes, 0, 0);
  return result;
}

/** The `count` most recent weekdays, ending at today (or the prior Friday if today is a weekend). */
function pastWeekdays(count: number): Date[] {
  const dates: Date[] = [];
  const cursor = daysFromToday(0);
  while (dates.length < count) {
    const day = cursor.getUTCDay();
    if (day !== 0 && day !== 6) {
      dates.push(new Date(cursor));
    }
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return dates.reverse();
}

function dateRange(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  const cursor = new Date(start);
  while (cursor.getTime() <= end.getTime()) {
    dates.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

interface SeedLeave {
  email: string;
  leaveType: LeaveType;
  startOffset: number;
  endOffset: number;
  reason: string;
  status: LeaveStatus;
  reviewerEmail: string | null;
  reviewNote?: string;
}

const seedLeaves: SeedLeave[] = [
  {
    email: 'employee7@worksphere.local',
    leaveType: LeaveType.SICK,
    startOffset: -1,
    endOffset: 2,
    reason: 'Recovering from a flu, doctor recommended rest through the week.',
    status: LeaveStatus.APPROVED,
    reviewerEmail: 'hr1@worksphere.local',
  },
  {
    email: 'employee1@worksphere.local',
    leaveType: LeaveType.ANNUAL,
    startOffset: 14,
    endOffset: 18,
    reason: 'Family trip booked for the third week of next month.',
    status: LeaveStatus.PENDING,
    reviewerEmail: null,
  },
  {
    email: 'employee2@worksphere.local',
    leaveType: LeaveType.SICK,
    startOffset: 2,
    endOffset: 3,
    reason: 'Follow-up medical appointment and recovery day.',
    status: LeaveStatus.PENDING,
    reviewerEmail: null,
  },
  {
    email: 'employee4@worksphere.local',
    leaveType: LeaveType.CASUAL,
    startOffset: 5,
    endOffset: 5,
    reason: 'Attending a family event.',
    status: LeaveStatus.PENDING,
    reviewerEmail: null,
  },
  {
    email: 'employee6@worksphere.local',
    leaveType: LeaveType.EMERGENCY,
    startOffset: 1,
    endOffset: 1,
    reason: 'Urgent family matter that requires my attention tomorrow.',
    status: LeaveStatus.PENDING,
    reviewerEmail: null,
  },
  {
    email: 'employee3@worksphere.local',
    leaveType: LeaveType.ANNUAL,
    startOffset: -30,
    endOffset: -25,
    reason: 'Annual leave taken last month.',
    status: LeaveStatus.APPROVED,
    reviewerEmail: 'manager1@worksphere.local',
  },
  {
    email: 'employee5@worksphere.local',
    leaveType: LeaveType.CASUAL,
    startOffset: -10,
    endOffset: -9,
    reason: 'Wanted to extend the weekend for a personal trip.',
    status: LeaveStatus.REJECTED,
    reviewerEmail: 'manager2@worksphere.local',
    reviewNote: 'Team was short-staffed that week during a customer launch; please propose different dates.',
  },
  {
    email: 'employee8@worksphere.local',
    leaveType: LeaveType.UNPAID,
    startOffset: -60,
    endOffset: -55,
    reason: 'Personal leave of absence.',
    status: LeaveStatus.APPROVED,
    reviewerEmail: 'hr2@worksphere.local',
  },
  {
    email: 'employee9@worksphere.local',
    leaveType: LeaveType.CASUAL,
    startOffset: 7,
    endOffset: 7,
    reason: 'Personal appointment.',
    status: LeaveStatus.PENDING,
    reviewerEmail: null,
  },
  {
    email: 'employee10@worksphere.local',
    leaveType: LeaveType.ANNUAL,
    startOffset: -15,
    endOffset: -14,
    reason: 'Short trip home during a quiet sprint week.',
    status: LeaveStatus.APPROVED,
    reviewerEmail: 'hr1@worksphere.local',
  },
];

interface SeedPerformanceReview {
  employeeEmail: string;
  reviewerEmail: string;
  reviewPeriod: string;
  overallRating: PerformanceRating;
  goals: string;
  achievements: string;
  strengths: string;
  areasForImprovement: string;
  managerComments: string;
}

const seedPerformanceReviews: SeedPerformanceReview[] = [
  {
    employeeEmail: 'employee1@worksphere.local',
    reviewerEmail: 'manager1@worksphere.local',
    reviewPeriod: 'Q1 2026',
    overallRating: PerformanceRating.EXCEEDS_EXPECTATIONS,
    goals: 'Ship the new onboarding flow and mentor one junior engineer.',
    achievements: 'Delivered the onboarding flow two weeks ahead of schedule and onboarded a new hire.',
    strengths: 'Strong ownership, clear communication with design and product.',
    areasForImprovement: 'Could delegate more of the code-review load to reduce bottlenecks.',
    managerComments: 'Sofia had a standout quarter. Recommending for the senior track next cycle.',
  },
  {
    employeeEmail: 'employee2@worksphere.local',
    reviewerEmail: 'manager1@worksphere.local',
    reviewPeriod: 'Q1 2026',
    overallRating: PerformanceRating.MEETS_EXPECTATIONS,
    goals: 'Improve test coverage on the billing service and close 15 sprint tickets.',
    achievements: 'Closed 14 sprint tickets and raised billing service coverage from 40% to 65%.',
    strengths: 'Reliable, thorough in code review, good bug triage instincts.',
    areasForImprovement: 'Estimation accuracy on larger tasks needs work.',
    managerComments: 'Solid, consistent quarter. Focus on breaking down large tasks earlier.',
  },
  {
    employeeEmail: 'employee3@worksphere.local',
    reviewerEmail: 'manager1@worksphere.local',
    reviewPeriod: 'Q1 2026',
    overallRating: PerformanceRating.OUTSTANDING,
    goals: 'Lead the migration to the new deployment pipeline.',
    achievements: 'Migrated all services with zero downtime and wrote the runbook the team now uses.',
    strengths: 'Deep technical expertise, calm under pressure, excellent documentation.',
    areasForImprovement: 'Could share more context earlier when plans change.',
    managerComments: 'Exceptional quarter - this is exactly the kind of ownership we want to see more of.',
  },
  {
    employeeEmail: 'employee4@worksphere.local',
    reviewerEmail: 'manager2@worksphere.local',
    reviewPeriod: 'Q1 2026',
    overallRating: PerformanceRating.MEETS_EXPECTATIONS,
    goals: 'Hit $120k in closed pipeline and improve discovery call notes.',
    achievements: 'Closed $115k in new business and adopted the new call-notes template team-wide.',
    strengths: 'Great rapport with prospects, persistent follow-up.',
    areasForImprovement: 'Needs to qualify leads earlier to avoid late-stage drop-off.',
    managerComments: 'Just under target but trending the right way. Keep tightening qualification.',
  },
  {
    employeeEmail: 'employee5@worksphere.local',
    reviewerEmail: 'manager2@worksphere.local',
    reviewPeriod: 'Q1 2026',
    overallRating: PerformanceRating.NEEDS_IMPROVEMENT,
    goals: 'Reduce account churn in the mid-market book below 5%.',
    achievements: 'Retained two at-risk accounts through proactive check-ins.',
    strengths: 'Genuine relationship builder, well-liked by customers.',
    areasForImprovement: 'Churn is still at 9%; needs a more consistent renewal-risk process.',
    managerComments:
      'We need to see the renewal playbook actually used every cycle, not just when an account is already at risk.',
  },
];

interface SeedJob {
  title: string;
  department: string | null;
  description: string;
  requirements: string;
  location: string;
  employmentType: EmploymentType;
  salaryRangeMin: number | null;
  salaryRangeMax: number | null;
  status: JobStatus;
  postedByEmail: string | null;
}

const seedJobs: SeedJob[] = [
  {
    title: 'Senior Backend Engineer',
    department: 'Engineering',
    description: 'Own the core API platform and mentor the rest of the backend team.',
    requirements: '5+ years backend experience, strong TypeScript/Node.js, PostgreSQL.',
    location: 'Austin, TX (Hybrid)',
    employmentType: EmploymentType.FULL_TIME,
    salaryRangeMin: 120000,
    salaryRangeMax: 150000,
    status: JobStatus.OPEN,
    postedByEmail: 'manager1@worksphere.local',
  },
  {
    title: 'Sales Development Representative',
    department: 'Sales',
    description: 'Generate and qualify new pipeline for the enterprise sales team.',
    requirements: '1-2 years SDR/BDR experience, excellent written communication.',
    location: 'Chicago, IL',
    employmentType: EmploymentType.FULL_TIME,
    salaryRangeMin: 55000,
    salaryRangeMax: 70000,
    status: JobStatus.OPEN,
    postedByEmail: 'manager2@worksphere.local',
  },
  {
    title: 'HR Generalist',
    department: 'Human Resources',
    description: 'Support onboarding, benefits administration, and employee relations.',
    requirements: '2+ years HR generalist experience, HRIS familiarity.',
    location: 'Denver, CO',
    employmentType: EmploymentType.FULL_TIME,
    salaryRangeMin: 58000,
    salaryRangeMax: 72000,
    status: JobStatus.OPEN,
    postedByEmail: 'hr1@worksphere.local',
  },
  {
    title: 'Financial Controller',
    department: 'Finance',
    description: 'Own monthly close, financial reporting, and audit readiness.',
    requirements: '7+ years accounting/finance experience, CPA preferred.',
    location: 'Seattle, WA',
    employmentType: EmploymentType.FULL_TIME,
    salaryRangeMin: 130000,
    salaryRangeMax: 160000,
    status: JobStatus.ON_HOLD,
    postedByEmail: 'hr2@worksphere.local',
  },
  {
    title: 'Marketing Coordinator',
    department: 'Marketing',
    description: 'Coordinate campaign execution across email, social, and events.',
    requirements: '1+ years marketing experience, strong project management.',
    location: 'Portland, OR (Remote)',
    employmentType: EmploymentType.FULL_TIME,
    salaryRangeMin: 50000,
    salaryRangeMax: 62000,
    status: JobStatus.CLOSED,
    postedByEmail: 'hr1@worksphere.local',
  },
];

interface SeedApplication {
  jobTitle: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: ApplicationStatus;
}

const seedApplications: SeedApplication[] = [
  {
    jobTitle: 'Senior Backend Engineer',
    firstName: 'Wei',
    lastName: 'Zhang',
    email: 'wei.zhang@applicant.example',
    phone: '+1-555-0301',
    status: ApplicationStatus.INTERVIEW,
  },
  {
    jobTitle: 'Senior Backend Engineer',
    firstName: 'Fatima',
    lastName: 'Haidari',
    email: 'fatima.haidari@applicant.example',
    phone: '+1-555-0302',
    status: ApplicationStatus.SCREENING,
  },
  {
    jobTitle: 'Senior Backend Engineer',
    firstName: 'Marcus',
    lastName: 'Bell',
    email: 'marcus.bell@applicant.example',
    phone: '+1-555-0303',
    status: ApplicationStatus.APPLIED,
  },
  {
    jobTitle: 'Sales Development Representative',
    firstName: 'Isabella',
    lastName: 'Rossi',
    email: 'isabella.rossi@applicant.example',
    phone: '+1-555-0304',
    status: ApplicationStatus.SELECTED,
  },
  {
    jobTitle: 'Sales Development Representative',
    firstName: 'Tom',
    lastName: 'Walker',
    email: 'tom.walker@applicant.example',
    phone: '+1-555-0305',
    status: ApplicationStatus.REJECTED,
  },
  {
    jobTitle: 'HR Generalist',
    firstName: 'Priya',
    lastName: 'Nair',
    email: 'priya.nair@applicant.example',
    phone: '+1-555-0306',
    status: ApplicationStatus.INTERVIEW,
  },
  {
    jobTitle: 'HR Generalist',
    firstName: 'Samuel',
    lastName: 'Okafor',
    email: 'samuel.okafor@applicant.example',
    phone: '+1-555-0307',
    status: ApplicationStatus.APPLIED,
  },
  {
    jobTitle: 'Marketing Coordinator',
    firstName: 'Elena',
    lastName: 'Petrova',
    email: 'elena.petrova@applicant.example',
    phone: '+1-555-0308',
    status: ApplicationStatus.SELECTED,
  },
];

interface SeedDocument {
  title: string;
  category: DocumentCategory;
  filename: string;
  content: string;
  employeeEmail: string | null;
  uploadedByEmail: string;
}

const seedDocuments: SeedDocument[] = [
  {
    title: 'Employee Handbook 2026',
    category: DocumentCategory.POLICY,
    filename: 'seed-employee-handbook.txt',
    content: 'WorkSphere Employee Handbook 2026 (seed placeholder).',
    employeeEmail: null,
    uploadedByEmail: 'hr1@worksphere.local',
  },
  {
    title: 'Remote Work Policy',
    category: DocumentCategory.POLICY,
    filename: 'seed-remote-work-policy.txt',
    content: 'WorkSphere Remote Work Policy (seed placeholder).',
    employeeEmail: null,
    uploadedByEmail: 'hr1@worksphere.local',
  },
  {
    title: 'Offer Letter',
    category: DocumentCategory.CONTRACT,
    filename: 'seed-offer-letter-sofia-costa.txt',
    content: 'Offer letter for Sofia Costa (seed placeholder).',
    employeeEmail: 'employee1@worksphere.local',
    uploadedByEmail: 'hr1@worksphere.local',
  },
  {
    title: 'AWS Certified Solutions Architect',
    category: DocumentCategory.CERTIFICATE,
    filename: 'seed-cert-ava-johansson.txt',
    content: 'AWS Certified Solutions Architect - Associate (seed placeholder).',
    employeeEmail: 'employee3@worksphere.local',
    uploadedByEmail: 'employee3@worksphere.local',
  },
];

interface SeedAnnouncement {
  title: string;
  content: string;
  publishedOffset: number;
  expiresOffset: number | null;
  createdByEmail: string;
}

const seedAnnouncements: SeedAnnouncement[] = [
  {
    title: 'Q1 All-Hands scheduled for next Friday',
    content:
      'Join us for the Q1 all-hands meeting covering company updates, product roadmap, and team shout-outs. Calendar invite to follow.',
    publishedOffset: -2,
    expiresOffset: 10,
    createdByEmail: 'hr1@worksphere.local',
  },
  {
    title: 'Updated Remote Work Policy is live',
    content:
      'We have refreshed the remote work policy effective this month. Please review the updated Remote Work Policy document in the Documents section.',
    publishedOffset: -5,
    expiresOffset: null,
    createdByEmail: 'hr1@worksphere.local',
  },
  {
    title: 'Open enrollment for benefits closes soon',
    content:
      'A reminder that open enrollment for health and dental benefits closes at the end of this month. Reach out to HR with any questions.',
    publishedOffset: -1,
    expiresOffset: 20,
    createdByEmail: 'hr2@worksphere.local',
  },
];

interface SeedNotification {
  userEmail: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  daysAgo: number;
}

const seedNotifications: SeedNotification[] = [
  {
    userEmail: 'employee1@worksphere.local',
    type: NotificationType.REVIEW_SUBMITTED,
    title: 'New performance review',
    message: 'A performance review for Q1 2026 has been submitted.',
    link: '/employee/performance',
    isRead: false,
    daysAgo: 1,
  },
  {
    userEmail: 'employee1@worksphere.local',
    type: NotificationType.ANNOUNCEMENT,
    title: 'New announcement',
    message: 'Q1 All-Hands scheduled for next Friday',
    link: null,
    isRead: true,
    daysAgo: 2,
  },
  {
    userEmail: 'employee7@worksphere.local',
    type: NotificationType.LEAVE_APPROVED,
    title: 'Leave request approved',
    message: 'Your sick leave request has been approved.',
    link: '/employee/leave',
    isRead: false,
    daysAgo: 1,
  },
  {
    userEmail: 'employee5@worksphere.local',
    type: NotificationType.LEAVE_REJECTED,
    title: 'Leave request rejected',
    message:
      'Your casual leave request was rejected: Team was short-staffed that week during a customer launch; please propose different dates.',
    link: '/employee/leave',
    isRead: true,
    daysAgo: 10,
  },
  {
    userEmail: 'hr1@worksphere.local',
    type: NotificationType.ANNOUNCEMENT,
    title: 'New announcement',
    message: 'Open enrollment for benefits closes soon',
    link: null,
    isRead: false,
    daysAgo: 1,
  },
];

async function main() {
  const passwordHash = await bcrypt.hash(DEV_PASSWORD, 10);

  const userIdByEmail = new Map<string, string>();
  for (const seedUser of seedUsers) {
    const user = await prisma.user.upsert({
      where: { email: seedUser.email },
      update: {},
      create: { ...seedUser, passwordHash },
    });
    userIdByEmail.set(seedUser.email, user.id);
  }
  console.log(`Seeded ${seedUsers.length} users. Dev password for all: ${DEV_PASSWORD}`);

  const departmentIdByName = new Map<string, string>();
  for (const [name, description] of Object.entries(departmentDescriptions)) {
    const department = await prisma.department.upsert({
      where: { name },
      update: {},
      create: { name, description },
    });
    departmentIdByName.set(name, department.id);
  }
  console.log(`Seeded ${departmentIdByName.size} departments.`);

  const employeeIdByEmail = new Map<string, string>();

  // Admin: an Employee record with no department, so they appear consistently
  // wherever employee data is browsed, without being part of the org chart.
  const adminUserId = userIdByEmail.get('admin@worksphere.local')!;
  const adminEmployee = await prisma.employee.upsert({
    where: { userId: adminUserId },
    update: {},
    create: { userId: adminUserId, position: 'System Administrator', status: EmployeeStatus.ACTIVE },
  });
  employeeIdByEmail.set('admin@worksphere.local', adminEmployee.id);

  // Department heads first (no managerId of their own within this seed).
  for (const head of departmentHeads) {
    const userId = userIdByEmail.get(head.email)!;
    const departmentId = departmentIdByName.get(head.department)!;
    const employee = await prisma.employee.upsert({
      where: { userId },
      update: { joiningDate: new Date(head.joiningDate) },
      create: {
        userId,
        departmentId,
        position: head.position,
        phone: head.phone,
        gender: head.gender,
        dateOfBirth: new Date(head.dateOfBirth),
        address: head.address,
        joiningDate: new Date(head.joiningDate),
        employmentType: EmploymentType.FULL_TIME,
        salary: head.salary,
        status: EmployeeStatus.ACTIVE,
      },
    });
    employeeIdByEmail.set(head.email, employee.id);
    await prisma.department.update({ where: { id: departmentId }, data: { managerId: employee.id } });
  }

  // Regular employees, referencing their department head as manager.
  for (const seedEmployee of seedEmployees) {
    const userId = userIdByEmail.get(seedEmployee.email)!;
    const departmentId = seedEmployee.department ? departmentIdByName.get(seedEmployee.department)! : null;
    const managerId = seedEmployee.managerEmail ? employeeIdByEmail.get(seedEmployee.managerEmail)! : null;

    const employee = await prisma.employee.upsert({
      where: { userId },
      update: { joiningDate: new Date(seedEmployee.joiningDate) },
      create: {
        userId,
        departmentId,
        managerId,
        position: seedEmployee.position,
        phone: seedEmployee.phone,
        gender: seedEmployee.gender,
        dateOfBirth: new Date(seedEmployee.dateOfBirth),
        address: seedEmployee.address,
        joiningDate: new Date(seedEmployee.joiningDate),
        employmentType: seedEmployee.employmentType,
        salary: seedEmployee.salary,
        status: seedEmployee.status,
      },
    });
    employeeIdByEmail.set(seedEmployee.email, employee.id);
  }
  console.log(`Seeded ${employeeIdByEmail.size} employee records.`);

  // Attendance: the last 20 weekdays for every employee, with a realistic
  // mostly-present distribution. Deterministic per (employee, date) via a
  // simple hash so re-seeding is idempotent in spirit even though the
  // upsert below already makes it idempotent in practice.
  const weekdays = pastWeekdays(20);
  let attendanceCount = 0;
  for (const [email, employeeId] of employeeIdByEmail) {
    for (const date of weekdays) {
      const hash = Math.abs(hashCode(`${email}:${date.toISOString()}`)) % 100;

      let status: AttendanceStatus;
      let checkIn: Date | null = null;
      let checkOut: Date | null = null;
      let workingHours: number | null = null;

      if (hash < 4) {
        status = AttendanceStatus.ABSENT;
      } else if (hash < 7) {
        status = AttendanceStatus.HALF_DAY;
        checkIn = withTime(date, 9, 5);
        checkOut = withTime(date, 13, 0);
        workingHours = 3.92;
      } else if (hash < 15) {
        status = AttendanceStatus.LATE;
        checkIn = withTime(date, 9, 45);
        checkOut = withTime(date, 18, 0);
        workingHours = 8.25;
      } else {
        status = AttendanceStatus.PRESENT;
        checkIn = withTime(date, 9, 0);
        checkOut = withTime(date, 17, 45);
        workingHours = 8.75;
      }

      await prisma.attendance.upsert({
        where: { employeeId_date: { employeeId, date } },
        update: {},
        create: { employeeId, date, status, checkIn, checkOut, workingHours },
      });
      attendanceCount += 1;
    }
  }
  console.log(`Seeded ${attendanceCount} attendance records across ${weekdays.length} weekdays.`);

  // Leave requests: a mix of pending/approved/rejected across different
  // reviewers, so the approval queue has real work in it out of the box.
  let leaveCount = 0;
  for (const leave of seedLeaves) {
    const employeeId = employeeIdByEmail.get(leave.email)!;
    const startDate = daysFromToday(leave.startOffset);
    const endDate = daysFromToday(leave.endOffset);
    const reviewerId = leave.reviewerEmail ? employeeIdByEmail.get(leave.reviewerEmail)! : null;

    const existing = await prisma.leaveRequest.findFirst({
      where: { employeeId, startDate, leaveType: leave.leaveType },
    });
    if (existing) continue;

    await prisma.leaveRequest.create({
      data: {
        employeeId,
        leaveType: leave.leaveType,
        startDate,
        endDate,
        reason: leave.reason,
        status: leave.status,
        reviewedById: reviewerId,
        reviewNote: leave.reviewNote ?? null,
      },
    });
    leaveCount += 1;

    if (leave.status === LeaveStatus.APPROVED) {
      for (const date of dateRange(startDate, endDate)) {
        await prisma.attendance.upsert({
          where: { employeeId_date: { employeeId, date } },
          update: { status: AttendanceStatus.ON_LEAVE },
          create: { employeeId, date, status: AttendanceStatus.ON_LEAVE },
        });
      }
    }
  }
  console.log(`Seeded ${leaveCount} leave requests.`);

  // Performance reviews: each manager reviewing their own direct reports.
  let reviewCount = 0;
  for (const review of seedPerformanceReviews) {
    const employeeId = employeeIdByEmail.get(review.employeeEmail)!;
    const reviewerId = employeeIdByEmail.get(review.reviewerEmail)!;

    const existingReview = await prisma.performanceReview.findFirst({
      where: { employeeId, reviewerId, reviewPeriod: review.reviewPeriod },
    });
    if (existingReview) continue;

    await prisma.performanceReview.create({
      data: {
        employeeId,
        reviewerId,
        reviewPeriod: review.reviewPeriod,
        overallRating: review.overallRating,
        goals: review.goals,
        achievements: review.achievements,
        strengths: review.strengths,
        areasForImprovement: review.areasForImprovement,
        managerComments: review.managerComments,
      },
    });
    reviewCount += 1;
  }
  console.log(`Seeded ${reviewCount} performance reviews.`);

  // Recruitment: jobs, applicants, applications, and interviews for the pipeline demo.
  const jobIdByTitle = new Map<string, string>();
  for (const job of seedJobs) {
    let existingJob = await prisma.job.findFirst({ where: { title: job.title } });
    if (!existingJob) {
      existingJob = await prisma.job.create({
        data: {
          title: job.title,
          departmentId: job.department ? departmentIdByName.get(job.department) : null,
          description: job.description,
          requirements: job.requirements,
          location: job.location,
          employmentType: job.employmentType,
          salaryRangeMin: job.salaryRangeMin,
          salaryRangeMax: job.salaryRangeMax,
          status: job.status,
          postedById: job.postedByEmail ? employeeIdByEmail.get(job.postedByEmail) : null,
        },
      });
    }
    jobIdByTitle.set(job.title, existingJob.id);
  }
  console.log(`Seeded ${jobIdByTitle.size} jobs.`);

  let applicationCount = 0;
  let interviewCount = 0;
  for (const application of seedApplications) {
    const jobId = jobIdByTitle.get(application.jobTitle)!;

    const applicant = await prisma.applicant.upsert({
      where: { email: application.email },
      update: {},
      create: {
        firstName: application.firstName,
        lastName: application.lastName,
        email: application.email,
        phone: application.phone,
      },
    });

    const existingApplication = await prisma.application.findUnique({
      where: { jobId_applicantId: { jobId, applicantId: applicant.id } },
    });
    if (existingApplication) continue;

    const created = await prisma.application.create({
      data: { jobId, applicantId: applicant.id, status: application.status },
    });
    applicationCount += 1;

    if (application.status === ApplicationStatus.INTERVIEW || application.status === ApplicationStatus.SELECTED) {
      const job = seedJobs.find((j) => j.title === application.jobTitle)!;
      await prisma.interview.create({
        data: {
          applicationId: created.id,
          scheduledAt: withTime(daysFromToday(-3), 14, 0),
          interviewerId: job.postedByEmail ? employeeIdByEmail.get(job.postedByEmail) : null,
          notes: 'Initial technical/cultural fit interview. Positive overall impression.',
        },
      });
      interviewCount += 1;
    }
  }
  console.log(`Seeded ${applicationCount} applications and ${interviewCount} interviews.`);

  // Payroll: last two months for every employee who has a salary on file.
  const salaryByEmail = new Map<string, number>(
    [...departmentHeads, ...seedEmployees].map((e) => [e.email, e.salary]),
  );
  const payrollMonths = [
    { offset: -1, status: PaymentStatus.PAID },
    { offset: 0, status: PaymentStatus.PENDING },
  ];
  let payrollCount = 0;
  for (const [email, employeeId] of employeeIdByEmail) {
    const annualSalary = salaryByEmail.get(email);
    if (!annualSalary) continue;

    const basicSalary = Math.round((annualSalary / 12) * 100) / 100;
    const allowances = Math.round(basicSalary * 0.05 * 100) / 100;
    const bonuses = 0;
    const deductions = Math.round(basicSalary * 0.02 * 100) / 100;
    const tax = Math.round(basicSalary * 0.18 * 100) / 100;
    const netSalary = Math.round((basicSalary + allowances + bonuses - deductions - tax) * 100) / 100;

    for (const { offset, status } of payrollMonths) {
      const month = new Date(Date.UTC(daysFromToday(0).getUTCFullYear(), daysFromToday(0).getUTCMonth() + offset, 1));

      const existingPayroll = await prisma.payroll.findUnique({
        where: { employeeId_month: { employeeId, month } },
      });
      if (existingPayroll) continue;

      await prisma.payroll.create({
        data: {
          employeeId,
          month,
          basicSalary,
          allowances,
          bonuses,
          deductions,
          tax,
          netSalary,
          paymentStatus: status,
        },
      });
      payrollCount += 1;
    }
  }
  console.log(`Seeded ${payrollCount} payroll records.`);

  // Documents: company-wide policies plus a couple of employee-specific files.
  let documentCount = 0;
  for (const doc of seedDocuments) {
    const employeeId = doc.employeeEmail ? employeeIdByEmail.get(doc.employeeEmail)! : null;
    const uploadedById = employeeIdByEmail.get(doc.uploadedByEmail)!;

    const existing = await prisma.document.findFirst({ where: { title: doc.title, employeeId } });
    if (existing) continue;

    const fileUrl = ensureSeedFile(doc.filename, doc.content);
    await prisma.document.create({
      data: { title: doc.title, category: doc.category, fileUrl, employeeId, uploadedById },
    });
    documentCount += 1;
  }
  console.log(`Seeded ${documentCount} documents.`);

  // Announcements: a small feed so dashboards aren't empty on first login.
  const announcementIdByTitle = new Map<string, string>();
  let announcementCount = 0;
  for (const announcement of seedAnnouncements) {
    const createdById = employeeIdByEmail.get(announcement.createdByEmail)!;
    const publishedAt = daysFromToday(announcement.publishedOffset);
    const expiresAt = announcement.expiresOffset !== null ? daysFromToday(announcement.expiresOffset) : null;

    let existing = await prisma.announcement.findFirst({ where: { title: announcement.title } });
    if (!existing) {
      existing = await prisma.announcement.create({
        data: { title: announcement.title, content: announcement.content, publishedAt, expiresAt, createdById },
      });
      announcementCount += 1;
    }
    announcementIdByTitle.set(announcement.title, existing.id);
  }
  console.log(`Seeded ${announcementCount} announcements.`);

  // Notifications: a few pre-populated so the bell/panel has demo content immediately.
  let notificationCount = 0;
  for (const notification of seedNotifications) {
    const userId = userIdByEmail.get(notification.userEmail)!;
    const createdAt = withTime(daysFromToday(-notification.daysAgo), 9, 0);

    const existing = await prisma.notification.findFirst({
      where: { userId, title: notification.title, message: notification.message },
    });
    if (existing) continue;

    await prisma.notification.create({
      data: {
        userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        link: notification.link,
        isRead: notification.isRead,
        createdAt,
      },
    });
    notificationCount += 1;
  }
  console.log(`Seeded ${notificationCount} notifications.`);
}

function hashCode(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
