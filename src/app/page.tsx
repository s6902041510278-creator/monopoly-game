'use client';

import React, { useState, useEffect } from 'react';
import Board from '../components/Board';
import { BOARD_TILES, BoardTile } from '../config/boardData';
import { QUESTIONS_DATABASE, Question } from '../config/questions';
import { supabase } from '../lib/supabase';

export interface Player {
  id: number;
  name: string;
  avatar: string;
  score: number;
  position: number;
  jailTurns: number;
  isDev?: boolean;
}

interface GameState {
  players: Player[];
  currentPlayerIdx: number;
  properties: { [tileId: number]: number };
  diceRoll: number | null;
  isMoving: boolean;
}

export default function Home() {
  const [roomId, setRoomId] = useState<string>('');
  const [joinedRoom, setJoinedRoom] = useState<string | null>(null); // ✅ บังคับเริ่มต้นเป็น null เสมอ
  const [playerName, setPlayerName] = useState<string>('');
  const [myPlayerId, setMyPlayerId] = useState<number | null>(null);

  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [diceRoll, setDiceRoll] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [properties, setProperties] = useState<{ [tileId: number]: number }>({});

  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [activePropertyTile, setActivePropertyTile] = useState<BoardTile | null>(null);

  // --- Realtime Sync via Supabase Broadcast ---
  useEffect(() => {
    if (!joinedRoom) return;

    const channel = supabase.channel(`room_${joinedRoom}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on('broadcast', { event: 'game_update' }, ({ payload }) => {
        const state: GameState = payload;
        setPlayers(state.players);
        setCurrentPlayerIdx(state.currentPlayerIdx);
        setProperties(state.properties);
        setDiceRoll(state.diceRoll);
        setIsMoving(state.isMoving);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [joinedRoom]);

  const broadcastState = (newState: Partial<GameState>) => {
    if (!joinedRoom) return;

    const fullState: GameState = {
      players: newState.players ?? players,
      currentPlayerIdx: newState.currentPlayerIdx ?? currentPlayerIdx,
      properties: newState.properties ?? properties,
      diceRoll: newState.diceRoll ?? diceRoll,
      isMoving: newState.isMoving ?? isMoving,
    };

    supabase.channel(`room_${joinedRoom}`).send({
      type: 'broadcast',
      event: 'game_update',
      payload: fullState,
    });
  };

  const handleJoinRoom = () => {
    if (!playerName.trim() || !roomId.trim()) {
      alert('กรุณากรอกชื่อผู้เล่นและรหัสห้อง!');
      return;
    }

    const pId = Date.now();
    setMyPlayerId(pId);
    const newPlayer: Player = {
      id: pId,
      name: playerName.trim(),
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${playerName.trim()}`,
      score: 1000,
      position: 0,
      jailTurns: 0,
    };

    const updatedPlayers = [...players, newPlayer];
    setPlayers(updatedPlayers);
    setJoinedRoom(roomId.trim().toUpperCase());

    broadcastState({ players: updatedPlayers });
  };

  const rollDice = () => {
    if (isRolling || isMoving) return;
    if (players[currentPlayerIdx]?.id !== myPlayerId) {
      alert('ยังไม่ถึงตาของคุณ!');
      return;
    }

    setIsRolling(true);
    let rolls = 0;
    const interval = setInterval(() => {
      const tempRoll = Math.floor(Math.random() * 6) + 1;
      setDiceRoll(tempRoll);
      rolls++;

      if (rolls >= 10) {
        clearInterval(interval);
        const finalDice = Math.floor(Math.random() * 6) + 1;
        setDiceRoll(finalDice);
        setIsRolling(false);
        setIsMoving(true);

        broadcastState({ diceRoll: finalDice, isMoving: true });
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
      setPlayers((prev) => {
        const nextPlayers = prev.map((p, idx) => {
          if (idx !== currentPlayerIdx) return p;
          const nextPos = (p.position + 1) % 40;
          let newScore = p.score;
          if (nextPos === 0) newScore += 300;
          return { ...p, position: nextPos, score: newScore };
        });
        broadcastState({ players: nextPlayers });
        return nextPlayers;
      });

      if (currentStep >= stepsRemaining) {
        clearInterval(interval);
        setIsMoving(false);
        broadcastState({ isMoving: false });
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
      const updated = players.map((p, idx) =>
        idx === currentPlayerIdx ? { ...p, position: randomPos } : p
      );
      setPlayers(updated);
      broadcastState({ players: updated });
      nextTurn();
    } else if (currentTile.type === 'JAIL') {
      alert(`🔒 ตกช่องคุก! คุณจะถูกขังเป็นเวลา 2 รอบ`);
      const updated = players.map((p, idx) =>
        idx === currentPlayerIdx ? { ...p, jailTurns: 2 } : p
      );
      setPlayers(updated);
      broadcastState({ players: updated });
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
    const updated = players.map((p, idx) =>
      idx === currentPlayerIdx ? { ...p, score: Math.max(0, p.score + reward.score) } : p
    );
    setPlayers(updated);
    broadcastState({ players: updated });
    nextTurn();
  };

  const payRent = (fromPlayerId: number, toPlayerId: number, amount: number) => {
    const updated = players.map((p) => {
      if (p.id === fromPlayerId) return { ...p, score: Math.max(0, p.score - amount) };
      if (p.id === toPlayerId) return { ...p, score: p.score + amount };
      return p;
    });
    setPlayers(updated);
    broadcastState({ players: updated });
    nextTurn();
  };

  const buyProperty = () => {
    if (!activePropertyTile) return;
    const currentPlayer = players[currentPlayerIdx];
    const price = activePropertyTile.price || 0;

    if (currentPlayer.score >= price) {
      const updatedPlayers = players.map((p, idx) =>
        idx === currentPlayerIdx ? { ...p, score: p.score - price } : p
      );
      const updatedProps = { ...properties, [activePropertyTile.id]: currentPlayer.id };

      setPlayers(updatedPlayers);
      setProperties(updatedProps);
      broadcastState({ players: updatedPlayers, properties: updatedProps });
    }
    setActivePropertyTile(null);
    nextTurn();
  };

  const handleAnswer = (selectedIndex: number) => {
    if (!activeQuestion) return;
    let scoreChange = -50;
    if (selectedIndex === activeQuestion.correctAnswer) {
      alert('✅ ตอบถูกต้อง! ได้รับ +150 PTS');
      scoreChange = 150;
    } else {
      alert('❌ ตอบผิด! หัก -50 PTS');
    }

    const updated = players.map((p, idx) =>
      idx === currentPlayerIdx ? { ...p, score: Math.max(0, p.score + scoreChange) } : p
    );
    setPlayers(updated);
    broadcastState({ players: updated });
    setActiveQuestion(null);
    nextTurn();
  };

  const nextTurn = () => {
    const nextIdx = (currentPlayerIdx + 1) % Math.max(1, players.length);
    setCurrentPlayerIdx(nextIdx);
    broadcastState({ currentPlayerIdx: nextIdx });
  };

  const currentPlayer = players[currentPlayerIdx];

  // --- หน้าจอเข้าร่วมห้อง (Lobby) ---
  if (!joinedRoom) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 font-sans">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-md w-full shadow-2xl flex flex-col gap-5 text-center">
          <h1 className="text-2xl font-extrabold text-amber-400">🎲 เกมเศรษฐีเพื่อการเรียนรู้</h1>
          <p className="text-slate-400 text-sm">กรอกชื่อและรหัสห้องเพื่อเข้าเล่น Multiplayer</p>

          <div className="flex flex-col gap-3 text-left">
            <div>
              <label className="text-xs text-slate-400 font-bold mb-1 block">ชื่อผู้เล่น</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="เช่น อาจารย์สมคิด / StudentA"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-400 outline-none text-sm"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 font-bold mb-1 block">รหัสห้อง (Room Code)</label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="เช่น ROOM101"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-400 outline-none text-sm uppercase"
              />
            </div>
          </div>

          <button
            onClick={handleJoinRoom}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold py-3 rounded-xl transition-all shadow-lg shadow-amber-500/20"
          >
            🚀 เข้าสู่ห้องเล่นเกม
          </button>
        </div>
      </main>
    );
  }

  // --- หน้ากระดานเกมหลัก ---
  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 gap-6 font-sans">
      <div className="flex flex-col gap-2 w-full max-w-[620px]">
        <div className="flex justify-between items-center text-xs text-slate-400 px-1">
          <span>ห้อง: <strong className="text-amber-400">{joinedRoom}</strong></span>
          <span>ผู้เล่นออนไลน์: <strong className="text-emerald-400">{players.length} คน</strong></span>
        </div>

        <div className="flex gap-4 items-center bg-slate-900 border border-slate-800 p-4 rounded-2xl overflow-x-auto">
          {players.map((p, idx) => (
            <div
              key={p.id}
              className={`flex items-center gap-3 p-2 px-4 rounded-xl transition-all shrink-0 ${
                idx === currentPlayerIdx ? 'bg-amber-500/10 border border-amber-500/40' : 'opacity-60'
              }`}
            >
              <img src={p.avatar} alt={p.name} className="w-10 h-10 rounded-full border border-amber-400" />
              <div>
                <div className="font-bold text-sm text-slate-100 flex items-center gap-1">
                  {p.name}
                  {p.id === myPlayerId && <span className="text-[10px] text-amber-400">(คุณ)</span>}
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
              <img src={currentPlayer?.avatar} alt={currentPlayer?.name} className="w-6 h-6 rounded-full" />
              <span className="font-bold text-amber-400">{currentPlayer?.name || 'รอผู้เล่น'}</span>
            </div>

            <div className="text-4xl font-extrabold text-slate-100 bg-slate-950 w-20 h-20 rounded-xl flex items-center justify-center border border-slate-800">
              {diceRoll || '?'}
            </div>

            <button
              onClick={rollDice}
              disabled={isRolling || isMoving || currentPlayer?.id !== myPlayerId}
              className="w-full bg-amber-500 hover:bg-amber-400 active:scale-95 disabled:opacity-50 text-slate-950 font-extrabold py-2.5 px-4 rounded-xl transition-all shadow-lg shadow-amber-500/20"
            >
              🎲 {currentPlayer?.id !== myPlayerId ? 'รอตาผู้เล่นอื่น' : isRolling ? 'กำลังทอย...' : isMoving ? 'กำลังเดิน...' : 'ทอยลูกเต๋า'}
            </button>
          </div>
        </div>
      </div>

      {activeQuestion && currentPlayer?.id === myPlayerId && (
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

      {activePropertyTile && currentPlayer?.id === myPlayerId && (
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