import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    // 기본 클래스
    let baseClasses = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
    
    // variant 클래스
    let variantClasses = "";
    if (variant === 'default') variantClasses = "bg-black text-white hover:bg-gray-800";
    else if (variant === 'destructive') variantClasses = "bg-red-500 text-white hover:bg-red-600";
    else if (variant === 'outline') variantClasses = "border border-gray-300 bg-white hover:bg-gray-50 hover:text-gray-900";
    else if (variant === 'secondary') variantClasses = "bg-gray-100 text-gray-900 hover:bg-gray-200";
    else if (variant === 'ghost') variantClasses = "hover:bg-gray-100 hover:text-gray-900";
    else if (variant === 'link') variantClasses = "text-black underline-offset-4 hover:underline";
    
    // size 클래스
    let sizeClasses = "";
    if (size === 'default') sizeClasses = "h-10 px-4 py-2";
    else if (size === 'sm') sizeClasses = "h-9 rounded-md px-3";
    else if (size === 'lg') sizeClasses = "h-11 rounded-md px-8";
    else if (size === 'icon') sizeClasses = "h-10 w-10";

    return (
      <button
        className={cn(baseClasses, variantClasses, sizeClasses, className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button } 