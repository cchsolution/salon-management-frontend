import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ElementType;
  rightIcon?: React.ElementType;
  isIconOnly?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      isIconOnly = false,
      className = '',
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const variantClasses: Record<ButtonVariant, string> = {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      outline: 'btn-outline',
      ghost: 'btn-ghost',
      danger: 'btn-danger',
      success: 'btn-success',
    };

    const sizeClasses: Record<ButtonSize, string> = {
      sm: 'btn-sm',
      md: 'btn-md',
      lg: 'btn-lg',
    };

    const iconOnlySizes: Record<ButtonSize, string> = {
      sm: 'w-8 h-8 p-1.5',
      md: 'w-10 h-10 p-2',
      lg: 'w-12 h-12 p-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`btn-base ${variantClasses[variant]} ${
          isIconOnly ? `btn-icon ${iconOnlySizes[size]}` : sizeClasses[size]
        } ${className}`}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            {!isIconOnly && children && <span>{children}</span>}
          </>
        ) : (
          <>
            {LeftIcon && <LeftIcon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105" />}
            {children && (!isIconOnly ? <span>{children}</span> : children)}
            {RightIcon && <RightIcon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105" />}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
