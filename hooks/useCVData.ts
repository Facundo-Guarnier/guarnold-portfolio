
import { useState, useEffect } from 'react';
import { CVData, Personal, Experiencia, Educacion, Skill, Proyecto, CVSettings } from '../types/cv';
import { initialCVData } from '../data/mockData';

const STORAGE_KEY = 'guarnold_cv_data_v4';
const SESSION_THEME_KEY = 'guarnold_cv_session_theme';

export const useCVData = () => {
  // 1. Persistent State (Database/LocalStorage representation)
  const [data, setData] = useState<CVData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure settings exist in legacy data
        if (!parsed.settings) {
            parsed.settings = initialCVData.settings;
        }
        // Basic check to see if it's the new schema
        if (parsed.personal && Array.isArray(parsed.personal.links)) {
            return parsed;
        }
      } catch (e) {
        console.error("Failed to parse saved CV data", e);
      }
    }
    return initialCVData;
  });

  // 2. Session State (Temporary overrides for public viewers)
  const [sessionSettings, setSessionSettings] = useState<CVSettings | null>(() => {
    const sessionSaved = sessionStorage.getItem(SESSION_THEME_KEY);
    return sessionSaved ? JSON.parse(sessionSaved) : null;
  });

  // 3. Computed Data (Merges persistent data with session overrides)
  // This is what the UI consumes.
  const displayData: CVData = {
    ...data,
    settings: sessionSettings || data.settings
  };

  // Sync Persistent Data to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  // --- Actions ---

  // Theme Management
  const setTheme = (newSettings: Partial<CVSettings>, isPublicView: boolean) => {
    const currentSettings = displayData.settings;
    const updatedSettings = { ...currentSettings, ...newSettings };

    if (isPublicView) {
      // Public View: Only update session state
      setSessionSettings(updatedSettings);
      sessionStorage.setItem(SESSION_THEME_KEY, JSON.stringify(updatedSettings));
    } else {
      // Admin View: Commit to persistent storage and clear session
      setData(prev => ({ ...prev, settings: updatedSettings }));
      setSessionSettings(null); // Clear override so admin sees the "real" source of truth
      sessionStorage.removeItem(SESSION_THEME_KEY);
    }
  };

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
    setSessionSettings(null);
    sessionStorage.removeItem(SESSION_THEME_KEY);
  };

  return {
    data: displayData, // Expose the computed data
    setTheme,
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
