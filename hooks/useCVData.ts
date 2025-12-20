
import { useState, useEffect } from 'react';
import { CVData, Personal, Experiencia, Educacion, Skill, Proyecto } from '../types/cv';
import { initialCVData } from '../data/mockData';

const STORAGE_KEY = 'guarnold_cv_data_v4';

export const useCVData = () => {
  const [data, setData] = useState<CVData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Basic check to see if it's the new schema (check for 'links' array in personal)
        if (parsed.personal && Array.isArray(parsed.personal.links)) {
            return parsed;
        }
      } catch (e) {
        console.error("Failed to parse saved CV data", e);
      }
    }
    return initialCVData;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  // Generic Move Function
  const moveItem = (section: 'experiencia' | 'educacion' | 'proyectos' | 'skills', index: number, direction: 'up' | 'down') => {
    setData(prev => {
      const list = [...prev[section]];
      if (direction === 'up' && index > 0) {
        [list[index], list[index - 1]] = [list[index - 1], list[index]];
      } else if (direction === 'down' && index < list.length - 1) {
        [list[index], list[index + 1]] = [list[index + 1], list[index]];
      }
      return { ...prev, [section]: list };
    });
  };

  // Personal
  const updatePersonal = (personalUpdate: Partial<Personal>) => {
    setData(prev => ({
      ...prev,
      personal: { ...prev.personal, ...personalUpdate }
    }));
  };

  // Experiencia
  const addExperiencia = (experiencia: Omit<Experiencia, 'id'>) => {
    const newExp = { ...experiencia, id: `exp-${Date.now()}` };
    setData(prev => ({
      ...prev,
      experiencia: [...prev.experiencia, newExp]
    }));
  };

  const updateExperiencia = (id: string, updates: Partial<Experiencia>) => {
    setData(prev => ({
      ...prev,
      experiencia: prev.experiencia.map(exp => exp.id === id ? { ...exp, ...updates } : exp)
    }));
  };

  const removeExperiencia = (id: string) => {
    setData(prev => ({
      ...prev,
      experiencia: prev.experiencia.filter(exp => exp.id !== id)
    }));
  };

  // Educacion
  const addEducacion = (educacion: Omit<Educacion, 'id'>) => {
    const newEdu = { ...educacion, id: `edu-${Date.now()}` };
    setData(prev => ({
      ...prev,
      educacion: [...prev.educacion, newEdu]
    }));
  };

  const updateEducacion = (id: string, updates: Partial<Educacion>) => {
    setData(prev => ({
      ...prev,
      educacion: prev.educacion.map(edu => edu.id === id ? { ...edu, ...updates } : edu)
    }));
  };

  const removeEducacion = (id: string) => {
    setData(prev => ({
      ...prev,
      educacion: prev.educacion.filter(edu => edu.id !== id)
    }));
  };

  // Skills
  const addSkill = (skill: Omit<Skill, 'id'>) => {
    const newSkill = { ...skill, id: `skill-${Date.now()}` };
    setData(prev => ({
      ...prev,
      skills: [...prev.skills, newSkill]
    }));
  };

  const updateSkill = (id: string, updates: Partial<Skill>) => {
    setData(prev => ({
      ...prev,
      skills: prev.skills.map(skill => skill.id === id ? { ...skill, ...updates } : skill)
    }));
  };

  const removeSkill = (id: string) => {
    setData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill.id !== id)
    }));
  };

  // Proyectos
  const addProyecto = (proyecto: Omit<Proyecto, 'id'>) => {
    const newProj = { ...proyecto, id: `proj-${Date.now()}` };
    setData(prev => ({
      ...prev,
      proyectos: [...(prev.proyectos || []), newProj]
    }));
  };

  const updateProyecto = (id: string, updates: Partial<Proyecto>) => {
    setData(prev => ({
      ...prev,
      proyectos: prev.proyectos.map(proj => proj.id === id ? { ...proj, ...updates } : proj)
    }));
  };

  const removeProyecto = (id: string) => {
    setData(prev => ({
      ...prev,
      proyectos: prev.proyectos.filter(proj => proj.id !== id)
    }));
  };

  const resetData = () => {
    setData(initialCVData);
  };

  return {
    data,
    updatePersonal,
    moveItem,
    addExperiencia,
    updateExperiencia,
    removeExperiencia,
    addEducacion,
    updateEducacion,
    removeEducacion,
    addSkill,
    updateSkill,
    removeSkill,
    addProyecto,
    updateProyecto,
    removeProyecto,
    resetData
  };
};
