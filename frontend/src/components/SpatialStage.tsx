import React from 'react';
import { ViewState } from '../types/khata';

interface SpatialStageProps {
  currentView: ViewState;
  children: React.ReactNode;
}

export const SpatialStage: React.FC<SpatialStageProps> = ({ currentView, children }) => {
  // Compute spatial transform based on active hardware view
  const getStageTransform = (): string => {
    switch (currentView) {
      case 'console':
        return 'rotateY(0deg) rotateX(0deg) translateZ(0px)';
      case 'ledger':
        return 'rotateY(-2.5deg) rotateX(1deg) translateZ(-15px)';
      case 'judge':
        return 'rotateY(2.5deg) rotateX(-1deg) translateZ(-12px)';
      case 'privacy':
        return 'rotateY(-1.5deg) rotateX(0.5deg) translateZ(-10px)';
      case 'terms':
        return 'rotateY(1.5deg) rotateX(0.5deg) translateZ(-10px)';
      default:
        return 'rotateY(0deg) translateZ(0px)';
    }
  };

  return (
    <div className="spatial-viewport min-h-[calc(100vh-80px)] w-full bg-[#141413] py-4 px-3 sm:px-6 lg:px-8">
      <div
        className="spatial-stage-3d w-full"
        style={{
          transform: getStageTransform(),
          transition: 'transform 450ms cubic-bezier(0.22, 1, 0.36, 1)'
        }}
      >
        {children}
      </div>
    </div>
  );
};
