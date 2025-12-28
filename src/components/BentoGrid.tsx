import React from 'react';
import { projects } from '../data/projects';
import ProjectCard from './ProjectCard';

const BentoGrid: React.FC = () => {
  
  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'tall':
        return 'md:row-span-2 md:col-span-1';
      case 'large':
        return 'md:col-span-2 md:row-span-2';
      case 'medium':
        // Spanning 2 columns makes medium items wide
        return 'md:col-span-2 md:row-span-1';
      case 'small':
      default:
        return 'md:col-span-1 md:row-span-1';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[minmax(180px,auto)] pb-12">
      {projects.map((project) => (
        <div 
          key={project.id} 
          className={getSizeClasses(project.size)}
        >
          <ProjectCard project={project} />
        </div>
      ))}
    </div>
  );
};

export default BentoGrid;