export interface Question {
  id: number;
  category: 'BASE2' | 'CACHE' | 'CPU' | 'PHOTO' | 'JAVA';
  categoryName: string;
  question: string;
  options: string[];
  correctAnswer: number; // Index ของคำตอบที่ถูกต้อง (0-3)
}

export const QUESTIONS_DATABASE: Question[] = [
  // 1. เลขฐาน 2 (บวก/ลบ/คูณ)
  {
    id: 1,
    category: 'BASE2',
    categoryName: 'เลขฐานสอง',
    question: 'ผลลัพธ์ของ 1010₂ + 0101₂ ในเลขฐานสองคือข้อใด?',
    options: ['1111₂', '1001₂', '1100₂', '1010₂'],
    correctAnswer: 0,
  },
  {
    id: 2,
    category: 'BASE2',
    categoryName: 'เลขฐานสอง',
    question: 'ผลลัพธ์ของ 1100₂ - 0100₂ เท่ากับข้อใด?',
    options: ['1000₂', '0100₂', '0010₂', '1110₂'],
    correctAnswer: 0,
  },
  // 2. Cache Memory (ระดับ ป.ตรี)
  {
    id: 3,
    category: 'CACHE',
    categoryName: 'Cache Memory',
    question: 'กลไก Mapping ของ Cache แบบใดที่ยืดหยุ่นที่สุดและลด Cache Miss ได้ดีที่สุด?',
    options: ['Direct Mapping', 'Fully Associative Mapping', 'Set-Associative Mapping', 'Block Mapping'],
    correctAnswer: 1,
  },
  // 3. การทำงาน CPU (ระดับ ปวส.1)
  {
    id: 4,
    category: 'CPU',
    categoryName: 'การทำงานของ CPU',
    question: 'ขั้นตอนแรกของ Machine Cycle ในซีพียูคืออะไร?',
    options: ['Decode', 'Execute', 'Fetch', 'Store'],
    correctAnswer: 2,
  },
  // 4. หลักการถ่ายภาพ (ระดับ ป.ตรี)
  {
    id: 5,
    category: 'PHOTO',
    categoryName: 'หลักการถ่ายภาพ',
    question: 'การปรับค่า F-stop รูรับแสงให้แคบลง (เช่น F/16) จะส่งผลต่อภาพอย่างไร?',
    options: ['ระยะชัดลึกเพิ่มขึ้น (ชัดทั้งภาพ)', 'ฉากหลังละลายมากขึ้น', 'ภาพสว่างขึ้นมาก', 'เกิด Motion Blur'],
    correctAnswer: 0,
  },
  // 5. เขียนภาษา Java เบื้องต้น
  {
    id: 6,
    category: 'JAVA',
    categoryName: 'ภาษา Java',
    question: 'ชนิดข้อมูลแบบใดใน Java ที่ใช้เก็บตัวอักษรเพียง 1 ตัวอักษร?',
    options: ['String', 'char', 'byte', 'boolean'],
    correctAnswer: 1,
  },
];