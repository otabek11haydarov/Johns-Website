import { v4 as uuidv4 } from 'uuid';
export const users =[
  {
    id: "admin-1",
    username: "Admin",
    email: "gubernatr007@gmail.com",
    password: "$2b$10$pcueUQOOZVm1y06/gjWPOeTRCUg3FGF.7nkeZx6tj0mhFLsQ72142",
    role: "admin",
  },
];
export const Library = [];
export const books = [];
export const demoActivity = [
  {
    rank: 1,
    name: "Madina Yusuf",
    email: "madina.yusuf@gmail.com",
    group: "C2",
    score: 98,
  },
  {
    rank: 2,
    name: "Jasur Eshonqulov",
    email: "jasur.dev@gmail.com",
    group: "C1",
    score: 96,
  },
  {
    rank: 3,
    name: "Sitora Mamatova",
    email: "sitora.math@gmail.com",
    group: "B2",
    score: 94,
  },
  {
    rank: 4,
    name: "Ulugbek Norov",
    email: "ulugbek.ui@gmail.com",
    group: "B1",
    score: 92,
  },
  {
    rank: 5,
    name: "Aziza Karimova",
    email: "aziza.karimova@gmail.com",
    group: "A2",
    score: 90,
  },
];
export const demoStudents = [
  {
    id: "STD-1001",
    name: "Madina Yusuf",
    email: "madina.yusuf@gmail.com",
    program: "English Foundation",
    joined: "12 Apr 2026",
    status: "Active",
  },
  {
    id: "STD-1002",
    name: "Jasur Eshonqulov",
    email: "jasur.dev@gmail.com",
    program: "Frontend Bootcamp",
    joined: "09 Apr 2026",
    status: "Pending",
  },
  {
    id: "STD-1003",
    name: "Sitora Mamatova",
    email: "sitora.math@gmail.com",
    program: "SAT Math Prep",
    joined: "01 Apr 2026",
    status: "Active",
  },
  {
    id: "STD-1004",
    name: "Ulugbek Norov",
    email: "ulugbek.ui@gmail.com",
    program: "UI UX Essentials",
    joined: "28 Mar 2026",
    status: "Offline",
  },
];
export const demoGroups = [
  {
    id: uuidv4(),
    level: "A1",
    label: "CEFR Group",
    title: "A1",
    description: "Beginner learners group",
    studentsCount: 18,
    mentor: "Malika Rahimova",
    lessonsPerWeek: 3,
    room: "Room 101",
    status: "Active",
  },
  {
    id: uuidv4(),
    level: "A2",
    label: "CEFR Group",
    title: "A2",
    description: "Elementary progression group",
    studentsCount: 20,
    mentor: "Javohir Tursunov",
    lessonsPerWeek: 3,
    room: "Room 102",
    status: "Active",
  },
  {
    id: uuidv4(),
    level: "B1",
    label: "CEFR Group",
    title: "B1",
    description: "Intermediate communication group",
    studentsCount: 16,
    mentor: "Dilnoza Karimova",
    lessonsPerWeek: 4,
    room: "Room 201",
    status: "Active",
  },
  {
    id: uuidv4(),
    level: "B2",
    label: "CEFR Group",
    title: "B2",
    description: "Upper-intermediate practice group",
    studentsCount: 14,
    mentor: "Bekzod Islomov",
    lessonsPerWeek: 4,
    room: "Room 202",
    status: "Active",
  },
  {
    id: uuidv4(),
    level: "C1",
    label: "CEFR Group",
    title: "C1",
    description: "Advanced fluency group",
    studentsCount: 12,
    mentor: "Nigina Qodirova",
    lessonsPerWeek: 5,
    room: "Room 301",
    status: "Active",
  },
  {
    id: uuidv4(),
    level: "C2",
    label: "CEFR Group",
    title: "C2",
    description: "Mastery and expert-level group",
    studentsCount: 10,
    mentor: "Sardor Yuldashev",
    lessonsPerWeek: 5,
    room: "Room 302",
    status: "Active",
  },
];

export const lessons = [
  {
    id: uuidv4(),
    title: "Introducing Yourself",
    groupLevel: "A1",
    description: "Students practice basic greetings and simple self-introduction phrases.",
    tasks: [
      {
        id: uuidv4(),
        description: "Write 5 sentences to introduce yourself in English.",
      },
      {
        id: uuidv4(),
        description: "Practice a short greeting dialogue with a partner.",
      },
    ],
  },
  {
    id: uuidv4(),
    title: "Daily Routines",
    groupLevel: "A2",
    description: "Students describe everyday habits using present simple tense.",
    tasks: [
      {
        id: uuidv4(),
        description: "Create a daily routine paragraph with at least 8 sentences.",
      },
      {
        id: uuidv4(),
        description: "Match common routine verbs with the correct pictures.",
      },
    ],
  },
  {
    id: uuidv4(),
    title: "Travel and Experiences",
    groupLevel: "B1",
    description: "Students talk about past trips and memorable life experiences.",
    tasks: [
      {
        id: uuidv4(),
        description: "Describe your last trip using past tense verbs.",
      },
      {
        id: uuidv4(),
        description: "Prepare 3 questions to interview a classmate about travel.",
      },
    ],
  },
  {
    id: uuidv4(),
    title: "Debate and Opinion",
    groupLevel: "C1",
    description: "Students build arguments and support opinions in spoken discussion.",
    tasks: [
      {
        id: uuidv4(),
        description: "Write a short opinion essay on online education.",
      },
      {
        id: uuidv4(),
        description: "List 4 arguments for a classroom debate activity.",
      },
    ],
  },
];

export const tasks = [
  {
    id: uuidv4(),
    description: "Complete the vocabulary worksheet for lesson review.",
  },
  {
    id: uuidv4(),
    description: "Record a 1-minute speaking task and submit it.",
  },
  {
    id: uuidv4(),
    description: "Read the short passage and answer comprehension questions.",
  },
  {
    id: uuidv4(),
    description: "Prepare 10 new words from the lesson with translations.",
  },
];
