'use client';

import React, { useState } from 'react';
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

export default function Home() {
  const [players, setPlayers] = useState<Player[]>([
    {
      id: 1,
      name: 'gg',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=gg',
      score: 1000,
      position: 0,
      jailTurns: 0,
      isDev: true,
    },
  ]);

  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [diceRoll, setDiceRoll] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [properties, setProperties] = useState<{ [tileId: number]: number }>({});

  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [activePropertyTile, setActivePropertyTile] = useState<BoardTile | null>(null);

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
    const currentPlayer = players[currentPlayerIdx];
    const finalPosition = (currentPlayer.position + stepsRemaining) % 40;

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      setPlayers((prev) =>
        prev.map((p, idx) => {
          if (idx !== currentPlayerIdx) return p;
          const nextPos = (p.position + 1) % 40;
          let newScore = p.score;
          if (nextPos === 0) newScore += 300;
          return { ...p, position: nextPos, score: newScore };
        })
      );

      if (currentStep >= stepsRemaining) {
        clearInterval(interval);
        setIsMoving(false);
        setTimeout(() => handleTileAction(finalPosition), 100);
      }
    }, 200);
  };

  const handleTileAction = (targetPosition: number) => {
    const currentPlayer = players[currentPlayerIdx];
    const currentTile = BOARD_TILES.find((t: BoardTile) => t.id === targetPosition);

    if (!currentTile) {
      nextTurn();
      return;
    }

    if (currentTile.type === 'QUESTION') {
      const randomQ = QUESTIONS_DATABASE[Math.floor(Math.random() * QUESTIONS_DATABASE.length)];
      setActiveQuestion(randomQ);
    } else if (currentTile.type === 'PROPERTY') {
      const ownerId = properties[currentTile.id];
      if (!ownerId && currentTile.price) {
        if (currentPlayer.score >= currentTile.price) {
          setActivePropertyTile(currentTile);
        } else {
          nextTurn();
        }
      } else if (ownerId && ownerId !== currentPlayer.id) {
        const rent = currentTile.price || 100;
        alert(`🏠 ${currentPlayer.name} ตกช่องของเจ้าของ! เสียค่าเช่า ${rent} PTS`);
        payRent(currentPlayer.id, ownerId, rent);
      } else {
        nextTurn();
      }
    } else if (currentTile.type === 'WARP') {
      const randomPos = Math.floor(Math.random() * 40);
      alert(`🌀 วาร์ปสุ่ม! ย้ายไปที่ช่อง ${BOARD_TILES[randomPos]?.name || randomPos}`);
      setPlayers((prev) =>
        prev.map((p, idx) => (idx === currentPlayerIdx ? { ...p, position: randomPos } : p))
      );
      nextTurn();
    } else if (currentTile.type === 'JAIL') {
      alert(`🔒 ตกช่องคุก! คุณจะถูกขังเป็นเวลา 2 รอบ`);
      setPlayers((prev) =>
        prev.map((p, idx) => (idx === currentPlayerIdx ? { ...p, jailTurns: 2 } : p))
      );
      nextTurn();
    } else if (currentTile.type === 'RANDOM_REWARD') {
      handleRandomRewardEvent();
    } else {
      nextTurn();
    }
  };

  const handleRandomRewardEvent = () => {
    const rewards = [
      { text: '🎁 ได้รับทุนการศึกษาพิเศษ +200 PTS', score: 200 },
      { text: '💸 โดนปรับเนื่องจากส่งงานช้า -100 PTS', score: -100 },
      { text: '🎉 ได้รับเงินสนับสนุนโปรเจกต์ +500 PTS', score: 500 },
    ];
    const reward = rewards[Math.floor(Math.random() * rewards.length)];
    alert(reward.text);
    setPlayers((prev) =>
      prev.map((p, idx) =>
        idx === currentPlayerIdx ? { ...p, score: Math.max(0, p.score + reward.score) } : p
      )
    );
    nextTurn();
  };

  const payRent = (fromPlayerId: number, toPlayerId: number, amount: number) => {
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id === fromPlayerId) return { ...p, score: Math.max(0, p.score - amount) };
        if (p.id === toPlayerId) return { ...p, score: p.score + amount };
        return p;
      })
    );
    nextTurn();
  };

  const buyProperty = () => {
    if (!activePropertyTile) return;
    const currentPlayer = players[currentPlayerIdx];
    const price = activePropertyTile.price || 0;

    if (currentPlayer.score >= price) {
      setPlayers((prev) =>
        prev.map((p, idx) => (idx === currentPlayerIdx ? { ...p, score: p.score - price } : p))
      );
      setProperties((prev) => ({ ...prev, [activePropertyTile.id]: currentPlayer.id }));
    }
    setActivePropertyTile(null);
    nextTurn();
  };

  const handleAnswer = (selectedIndex: number) => {
    if (!activeQuestion) return;
    if (selectedIndex === activeQuestion.correctAnswer) {
      alert('✅ ตอบถูกต้อง! ได้รับ +150 PTS');
      setPlayers((prev) =>
        prev.map((p, idx) => (idx === currentPlayerIdx ? { ...p, score: p.score + 150 } : p))
      );
    } else {
      alert('❌ ตอบผิด! หัก -50 PTS');
      setPlayers((prev) =>
        prev.map((p, idx) =>
          idx === currentPlayerIdx ? { ...p, score: Math.max(0, p.score - 50) } : p
        )
      );
    }
    setActiveQuestion(null);
    nextTurn();
  };

  const nextTurn = () => {
    setCurrentPlayerIdx((prev) => (prev + 1) % players.length);
  };

  const currentPlayer = players[currentPlayerIdx];

  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 gap-6 font-sans">
      <div className="flex gap-4 items-center bg-slate-900 border border-slate-800 p-4 rounded-2xl w-full max-w-[620px]">
        {players.map((p, idx) => (
          <div
            key={p.id}
            className={`flex items-center gap-3 p-2 px-4 rounded-xl transition-all ${
              idx === currentPlayerIdx ? 'bg-amber-500/10 border border-amber-500/40' : 'opacity-60'
            }`}
          >
            <img src={p.avatar} alt={p.name} className="w-10 h-10 rounded-full border border-amber-400" />
            <div>
              <div className="font-bold text-sm text-slate-100">{p.name}</div>
              <div className="text-xs text-amber-400 font-extrabold">{p.score} PTS</div>
            </div>
          </div>
        ))}
      </div>

      <div className="relative">
        <Board players={players} currentPlayerIndex={currentPlayerIdx} properties={properties} />

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-slate-900/90 backdrop-blur border border-slate-800 p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4 pointer-events-auto max-w-[240px] w-full text-center">
            <div className="text-xs text-slate-400 font-bold">ตาของ:</div>
            <div className="flex items-center gap-2">
              <img src={currentPlayer.avatar} alt={currentPlayer.name} className="w-6 h-6 rounded-full" />
              <span className="font-bold text-amber-400">{currentPlayer.name}</span>
            </div>

            <div className="text-4xl font-extrabold text-slate-100 bg-slate-950 w-20 h-20 rounded-xl flex items-center justify-center border border-slate-800">
              {diceRoll || '?'}
            </div>

            <button
              onClick={rollDice}
              disabled={isRolling || isMoving}
              className="w-full bg-amber-500 hover:bg-amber-400 active:scale-95 disabled:opacity-50 text-slate-950 font-extrabold py-2.5 px-4 rounded-xl transition-all shadow-lg shadow-amber-500/20"
            >
              🎲 {isRolling ? 'กำลังทอย...' : isMoving ? 'กำลังเดิน...' : 'ทอยลูกเต๋า'}
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
                  className="w-full text-left bg-slate-800 hover:bg-amber-500/20 hover:border-amber-500/50 border border-slate-700/60 p-3 rounded-xl transition-all text-sm text-slate-200"
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
              <button
                onClick={buyProperty}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 rounded-xl transition-all"
              >
                ซื้อที่ดิน
              </button>
              <button
                onClick={() => {
                  setActivePropertyTile(null);
                  nextTurn();
                }}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 rounded-xl transition-all"
              >
                ข้าม
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}