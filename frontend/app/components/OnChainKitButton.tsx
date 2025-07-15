import type React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface OnchainKitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export default function OnchainKitButton({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  onClick,
  ...props 
}: OnchainKitButtonProps) {
  const baseStyles = `inline-flex items-center justify-center font-medium 
  transition-all duration-200 
  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
  disabled:opacity-50 disabled:cursor-not-allowed`;
  
  const variants: Record<ButtonVariant, string> = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 hover:border-blue-700",
    secondary: "bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300 hover:border-gray-400",
    outline: "bg-transparent hover:bg-blue-50 text-blue-600 border border-blue-600 hover:border-blue-700",
    ghost: "bg-transparent hover:bg-gray-100 text-gray-700 border border-transparent"
  };
  
  const sizes: Record<ButtonSize, string> = {
    sm: "px-3 py-1.5 text-sm rounded-md",
    md: "px-4 py-2 text-sm rounded-lg",
    lg: "px-6 py-3 text-base rounded-lg"
  };
  const buttonClasses = `${baseStyles} ${variants[variant]} ${sizes[size]}`;

  return (
    <button 
      className={buttonClasses}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};