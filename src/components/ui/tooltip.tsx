'use client';

import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({ 
  content, 
  children, 
  position = 'top' 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [adjustedPosition, setAdjustedPosition] = useState(position);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const tooltipRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && tooltipRef.current && wrapperRef.current) {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        if (!tooltipRef.current || !wrapperRef.current) return;
        
        const tooltip = tooltipRef.current;
        const wrapper = wrapperRef.current;
        const rect = wrapper.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const padding = 8; // Padding from viewport edges
        const arrowSize = 4; // Size of arrow border
        
        let style: React.CSSProperties = {};
        let finalPosition = position;

        // Check horizontal overflow and adjust
        const buttonCenterX = rect.left + rect.width / 2;
        const tooltipWidth = tooltipRect.width;
        const idealLeft = buttonCenterX - tooltipWidth / 2;
        const idealRight = buttonCenterX + tooltipWidth / 2;
        
        // Calculate tooltip position relative to wrapper
        const wrapperLeft = rect.left;
        
        if (idealLeft < padding) {
          // Tooltip goes off left edge - align to left with padding
          const adjustedLeft = padding;
          // Position relative to wrapper
          style.left = `${adjustedLeft - wrapperLeft}px`;
          style.transform = 'none';
          // Calculate arrow offset to point to button center (relative to tooltip)
          const arrowOffset = buttonCenterX - adjustedLeft;
          style['--arrow-offset' as any] = `${Math.max(arrowSize, Math.min(arrowOffset, tooltipWidth - arrowSize))}px`;
        } else if (idealRight > viewportWidth - padding) {
          // Tooltip goes off right edge - align to right with padding
          const adjustedRight = viewportWidth - padding;
          const adjustedLeft = adjustedRight - tooltipWidth;
          // Position relative to wrapper
          style.left = `${adjustedLeft - wrapperLeft}px`;
          style.transform = 'none';
          // Calculate arrow offset to point to button center (relative to tooltip)
          const arrowOffset = buttonCenterX - adjustedLeft;
          style['--arrow-offset' as any] = `${Math.max(arrowSize, Math.min(arrowOffset, tooltipWidth - arrowSize))}px`;
        } else {
          // Tooltip fits, center it normally
          // Keep default classes which center it
        }

        // Check vertical overflow
        if (finalPosition === 'top' && tooltipRect.top < padding) {
          // Not enough space above, switch to bottom
          finalPosition = 'bottom';
        } else if (finalPosition === 'bottom' && tooltipRect.bottom > viewportHeight - padding) {
          // Not enough space below, switch to top
          finalPosition = 'top';
        }

        setAdjustedPosition(finalPosition);
        setTooltipStyle(style);
      });
    }
  }, [isVisible, position]);

  const verticalClasses = {
    top: 'bottom-full mb-1',
    bottom: 'top-full mt-1',
    left: 'right-full mr-1',
    right: 'left-full ml-1'
  };

  const horizontalClasses = {
    top: 'left-1/2 -translate-x-1/2',
    bottom: 'left-1/2 -translate-x-1/2',
    left: 'top-1/2 -translate-y-1/2',
    right: 'top-1/2 -translate-y-1/2'
  };

  // Arrow positioning: for 'top' position, arrow should be at bottom of tooltip pointing down
  // Arrow is positioned outside the tooltip box, pointing toward the button
  const arrowClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 border-t-slate-900 border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'top-full left-1/2 -translate-x-1/2 border-b-slate-900 border-l-transparent border-r-transparent border-t-transparent',
    left: 'right-full top-1/2 -translate-y-1/2 border-l-slate-900 border-t-transparent border-b-transparent border-r-transparent',
    right: 'left-full top-1/2 -translate-y-1/2 border-r-slate-900 border-t-transparent border-b-transparent border-l-transparent'
  };

  return (
    <div
      ref={wrapperRef}
      className="relative inline-block"
      onMouseEnter={() => {
        setIsVisible(true);
        setAdjustedPosition(position);
      }}
      onMouseLeave={() => {
        setIsVisible(false);
        setTooltipStyle({});
      }}
    >
      {children}
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`absolute z-50 pointer-events-none ${verticalClasses[adjustedPosition]} ${
            tooltipStyle.left === undefined && tooltipStyle.right === undefined
              ? horizontalClasses[adjustedPosition]
              : ''
          }`}
          style={tooltipStyle}
        >
          <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-2xl max-w-[300px] relative border border-slate-700/40 backdrop-blur-md animate-in fade-in-0 zoom-in-95 duration-200 ring-1 ring-black/20">
            <div className="whitespace-normal break-words leading-relaxed text-center drop-shadow-sm tracking-tight">{content}</div>
          </div>
        </div>
      )}
    </div>
  );
};
