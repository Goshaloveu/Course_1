import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/context/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [isAnimating, setIsAnimating] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  // Function to handle the theme change with animation
  const handleToggle = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    
    // Create the animation element
    if (buttonRef.current) {
      const button = buttonRef.current;
      const rect = button.getBoundingClientRect();
      
      // Create overlay element
      const overlay = document.createElement('div');
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.zIndex = '9999';
      overlay.style.pointerEvents = 'none';
      
      // Create circle that will animate
      const circle = document.createElement('div');
      
      // Position at button center
      const buttonCenterX = rect.left + rect.width / 2;
      const buttonCenterY = rect.top + rect.height / 2;
      
      circle.style.position = 'absolute';
      circle.style.borderRadius = '50%';
      circle.style.transform = 'translate(-50%, -50%)';
      circle.style.top = `${buttonCenterY}px`;
      circle.style.left = `${buttonCenterX}px`;
      
      // Set initial size and color based on current theme
      if (theme === 'light') {
        // Going from light to dark
        circle.style.width = '0';
        circle.style.height = '0';
        circle.style.backgroundColor = '#0F172A'; // Dark theme background
        circle.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        
        // Append to DOM first
        overlay.appendChild(circle);
        document.body.appendChild(overlay);
        
        // Force reflow to ensure animation works
        circle.offsetHeight;
        
        // Expand to cover screen
        const maxDimension = Math.max(window.innerWidth, window.innerHeight) * 2;
        circle.style.width = `${maxDimension}px`;
        circle.style.height = `${maxDimension}px`;
        
        // Wait for animation then switch theme and cleanup
        setTimeout(() => {
          toggleTheme();
          overlay.remove();
          setIsAnimating(false);
        }, 500);
      } else {
        // Going from dark to light
        const maxDimension = Math.max(window.innerWidth, window.innerHeight) * 2;
        circle.style.width = `${maxDimension}px`;
        circle.style.height = `${maxDimension}px`;
        circle.style.backgroundColor = '#F8FAFC'; // Light theme background
        circle.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        
        // Append to DOM first
        overlay.appendChild(circle);
        document.body.appendChild(overlay);
        
        // Force reflow to ensure animation works
        circle.offsetHeight;
        
        // Contract to button size
        circle.style.width = '0';
        circle.style.height = '0';
        
        // Toggle theme immediately when going to light
        toggleTheme();
        
        // Cleanup after animation
        setTimeout(() => {
          overlay.remove();
          setIsAnimating(false);
        }, 500);
      }
    }
  };

  return (
    <button
      ref={buttonRef}
      onClick={handleToggle}
      className="bg-transparent border-none cursor-pointer rounded-md p-2 text-muted-foreground hover:bg-muted/50 transition-colors relative"
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      disabled={isAnimating}
    >
      {theme === 'light' ? (
        <svg viewBox='0 0 32 32' className="w-5 h-5" xmlns='http://www.w3.org/2000/svg'>
          <path fill='currentColor' d='M16 12.005a4 4 0 1 1-4 4a4.005 4.005 0 0 1 4-4m0-2a6 6 0 1 0 6 6a6 6 0 0 0-6-6ZM5.394 6.813L6.81 5.399l3.505 3.506L8.9 10.319zM2 15.005h5v2H2zm3.394 10.193L8.9 21.692l1.414 1.414l-3.505 3.506zM15 25.005h2v5h-2zm6.687-1.9l1.414-1.414l3.506 3.506l-1.414 1.414zm3.313-8.1h5v2h-5zm-3.313-6.101l3.506-3.506l1.414 1.414l-3.506 3.506zM15 2.005h2v5h-2z'/>
        </svg>
      ) : (
        <svg viewBox='0 0 32 32' className="w-5 h-5" xmlns='http://www.w3.org/2000/svg'>
          <path fill='currentColor' d='M13.502 5.414a15.075 15.075 0 0 0 11.594 18.194a11.113 11.113 0 0 1-7.975 3.39c-.138 0-.278.005-.418 0a11.094 11.094 0 0 1-3.2-21.584M14.98 3a1.002 1.002 0 0 0-.175.016a13.096 13.096 0 0 0 1.825 25.981c.164.006.328 0 .49 0a13.072 13.072 0 0 0 10.703-5.555a1.01 1.01 0 0 0-.783-1.565A13.08 13.08 0 0 1 15.89 4.38A1.015 1.015 0 0 0 14.98 3Z'/>
        </svg>
      )}
    </button>
  );
}; 