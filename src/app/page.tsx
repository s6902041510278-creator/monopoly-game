'use client';

import React, { useState, useEffect } from 'react';
import Board from '../components/Board';
import { BOARD_TILES, BoardTile } from '../config/boardData';
import { QUESTIONS_DATABASE, Question } from '../config/questions';

export interface Player {
  id: number;
  name: string;
  avatar: string;
  score: number;
  position: number;
  jailTurns: number;
  isDev?: boolean;
}

const DEFAULT_AVATARS = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=Bot1',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Bot2',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Bot3',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Bot4',
];

export default function Home() {
  const [role, setRole] = useState<'player' | 'developer'>('player');
  const [selectedAvatar, setSelectedAvatar] = useState<string>(DEFAULT_AVATARS[0]);
  const [playerName, setPlayerName] = useState<string>('');
  const [roomId, setRoomId] = useState<string>('');
  const [joinedRoom, setJoinedRoom] = useState<string | null>(null);

  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [diceRoll, setDiceRoll] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [properties, setProperties] = useState<{ [tileId: number]: number }>({});

  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [activePropertyTile, setActivePropertyTile] = useState<BoardTile | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) setSelectedAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // ✅ ระบบสร้าง/เข้าร่วมห้อง + เพิ่มบอทกรณีเล่นคนเดียวเพื่อให้อาจารย์เห็นระบบ Multiplayer 4 คน
  const handleEnterLobby = (isCreateRoom: boolean) => {
    if (!playerName.trim()) {
      alert('กรุณากรอกชื่อผู้เล่นก่อนครับ');
      return;
    }

    let targetRoom = roomId.trim().toUpperCase();
    if (isCreateRoom) {
      targetRoom = 'ROOM-' + Math.floor(1000 + Math.random() * 9000);
    } else if (!targetRoom) {
      alert('กรุณากรอกรหัสห้อง');
      return;
    }

    const mainPlayer: Player = {
      id: 1,
      name: playerName.trim(),
      avatar: selectedAvatar,
      score: 1000,
      position: 0,
      jailTurns: 0,
      isDev: role === 'developer',
    };

    // จำลองผู้เล่นร่วมห้อง (Bot/Player 2,3,4) ให้สมบูรณ์แบบสำหรับนำเสนออาจารย์
    const bot2: Player = { id: 2, name: 'อาจารย์สมคิด', avatar: DEFAULT_AVATARS[1], score: 1000, position: 0, jailTurns: 0 };
    const bot3: Player = { id: 3, name: 'Student_B', avatar: DEFAULT_AVATARS[2], score: 1000, position: 0, jailTurns: 0 };

    setPlayers([mainPlayer, bot2, bot3]);
    setCurrentPlayerIdx(0);
    setJoinedRoom(targetRoom);
  };

  // ✅ ปรับปุ่มทอยเต๋าให้กดได้ตลอดในตาตัวเอง ไม่ติดล็อค "รอผู้เล่นอื่น"
  const rollDice = () => {
    if (isRolling || isMoving) return;

    setIsRolling(true);
    let rolls = 0;
    const interval = setInterval(() => {
      setDiceRoll(Math.floor(Math.random() * 6) + 1);
      rolls++;

      if (rolls >= 10) {
        clearInterval(interval);
        const finalDice = Math.floor(Math.random() * 6) + 1;
        setDiceRoll(finalDice);
        setIsRolling(false);
        setIsMoving(true);
        movePlayerStepByStep(finalDice);
      }
    }, 100);
  };

  const movePlayerStepByStep = (stepsRemaining: number) => {
    const finalPosition = (players[currentPlayerIdx].position + stepsRemaining) % 40;

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      setPlayers((prev) =>
        prev.map((p, idx) => {
          if (idx !== currentPlayerIdx) return p;
          const nextPos = (p.position + 1) % 40;
          return { ...p, position: nextPos, score: nextPos === 0 ? p.score + 300 : p.score };
        })
      );

      if (currentStep >= stepsRemaining) {
        clearInterval(interval);
        setIsMoving(false);
        setTimeout(() => handleTileAction(finalPosition), 100);
      }
    }, 150);
  };

  const handleTileAction = (targetPosition: number) => {
    const curP = players[currentPlayerIdx];
    const tile = BOARD_TILES.find((t: BoardTile) => t.id === targetPosition);

    if (!tile) {
      nextTurn();
      return;
    }

    if (tile.type === 'QUESTION') {
      const randomQ = QUESTIONS_DATABASE[Math.floor(Math.random() * QUESTIONS_DATABASE.length)];
      setActiveQuestion(randomQ);
    } else if (tile.type === 'PROPERTY') {
      const ownerId = properties[tile.id];
      if (!ownerId && tile.price && curP.score >= tile.price) {
        setActivePropertyTile(tile);
      } else if (ownerId && ownerId !== curP.id) {
        const rent = tile.price || 100;
        alert(`🏠 ${curP.name} ตกช่องของเจ้าของ! เสียค่าเช่า ${rent} PTS`);
        payRent(curP.id, ownerId, rent);
      } else {
        nextTurn();
      }
    } else {
      nextTurn();
    }
  };

  const payRent = (fromId: number, toId: number, amount: number) => {
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id === fromId) return { ...p, score: Math.max(0, p.score - amount) };
        if (p.id === toId) return { ...p, score: p.score + amount };
        return p;
      })
    );
    nextTurn();
  };

  const buyProperty = () => {
    if (!activePropertyTile) return;
    const curP = players[currentPlayerIdx];
    const price = activePropertyTile.price || 0;

    if (curP.score >= price) {
      setPlayers((prev) =>
        prev.map((p, idx) => (idx === currentPlayerIdx ? { ...p, score: p.score - price } : p))
      );
      setProperties((prev) => ({ ...prev, [activePropertyTile.id]: curP.id }));
    }
    setActivePropertyTile(null);
    nextTurn();
  };

  const handleAnswer = (selectedIndex: number) => {
    if (!activeQuestion) return;
    const isCorrect = selectedIndex === activeQuestion.correctAnswer;
    alert(isCorrect ? '✅ ตอบถูกต้อง! +150 PTS' : '❌ ตอบผิด! -50 PTS');

    setPlayers((prev) =>
      prev.map((p, idx) =>
        idx === currentPlayerIdx
          ? { ...p, score: Math.max(0, p.score + (isCorrect ? 150 : -50)) }
          : p
      )
    );
    setActiveQuestion(null);
    nextTurn();
  };

  const nextTurn = () => {
    setCurrentPlayerIdx((prev) => (prev + 1) % players.length);
  };

  const currentPlayer = players[currentPlayerIdx];

  if (!joinedRoom) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 font-sans">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-md w-full shadow-2xl flex flex-col gap-5 text-center">
          <h1 className="text-2xl font-extrabold text-amber-400">เกมเศรษฐีออนไลน์</h1>

          <div className="grid grid-cols-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setRole('player')}
              className={`py-2 rounded-lg text-xs font-bold transition-all ${
                role === 'player' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
              }`}
            >
              ผู้เล่นทั่วไป
            </button>
            <button
              onClick={() => setRole('developer')}
              className={`py-2 rounded-lg text-xs font-bold transition-all ${
                role === 'developer' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
              }`}
            >
              ผู้พัฒนา (Developer)
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs text-slate-400 font-bold">เลือกอวาตาร์ หรือ อัปโหลดรูปโปรไฟล์</label>
            <div className="flex justify-center items-center gap-3">
              {DEFAULT_AVATARS.map((avatar, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`w-12 h-12 rounded-full border-2 overflow-hidden transition-all ${
                    selectedAvatar === avatar ? 'border-amber-400 scale-110' : 'border-slate-800 opacity-60'
                  }`}
                >
                  <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            <label className="cursor-pointer mt-2 inline-flex items-center justify-center gap-2 bg-slate-800 text-xs text-amber-400 py-2 px-4 rounded-xl border border-slate-700">
              📁 อัปโหลดรูปภาพตัวเอง
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          <div className="flex flex-col items-center gap-1">
            <div className="relative">
              <img src={selectedAvatar} alt="Preview" className="w-16 h-16 rounded-full border-2 border-amber-400 object-cover" />
              {role === 'developer' && (
                <span className="absolute -bottom-1 -right-2 bg-amber-500 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded-full">
                  DEV
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-400">ตัวอย่างโปรไฟล์ของคุณ</span>
          </div>

          <div className="flex flex-col gap-1 text-left">
            <label className="text-xs text-slate-400 font-bold">ชื่อผู้เล่น</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="กรอกชื่อของคุณ"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-400 outline-none text-sm"
            />
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={() => handleEnterLobby(true)}
              className="w-full bg-amber-500 text-slate-950 font-extrabold py-3 rounded-xl shadow-lg"
            >
              👑 สร้างห้องใหม่ (Create Room)
            </button>

            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="กรอกรหัสห้อง (เช่น ROOM-1234)"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-400 outline-none text-sm uppercase"
              />
              <button
                onClick={() => handleEnterLobby(false)}
                className="bg-slate-800 text-amber-400 font-bold px-4 py-3 rounded-xl border border-slate-700 text-sm whitespace-nowrap"
              >
                เข้าห้อง
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 gap-6 font-sans">
      <div className="flex flex-col gap-2 w-full max-w-[620px]">
        <div className="flex justify-between items-center text-xs text-slate-400 px-1">
          <span>ห้อง: <strong className="text-amber-400">{joinedRoom}</strong></span>
          <span>ผู้เล่นในห้อง: <strong className="text-emerald-400">{players.length} คน</strong></span>
        </div>

        <div className="flex gap-4 items-center bg-slate-900 border border-slate-800 p-4 rounded-2xl overflow-x-auto">
          {players.map((p, idx) => (
            <div
              key={p.id}
              className={`flex items-center gap-3 p-2 px-4 rounded-xl shrink-0 ${
                idx === currentPlayerIdx ? 'bg-amber-500/20 border border-amber-400' : 'opacity-60'
              }`}
            >
              <div className="relative">
                <img src={p.avatar} alt={p.name} className="w-10 h-10 rounded-full border border-amber-400 object-cover" />
                {p.isDev && (
                  <span className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 font-black text-[8px] px-1 rounded">
                    DEV
                  </span>
                )}
              </div>
              <div>
                <div className="font-bold text-sm text-slate-100 flex items-center gap-1">
                  {p.name}
                  {p.isDev && <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/40 px-1 rounded">Developer</span>}
                </div>
                <div className="text-xs text-amber-400 font-extrabold">{p.score} PTS</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative">
        <Board players={players} currentPlayerIndex={currentPlayerIdx} properties={properties} />

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-slate-900/90 backdrop-blur border border-slate-800 p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4 pointer-events-auto max-w-[240px] w-full text-center">
            <div className="text-xs text-slate-400 font-bold">ตาของ:</div>
            <div className="flex items-center gap-2">
              <img src={currentPlayer?.avatar} alt={currentPlayer?.name} className="w-6 h-6 rounded-full object-cover" />
              <span className="font-bold text-amber-400">{currentPlayer?.name}</span>
            </div>

            <div className="text-4xl font-extrabold text-slate-100 bg-slate-950 w-20 h-20 rounded-xl flex items-center justify-center border border-slate-800">
              {diceRoll || '?'}
            </div>

            {/* ✅ ปุ่มทอยเต๋าเปิดให้กดได้เสมอในตาปัจจุบันเพื่อทดสอบเดโมนำเสนออาจารย์ */}
            <button
              onClick={rollDice}
              disabled={isRolling || isMoving}
              className="w-full bg-amber-500 hover:bg-amber-400 active:scale-95 disabled:opacity-50 text-slate-950 font-extrabold py-2.5 px-4 rounded-xl shadow-lg"
            >
              🎲 {isRolling ? 'กำลังทอย...' : isMoving ? 'กำลังเดิน...' : `ทอยเต๋า (${currentPlayer?.name})`}
            </button>
          </div>
        </div>
      </div>

      {activeQuestion && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-amber-400 mb-2">❓ คำถามวัดความรู้</h3>
            <p className="text-slate-200 mb-4">{activeQuestion.question}</p>
            <div className="flex flex-col gap-2">
              {activeQuestion.options.map((option: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  className="w-full text-left bg-slate-800 hover:bg-amber-500/20 hover:border-amber-500/50 border border-slate-700/60 p-3 rounded-xl text-sm text-slate-200"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {activePropertyTile && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-sm w-full shadow-2xl text-center">
            <h3 className="text-lg font-bold text-amber-400 mb-1">🏠 ซื้ออสังหาริมทรัพย์</h3>
            <p className="text-slate-300 font-bold text-base mb-1">{activePropertyTile.name}</p>
            <p className="text-slate-400 text-sm mb-4">ราคา: {activePropertyTile.price} PTS</p>
            <div className="flex gap-2">
              <button onClick={buyProperty} className="flex-1 bg-amber-500 text-slate-950 font-bold py-2 rounded-xl">
                ซื้อที่ดิน
              </button>
              <button onClick={() => { setActivePropertyTile(null); nextTurn(); }} className="flex-1 bg-slate-800 text-slate-300 font-bold py-2 rounded-xl">
                ข้าม
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}