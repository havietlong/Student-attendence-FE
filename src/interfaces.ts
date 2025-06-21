export interface Student {
  studentId: string;
  fullName: string;
  dateOfBirth: Date;
  gender: string;
  address?: string;
  email?: string;
  phoneNumber?: string;
  classId: string;
  studyStatus: string;
  deletedAt?: Date;    
}

export interface Subject {
  subjectCode: string;
  subjectName: string;
}

export interface Lecturer {
  lecturerId: string;
  fullName: string;
}