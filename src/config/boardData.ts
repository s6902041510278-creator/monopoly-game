export interface BoardTile {
  id: number;
  name: string;
  type: 'START' | 'PROPERTY' | 'QUESTION' | 'WARP' | 'JAIL' | 'RANDOM_REWARD';
  price?: number; // คะแนนที่ใช้ซื้อ
  color?: string;
  col: number;
  row: number;
}

export const BOARD_TILES: BoardTile[] = [
  // ด้านล่าง (0 - 10): ซ้ายไปขวา
  { id: 0, name: 'จุดเริ่มต้น', type: 'START', col: 11, row: 11, color: 'bg-emerald-500' },
  { id: 1, name: 'คำถาม 1', type: 'QUESTION', col: 10, row: 11, color: 'bg-purple-600' },
  { id: 2, name: 'หอไอเฟล (ฝรั่งเศส)', type: 'PROPERTY', price: 150, col: 9, row: 11, color: 'bg-amber-700' },
  { id: 3, name: 'พิพิธภัณฑ์ลูฟร์', type: 'PROPERTY', price: 100, col: 8, row: 11, color: 'bg-amber-700' },
  { id: 4, name: 'พระราชวังแวร์ซาย', type: 'PROPERTY', price: 100, col: 7, row: 11, color: 'bg-amber-700' },
  { id: 5, name: 'คำถาม 2', type: 'QUESTION', col: 6, row: 11, color: 'bg-purple-600' },
  { id: 6, name: 'โคลอสเซียม (อิตาลี)', type: 'PROPERTY', price: 200, col: 5, row: 11, color: 'bg-sky-500' },
  { id: 7, name: 'หอเอนปิซา', type: 'PROPERTY', price: 250, col: 4, row: 11, color: 'bg-sky-500' },
  { id: 8, name: 'มหาวิหารเวนิส', type: 'PROPERTY', price: 100, col: 3, row: 11, color: 'bg-sky-500' },
  { id: 9, name: 'คำถาม 3', type: 'QUESTION', col: 2, row: 11, color: 'bg-purple-600' },
  { id: 10, name: 'สุ่มวาร์ป', type: 'WARP', col: 1, row: 11, color: 'bg-blue-600' },

  // ด้านซ้าย (11 - 19): ล่างขึ้นบน
  { id: 11, name: 'คำถาม 4', type: 'QUESTION', col: 1, row: 10, color: 'bg-purple-600' },
  { id: 12, name: 'ซากราดา ฟามิเลีย (สเปน)', type: 'PROPERTY', price: 150, col: 1, row: 9, color: 'bg-pink-600' },
  { id: 13, name: 'พระราชวังอัลฮัมบรา', type: 'PROPERTY', price: 100, col: 1, row: 8, color: 'bg-pink-600' },
  { id: 14, name: 'บิ๊กเบน (อังกฤษ)', type: 'PROPERTY', price: 100, col: 1, row: 7, color: 'bg-pink-600' },
  { id: 15, name: 'คำถาม 5', type: 'QUESTION', col: 1, row: 6, color: 'bg-purple-600' },
  { id: 16, name: 'ลอนดอนอาย', type: 'PROPERTY', price: 200, col: 1, row: 5, color: 'bg-orange-500' },
  { id: 17, name: 'สโตนเฮนจ์', type: 'PROPERTY', price: 250, col: 1, row: 4, color: 'bg-orange-500' },
  { id: 18, name: 'ปราสาทเอดินบะระ', type: 'PROPERTY', price: 100, col: 1, row: 3, color: 'bg-orange-500' },
  { id: 19, name: 'คำถาม 6', type: 'QUESTION', col: 1, row: 2, color: 'bg-purple-600' },
  { id: 20, name: 'ติดคุก (2 รอบ)', type: 'JAIL', col: 1, row: 1, color: 'bg-rose-700' },

  // ด้านบน (21 - 29): ซ้ายไปขวา
  { id: 21, name: 'คำถาม 7', type: 'QUESTION', col: 2, row: 1, color: 'bg-purple-600' },
  { id: 22, name: 'ภูเขาไฟฟูจิ (ญี่ปุ่น)', type: 'PROPERTY', price: 150, col: 3, row: 1, color: 'bg-red-500' },
  { id: 23, name: 'วัดคิโยมิซุ', type: 'PROPERTY', price: 100, col: 4, row: 1, color: 'bg-red-500' },
  { id: 24, name: 'ศาลเจ้าฟูชิมิอินาริ', type: 'PROPERTY', price: 100, col: 5, row: 1, color: 'bg-red-500' },
  { id: 25, name: 'คำถาม 8', type: 'QUESTION', col: 6, row: 1, color: 'bg-purple-600' },
  { id: 26, name: 'กำแพงเมืองจีน (จีน)', type: 'PROPERTY', price: 200, col: 7, row: 1, color: 'bg-yellow-500' },
  { id: 27, name: 'พระราชวังต้องห้าม', type: 'PROPERTY', price: 250, col: 8, row: 1, color: 'bg-yellow-500' },
  { id: 28, name: 'ทัชมาฮาล (อินเดีย)', type: 'PROPERTY', price: 100, col: 9, row: 1, color: 'bg-yellow-500' },
  { id: 29, name: 'คำถาม 9', type: 'QUESTION', col: 10, row: 1, color: 'bg-purple-600' },
  { id: 30, name: 'สุ่มรางวัล / โดนหัก', type: 'RANDOM_REWARD', col: 11, row: 1, color: 'bg-amber-500' },

  // ด้านขวา (31 - 39): บนลงล่าง
  { id: 31, name: 'คำถาม 10', type: 'QUESTION', col: 11, row: 2, color: 'bg-purple-600' },
  { id: 32, name: 'เทพีเสรีภาพ (อเมริกา)', type: 'PROPERTY', price: 150, col: 11, row: 3, color: 'bg-emerald-600' },
  { id: 33, name: 'แกรนด์แคนยอน', type: 'PROPERTY', price: 100, col: 11, row: 4, color: 'bg-emerald-600' },
  { id: 34, name: 'สะพานโกลเดนเกต', type: 'PROPERTY', price: 100, col: 11, row: 5, color: 'bg-emerald-600' },
  { id: 35, name: 'คำถาม 11', type: 'QUESTION', col: 11, row: 6, color: 'bg-purple-600' },
  { id: 36, name: 'มาซูปิกชู (เปรู)', type: 'PROPERTY', price: 200, col: 11, row: 7, color: 'bg-indigo-500' },
  { id: 37, name: 'ชีเชนอิตซา (เม็กซิโก)', type: 'PROPERTY', price: 250, col: 11, row: 8, color: 'bg-indigo-500' },
  { id: 38, name: 'คริสโตเรเดนเตอร์ (บราซิล)', type: 'PROPERTY', price: 100, col: 11, row: 9, color: 'bg-indigo-500' },
  { id: 39, name: 'คำถาม 12', type: 'QUESTION', col: 11, row: 10, color: 'bg-purple-600' },
];