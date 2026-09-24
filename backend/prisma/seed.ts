import {
  AttendanceStatus,
  EmployeeStatus,
  EmploymentType,
  Gender,
  LeaveStatus,
  LeaveType,
  PrismaClient,
  Role,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEV_PASSWORD = 'Password123!';

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
    joiningDate: '2019-04-08',
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
    joiningDate: '2019-10-21',
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
    joiningDate: '2018-07-02',
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
    joiningDate: '2019-02-18',
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
    joiningDate: '2022-06-01',
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
    joiningDate: '2023-01-15',
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
    joiningDate: '2020-09-10',
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
    joiningDate: '2022-11-01',
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
    joiningDate: '2023-04-03',
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
    joiningDate: '2023-08-21',
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
    joiningDate: '2021-03-15',
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
    joiningDate: '2020-01-06',
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
    joiningDate: '2024-02-12',
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
    joiningDate: '2024-09-02',
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
      update: {},
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
      update: {},
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
