"use client";

interface RatingButtonProps {
  value: number;
  selected: boolean;
  onClick: (value: number) => void;
}

const RATING_CONFIG: Record<number, { label: string; color: string; glow: string; border: string; bg: string }> = {
  1: {
    label: "1",
    color: "text-red-400",
    glow: "neon-red",
    border: "border-red-500/50",
    bg: "bg-red-500/10 hover:bg-red-500/20",
  },
  2: {
    label: "2",
    color: "text-orange-400",
    glow: "neon-orange",
    border: "border-orange-500/50",
    bg: "bg-orange-500/10 hover:bg-orange-500/20",
  },
  3: {
    label: "3",
    color: "text-yellow-400",
    glow: "neon-yellow",
    border: "border-yellow-500/50",
    bg: "bg-yellow-500/10 hover:bg-yellow-500/20",
  },
  4: {
    label: "4",
    color: "text-blue-400",
    glow: "neon-blue",
    border: "border-blue-500/50",
    bg: "bg-blue-500/10 hover:bg-blue-500/20",
  },
  5: {
    label: "5",
    color: "text-purple-400",
    glow: "neon-purple",
    border: "border-purple-500/50",
    bg: "bg-purple-500/10 hover:bg-purple-500/20",
  },
};

const RATING_EMOJI: Record<number, string> = {
  1: "💀",
  2: "😮‍💨",
  3: "😐",
  4: "😎",
  5: "🚀",
};

export default function RatingButton({ value, selected, onClick }: RatingButtonProps) {
  const config = RATING_CONFIG[value];

  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`
        relative flex flex-col items-center justify-center
        w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 transition-all duration-300
        font-bold text-lg cursor-pointer
        ${config.bg} ${config.border} ${config.color}
        ${selected ? `${config.glow} scale-110 ring-2 ring-white/20` : "opacity-70 hover:opacity-100 hover:scale-105"}
      `}
    >
      <span className="text-2xl">{RATING_EMOJI[value]}</span>
      <span className="text-xs mt-0.5 font-mono">{config.label}</span>
    </button>
  );
}
