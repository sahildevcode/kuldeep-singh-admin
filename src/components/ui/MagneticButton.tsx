import React, { useRef, useState } from 'react';

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'glass' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  onClick,
  ...props
}) => {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distanceX = (e.clientX - centerX) * 0.25;
    const distanceY = (e.clientY - centerY) * 0.25;
    setPosition({ x: distanceX, y: distanceY });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  const baseStyles =
    'relative inline-flex items-center justify-center font-medium tracking-wide transition-all duration-200 rounded-full focus:outline-none select-none disabled:opacity-50 disabled:cursor-not-allowed group clickable';

  const sizeStyles = {
    sm: 'px-4 py-2 text-xs gap-1.5',
    md: 'px-6 py-3 text-sm gap-2',
    lg: 'px-8 py-4 text-base gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-[#1A1816] text-white hover:bg-black hover:shadow-lg shadow-soft-lux active:scale-95',
    secondary:
      'bg-artisan-crimson text-white hover:bg-[#c92a37] shadow-glow-crimson active:scale-95',
    outline:
      'border border-[#1A1816]/20 bg-transparent text-[#1A1816] hover:border-[#1A1816] hover:bg-[#1A1816]/5 active:scale-95',
    glass:
      'glass-panel text-[#1A1816] hover:bg-white/90 shadow-sm border border-white/80 active:scale-95',
    gold:
      'bg-gradient-to-r from-[#C5A059] to-[#D97706] text-white shadow-glow-gold hover:opacity-95 active:scale-95',
  };

  return (
    <button
      ref={btnRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        transition: position.x === 0 && position.y === 0 ? 'transform 0.4s ease-out' : 'transform 0.05s linear',
      }}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
