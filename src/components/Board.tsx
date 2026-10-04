'use client';

import React from 'react';
import { BOARD_TILES, BoardTile } from '../config/boardData';
import { Player } from '../app/page';

interface BoardProps {
  players: Player[];
  currentPlayerIndex: number;
  properties?: { [tileId: number]: number };
}

export default function Board({ players, currentPlayerIndex, properties = {} }: BoardProps) {
  const getTilePositionClass = (id: number) => {
    if (id >= 0 && id <= 10) {
      return { gridRow: 11, gridColumn: 11 - id };
    } else if (id >= 11 && id <= 20) {
      return { gridRow: 11 - (id - 10), gridColumn: 1 };
    } else if (id >= 21 && id <= 30) {
      return { gridRow: 1, gridColumn: 1 + (id - 20) };
    } else {
      return { gridRow: 1 + (id - 30), gridColumn: 11 };
    }
  };

  return (
    <div className="w-[620px] h-[620px] bg-slate-900 border-4 border-slate-800 rounded-3xl p-2 relative grid grid-cols-11 grid-rows-11 gap-1 shadow-2xl overflow-hidden">
      {/* 1. วาดช่องกระดาน */}
      {BOARD_TILES.map((tile: BoardTile) => {
        const pos = getTilePositionClass(tile.id);
        const ownerId = properties[tile.id];
        const ownerPlayer = players.find((p) => p.id === ownerId);

        return (
          <div
            key={tile.id}
            style={{ gridRow: pos.gridRow, gridColumn: pos.gridColumn }}
            className="bg-slate-950 border border-slate-800/80 rounded-xl p-1 flex flex-col justify-between items-center text-center relative overflow-hidden group hover:border-amber-500/50 transition-all"
          >
            {/* สัญลักษณ์เจ้าของที่ดิน (มาร์กเกอร์จิ๋วตรงมุมขวาบน) */}
            {ownerPlayer && (
              <div
                title={`เจ้าของ: ${ownerPlayer.name}`}
                className="absolute top-0.5 right-0.5 z-10 flex items-center justify-center bg-slate-900/90 rounded-full p-0.5 border border-amber-400 shadow-md"
              >
                <img
                  src={ownerPlayer.avatar}
                  alt={ownerPlayer.name}
                  className="w-3.5 h-3.5 rounded-full object-cover"
                />
              </div>
            )}

            {/* เลขช่อง (แสดงมุมซ้ายบน) */}
            <span className="text-[7px] text-slate-600 font-mono self-start leading-none">
              #{tile.id}
            </span>

            {/* ชื่อสถานที่ (ตรงกลาง มองเห็นชัดเจน) */}
            <div className="w-full text-[8.5px] font-bold text-slate-200 line-clamp-2 my-auto px-0.5 leading-tight">
              {tile.name}
            </div>

            {/* ส่วนด้านล่าง: ไอคอนพิเศษ หรือ ราคาที่ดิน */}
            <div className="w-full flex justify-center items-center">
              {tile.price ? (
                <span className="text-[8px] font-extrabold text-amber-400 bg-amber-500/10 px-1 py-0.2 rounded border border-amber-500/20 leading-none">
                  {tile.price}P
                </span>
              ) : (
                <span className="text-xs leading-none">
                  {tile.type === 'START' && '🚩'}
                  {tile.type === 'JAIL' && '🔒'}
                  {tile.type === 'WARP' && '🌀'}
                  {tile.type === 'QUESTION' && '❓'}
                  {tile.type === 'RANDOM_REWARD' && '🎁'}
                </span>
              )}
            </div>
          </div>
        );
      })}

      {/* 2. หมากผู้เล่น */}
      {players.map((player, pIdx) => {
        const tilePos = getTilePositionClass(player.position);
        const isCurrentTurn = pIdx === currentPlayerIndex;

        return (
          <div
            key={player.id}
            style={{
              gridRow: tilePos.gridRow,
              gridColumn: tilePos.gridColumn,
            }}
            className={`pointer-events-none z-20 flex items-center justify-center transition-all duration-300 ${
              isCurrentTurn ? 'scale-125 z-30' : 'scale-90 opacity-90'
            }`}
          >
            <div
              className={`relative w-7 h-7 rounded-full border-2 p-0.5 bg-slate-900 shadow-lg ${
                player.isDev ? 'border-amber-400 shadow-amber-500/50' : 'border-indigo-400 shadow-indigo-500/50'
              } ${isCurrentTurn ? 'animate-bounce' : ''}`}
            >
              <img
                src={player.avatar}
                alt={player.name}
                className="w-full h-full rounded-full object-cover"
              />
              {isCurrentTurn && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}