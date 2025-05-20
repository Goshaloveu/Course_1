import React from 'react';

interface SocialIconsProps {
  className?: string;
}

export const SocialIcons: React.FC<SocialIconsProps> = ({ className = '' }) => {
  return (
    <div className={`flex space-x-3 ${className}`}>
      <a 
        href="https://t.me/Goshaloveu" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="text-gray-600 hover:text-blue-500 transition-colors"
        aria-label="Telegram"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.402l-1.715 8.059c-.13.601-.484.741-.979.461l-2.709-1.994-1.307 1.258c-.145.145-.267.267-.546.267l.195-2.767 5.037-4.551c.219-.195-.047-.304-.336-.109l-6.214 3.912-2.678-.836c-.582-.183-.594-.582.122-.861l10.465-4.037c.487-.176.915.109.765.638z"></path>
        </svg>
      </a>
      <a 
        href="#" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="text-gray-600 hover:text-blue-500 transition-colors"
        aria-label="Twitter"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
        </svg>
      </a>
      <a 
        href="#" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="text-gray-600 hover:text-blue-500 transition-colors"
        aria-label="Website"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path>
        </svg>
      </a>
    </div>
  );
}; 