import React from 'react';
import { Link } from 'react-router-dom';

export const SearchButton: React.FC = () => {
  return (
    <Link 
      to="/competitions" 
      className="text-muted-foreground hover:text-primary flex justify-center items-center self-stretch px-2 hover:bg-muted/50 rounded-md transition-colors"
      aria-label="Search competitions"
    >
      <svg 
        viewBox='0 0 32 32' 
        className="w-5 h-5" 
        xmlns='http://www.w3.org/2000/svg'
      >
        <path 
          fill='currentColor' 
          d='m29 27.586l-7.552-7.552a11.018 11.018 0 1 0-1.414 1.414L27.586 29ZM4 13a9 9 0 1 1 9 9a9.01 9.01 0 0 1-9-9Z'
        />
      </svg>
    </Link>
  );
}; 