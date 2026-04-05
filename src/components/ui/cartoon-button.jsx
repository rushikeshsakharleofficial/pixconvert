export function CartoonButton({
  label,
  color = 'bg-orange-400',
  hasHighlight = true,
  disabled = false,
  onClick,
}) {
  const handleClick = () => {
    if (disabled) return;
    onClick?.();
  };

  return (
    <div className={`inline-block ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
      <button
        disabled={disabled}
        onClick={handleClick}
        className={`relative h-12 overflow-hidden rounded-full border-2 border-neutral-800 px-6 text-xl font-bold text-neutral-800 transition-all duration-150 group
        ${color} hover:shadow-[0_4px_0_0_#262626]
        ${disabled ? 'pointer-events-none opacity-50' : 'hover:-translate-y-1 active:translate-y-0 active:shadow-none'}`}
      >
        <span className="relative z-10 whitespace-nowrap">{label}</span>
        {hasHighlight && !disabled && (
          <div className="absolute top-1/2 left-[-100%] h-24 w-16 -translate-y-1/2 rotate-12 bg-white/50 transition-all duration-500 ease-in-out group-hover:left-[200%]" />
        )}
      </button>
    </div>
  );
}

export default CartoonButton;
