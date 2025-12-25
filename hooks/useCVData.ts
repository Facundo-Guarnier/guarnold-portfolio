
import { useState, useEffect, useCallback, useMemo } from 'react';
import { CVData, Personal, Experiencia, Educacion, Skill, Proyecto, CVSettings, LinkObj } from '@/types/cv';
import { supabase } from '@/lib/supabase';

// Clave para preferencias de tema del visitante (persistente en localStorage)
const VISITOR_THEME_KEY = 'guarnold_cv_visitor_theme';
// Versión del schema de settings para detectar incompatibilidades
const SETTINGS_SCHEMA_VERSION = 1;

// Colores de tema válidos (fuente de verdad)
const VALID_THEME_COLORS = ['neutral', 'blue', 'emerald', 'purple', 'rose', 'amber'] as const;
type ValidThemeColor = typeof VALID_THEME_COLORS[number];

// ID del perfil principal (singleton)
let PROFILE_ID: string | null = null;

const defaultSettings: CVSettings = {
  themeColor: 'neutral',
  darkMode: false
};

// Interfaz para datos guardados en localStorage con versionado
interface StoredVisitorSettings {
  version: number;
  settings: CVSettings;
  timestamp: number;
}

/**
 * Valida y sanitiza los settings del visitante desde localStorage.
 * Si hay incompatibilidades o datos corruptos, retorna null.
 */
function validateAndLoadVisitorSettings(): CVSettings | null {
  try {
    const stored = localStorage.getItem(VISITOR_THEME_KEY);
    if (!stored) return null;

    const parsed: StoredVisitorSettings = JSON.parse(stored);

    // Verificar versión del schema
    if (typeof parsed.version !== 'number' || parsed.version < SETTINGS_SCHEMA_VERSION) {
      console.warn('[CVData] Visitor settings outdated, clearing...');
      localStorage.removeItem(VISITOR_THEME_KEY);
      return null;
    }

    // Verificar estructura básica
    if (!parsed.settings || typeof parsed.settings !== 'object') {
      console.warn('[CVData] Invalid visitor settings structure, clearing...');
      localStorage.removeItem(VISITOR_THEME_KEY);
      return null;
    }

    const { themeColor, darkMode } = parsed.settings;

    // Validar themeColor contra lista de colores válidos
    if (!VALID_THEME_COLORS.includes(themeColor as ValidThemeColor)) {
      console.warn(`[CVData] Invalid themeColor "${themeColor}", using default`);
      parsed.settings.themeColor = defaultSettings.themeColor;
    }

    // Validar darkMode es boolean
    if (typeof darkMode !== 'boolean') {
      console.warn('[CVData] Invalid darkMode value, using default');
      parsed.settings.darkMode = defaultSettings.darkMode;
    }

    return parsed.settings;
  } catch (error) {
    console.error('[CVData] Error parsing visitor settings:', error);
    localStorage.removeItem(VISITOR_THEME_KEY);
    return null;
  }
}

/**
 * Guarda las preferencias del visitante en localStorage con versionado.
 */
function saveVisitorSettings(settings: CVSettings): void {
  const toStore: StoredVisitorSettings = {
    version: SETTINGS_SCHEMA_VERSION,
    settings,
    timestamp: Date.now()
  };
  localStorage.setItem(VISITOR_THEME_KEY, JSON.stringify(toStore));
}

/**
 * Limpia las preferencias del visitante del localStorage.
 */
function clearVisitorSettings(): void {
  localStorage.removeItem(VISITOR_THEME_KEY);
}

const emptyData: CVData = {
  settings: defaultSettings,
  personal: {
    nombre: '',
    titulo: '',
    email: '',
    telefono: '',
    ubicacion: '',
    links: [],
    resumen: '',
    foto: ''
  },
  experiencia: [],
  educacion: [],
  skills: [],
  proyectos: []
};

export const useCVData = () => {
  // Estado original de Supabase (fuente de verdad para comparar)
  const [originalData, setOriginalData] = useState<CVData>(emptyData);
  // Estado local con cambios pendientes
  const [data, setData] = useState<CVData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Items pendientes de eliminar (se procesan al guardar)
  const [pendingDeletes, setPendingDeletes] = useState<{
    experiences: string[];
    education: string[];
    skills: string[];
    projects: string[];
  }>({ experiences: [], education: [], skills: [], projects: [] });

  // Visitor Settings (preferencias locales para usuarios no autenticados)
  const [visitorSettings, setVisitorSettings] = useState<CVSettings | null>(() => {
    return validateAndLoadVisitorSettings();
  });

  // Computed Data: Prioridad = visitorSettings > data.settings (de Supabase)
  const displayData: CVData = {
    ...data,
    settings: visitorSettings || data.settings
  };

  // Detectar si hay cambios sin guardar
  const isDirty = useMemo(() => {
    // Comparar data con originalData
    const dataStr = JSON.stringify({
      settings: data.settings,
      personal: data.personal,
      experiencia: data.experiencia,
      educacion: data.educacion,
      skills: data.skills,
      proyectos: data.proyectos
    });
    const originalStr = JSON.stringify({
      settings: originalData.settings,
      personal: originalData.personal,
      experiencia: originalData.experiencia,
      educacion: originalData.educacion,
      skills: originalData.skills,
      proyectos: originalData.proyectos
    });
    
    const hasDeletes = 
      pendingDeletes.experiences.length > 0 ||
      pendingDeletes.education.length > 0 ||
      pendingDeletes.skills.length > 0 ||
      pendingDeletes.projects.length > 0;

    return dataStr !== originalStr || hasDeletes;
  }, [data, originalData, pendingDeletes]);

  // --- FETCH DATA FROM SUPABASE ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Obtener el perfil (asumimos que hay uno solo - singleton)
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

      if (profileError) throw profileError;

      if (!profiles || profiles.length === 0) {
        // No hay perfil, mantener datos vacíos
        setLoading(false);
        return;
      }

      const profile = profiles[0];
      PROFILE_ID = profile.id;

      // 2. Fetch todas las relaciones en paralelo
      const [linksRes, expRes, eduRes, skillsRes, projRes] = await Promise.all([
        supabase.from('social_links').select('*').eq('profile_id', profile.id).order('display_order'),
        supabase.from('experiences').select('*').eq('profile_id', profile.id).order('display_order'),
        supabase.from('education').select('*').eq('profile_id', profile.id).order('display_order'),
        supabase.from('skills').select('*').eq('profile_id', profile.id).order('display_order'),
        supabase.from('projects').select('*').eq('profile_id', profile.id).order('display_order'),
      ]);

      // Verificar errores
      if (linksRes.error) throw linksRes.error;
      if (expRes.error) throw expRes.error;
      if (eduRes.error) throw eduRes.error;
      if (skillsRes.error) throw skillsRes.error;
      if (projRes.error) throw projRes.error;

      // 3. Mapear a estructura CVData
      const cvData: CVData = {
        settings: (profile.settings as CVSettings) || defaultSettings,
        personal: {
          nombre: profile.nombre || '',
          titulo: profile.titulo || '',
          email: profile.email || '',
          telefono: profile.telefono || '',
          ubicacion: profile.ubicacion || '',
          resumen: profile.resumen || '',
          foto: profile.foto_url || '',
          links: (linksRes.data || []).map(link => ({
            id: link.id,
            label: link.label || '',
            url: link.url || '',
            platform: link.platform || undefined
          }))
        },
        experiencia: (expRes.data || []).map(exp => ({
          id: exp.id,
          puesto: exp.puesto || '',
          empresa: exp.empresa || '',
          periodo: exp.periodo || '',
          descripcion: exp.descripcion || ''
        })),
        educacion: (eduRes.data || []).map(edu => ({
          id: edu.id,
          institucion: edu.institucion || '',
          titulo: edu.titulo || '',
          periodo: edu.periodo || '',
          descripcion: edu.descripcion || ''
        })),
        skills: (skillsRes.data || []).map(skill => ({
          id: skill.id,
          nombre: skill.nombre || '',
          nivel: skill.nivel || 0
        })),
        proyectos: (projRes.data || []).map(proj => ({
          id: proj.id,
          nombre: proj.nombre || '',
          descripcion: proj.descripcion || '',
          tecnologias: proj.tecnologias || '',
          url: proj.url || undefined
        }))
      };

      setData(cvData);
      setOriginalData(cvData);
      // Limpiar pendientes de eliminar
      setPendingDeletes({ experiences: [], education: [], skills: [], projects: [] });
    } catch (err) {
      console.error('Error fetching CV data:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar datos al montar
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- THEME SYNC EFFECT ---
  useEffect(() => {
    const root = window.document.documentElement;
    const isDark = displayData.settings.darkMode;

    root.classList.remove('light', 'dark');

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.add('light');
    }
  }, [displayData.settings.darkMode]);

  // --- ACTIONS ---

  // Theme Management
  // isAdmin: true = usuario autenticado (cambio local, se guarda con saveAllChanges), false = visitante (guarda en localStorage)
  const setTheme = (newSettings: Partial<CVSettings>, isAdmin: boolean) => {
    const currentSettings = displayData.settings;
    const updatedSettings = { ...currentSettings, ...newSettings };

    // Validar que el color sea válido antes de guardar
    if (updatedSettings.themeColor && !VALID_THEME_COLORS.includes(updatedSettings.themeColor as ValidThemeColor)) {
      console.warn(`[CVData] Attempted to set invalid themeColor: ${updatedSettings.themeColor}`);
      updatedSettings.themeColor = defaultSettings.themeColor;
    }

    if (isAdmin) {
      // Admin: Solo cambio local (se guarda con saveAllChanges)
      setData(prev => ({ ...prev, settings: updatedSettings }));
      // Limpiar preferencias del visitante ya que el admin está estableciendo el default
      setVisitorSettings(null);
      clearVisitorSettings();
    } else {
      // Visitante: Guardar solo en localStorage (no afecta la BD)
      setVisitorSettings(updatedSettings);
      saveVisitorSettings(updatedSettings);
    }
  };

  /**
   * Resetea las preferencias del visitante al tema predeterminado (el del admin).
   * Útil para un botón "Restablecer tema original" en la UI pública.
   */
  const resetVisitorTheme = () => {
    setVisitorSettings(null);
    clearVisitorSettings();
  };

  // Generic Move Function (solo cambio local)
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

  // Personal (solo cambio local)
  const updatePersonal = (personalUpdate: Partial<Personal>) => {
    setData(prev => ({
      ...prev,
      personal: { ...prev.personal, ...personalUpdate }
    }));
  };

  // Experiencia (solo cambios locales - IDs temporales para nuevos items)
  const addExperiencia = (experiencia: Omit<Experiencia, 'id'>) => {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setData(prev => ({
      ...prev,
      experiencia: [...prev.experiencia, {
        id: tempId,
        puesto: experiencia.puesto || '',
        empresa: experiencia.empresa || '',
        periodo: experiencia.periodo || '',
        descripcion: experiencia.descripcion || ''
      }]
    }));
  };

  const updateExperiencia = (id: string, updates: Partial<Experiencia>) => {
    setData(prev => ({
      ...prev,
      experiencia: prev.experiencia.map(exp => exp.id === id ? { ...exp, ...updates } : exp)
    }));
  };

  const removeExperiencia = (id: string) => {
    // Si es un item existente en la BD (no temporal), agregarlo a pendingDeletes
    if (!id.startsWith('temp_')) {
      setPendingDeletes(prev => ({
        ...prev,
        experiences: [...prev.experiences, id]
      }));
    }
    setData(prev => ({
      ...prev,
      experiencia: prev.experiencia.filter(exp => exp.id !== id)
    }));
  };

  // Educacion (solo cambios locales)
  const addEducacion = (educacion: Omit<Educacion, 'id'>) => {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setData(prev => ({
      ...prev,
      educacion: [...prev.educacion, {
        id: tempId,
        institucion: educacion.institucion || '',
        titulo: educacion.titulo || '',
        periodo: educacion.periodo || '',
        descripcion: educacion.descripcion || ''
      }]
    }));
  };

  const updateEducacion = (id: string, updates: Partial<Educacion>) => {
    setData(prev => ({
      ...prev,
      educacion: prev.educacion.map(edu => edu.id === id ? { ...edu, ...updates } : edu)
    }));
  };

  const removeEducacion = (id: string) => {
    if (!id.startsWith('temp_')) {
      setPendingDeletes(prev => ({
        ...prev,
        education: [...prev.education, id]
      }));
    }
    setData(prev => ({
      ...prev,
      educacion: prev.educacion.filter(edu => edu.id !== id)
    }));
  };

  // Skills (solo cambios locales)
  const addSkill = (skill: Omit<Skill, 'id'>) => {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setData(prev => ({
      ...prev,
      skills: [...prev.skills, {
        id: tempId,
        nombre: skill.nombre || '',
        nivel: skill.nivel || 0
      }]
    }));
  };

  const updateSkill = (id: string, updates: Partial<Skill>) => {
    setData(prev => ({
      ...prev,
      skills: prev.skills.map(skill => skill.id === id ? { ...skill, ...updates } : skill)
    }));
  };

  const removeSkill = (id: string) => {
    if (!id.startsWith('temp_')) {
      setPendingDeletes(prev => ({
        ...prev,
        skills: [...prev.skills, id]
      }));
    }
    setData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill.id !== id)
    }));
  };

  // Proyectos (solo cambios locales)
  const addProyecto = (proyecto: Omit<Proyecto, 'id'>) => {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setData(prev => ({
      ...prev,
      proyectos: [...prev.proyectos, {
        id: tempId,
        nombre: proyecto.nombre || '',
        descripcion: proyecto.descripcion || '',
        tecnologias: proyecto.tecnologias || '',
        url: proyecto.url || undefined
      }]
    }));
  };

  const updateProyecto = (id: string, updates: Partial<Proyecto>) => {
    setData(prev => ({
      ...prev,
      proyectos: prev.proyectos.map(proj => proj.id === id ? { ...proj, ...updates } : proj)
    }));
  };

  const removeProyecto = (id: string) => {
    if (!id.startsWith('temp_')) {
      setPendingDeletes(prev => ({
        ...prev,
        projects: [...prev.projects, id]
      }));
    }
    setData(prev => ({
      ...prev,
      proyectos: prev.proyectos.filter(proj => proj.id !== id)
    }));
  };

  // --- SAVE ALL CHANGES TO SUPABASE ---
  const saveAllChanges = async (): Promise<{ success: boolean; error?: string }> => {
    if (!PROFILE_ID) {
      return { success: false, error: 'No hay perfil configurado' };
    }

    setSaving(true);
    setError(null);

    try {
      // 1. Guardar profile (personal + settings)
      const profileUpdate: Record<string, unknown> = {
        nombre: data.personal.nombre,
        titulo: data.personal.titulo,
        email: data.personal.email,
        telefono: data.personal.telefono,
        ubicacion: data.personal.ubicacion,
        resumen: data.personal.resumen,
        foto_url: data.personal.foto,
        settings: data.settings
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('id', PROFILE_ID);

      if (profileError) throw profileError;

      // 2. Guardar links (eliminar todos y reinsertar)
      await supabase.from('social_links').delete().eq('profile_id', PROFILE_ID);
      
      if (data.personal.links.length > 0) {
        const linksToInsert = data.personal.links.map((link, idx) => ({
          profile_id: PROFILE_ID,
          label: link.label,
          url: link.url,
          platform: link.platform || null,
          display_order: idx
        }));

        const { error: linksError } = await supabase.from('social_links').insert(linksToInsert);
        if (linksError) throw linksError;
      }

      // 3. Procesar eliminaciones pendientes
      if (pendingDeletes.experiences.length > 0) {
        const { error } = await supabase.from('experiences').delete().in('id', pendingDeletes.experiences);
        if (error) throw error;
      }
      if (pendingDeletes.education.length > 0) {
        const { error } = await supabase.from('education').delete().in('id', pendingDeletes.education);
        if (error) throw error;
      }
      if (pendingDeletes.skills.length > 0) {
        const { error } = await supabase.from('skills').delete().in('id', pendingDeletes.skills);
        if (error) throw error;
      }
      if (pendingDeletes.projects.length > 0) {
        const { error } = await supabase.from('projects').delete().in('id', pendingDeletes.projects);
        if (error) throw error;
      }

      // 4. Guardar experiencias (upsert para existentes, insert para nuevos)
      for (let idx = 0; idx < data.experiencia.length; idx++) {
        const exp = data.experiencia[idx];
        if (exp.id.startsWith('temp_')) {
          // Nuevo item
          const { error } = await supabase.from('experiences').insert({
            profile_id: PROFILE_ID,
            puesto: exp.puesto,
            empresa: exp.empresa,
            periodo: exp.periodo,
            descripcion: exp.descripcion,
            display_order: idx
          });
          if (error) throw error;
        } else {
          // Actualizar existente
          const { error } = await supabase.from('experiences').update({
            puesto: exp.puesto,
            empresa: exp.empresa,
            periodo: exp.periodo,
            descripcion: exp.descripcion,
            display_order: idx
          }).eq('id', exp.id);
          if (error) throw error;
        }
      }

      // 5. Guardar educación
      for (let idx = 0; idx < data.educacion.length; idx++) {
        const edu = data.educacion[idx];
        if (edu.id.startsWith('temp_')) {
          const { error } = await supabase.from('education').insert({
            profile_id: PROFILE_ID,
            institucion: edu.institucion,
            titulo: edu.titulo,
            periodo: edu.periodo,
            descripcion: edu.descripcion,
            display_order: idx
          });
          if (error) throw error;
        } else {
          const { error } = await supabase.from('education').update({
            institucion: edu.institucion,
            titulo: edu.titulo,
            periodo: edu.periodo,
            descripcion: edu.descripcion,
            display_order: idx
          }).eq('id', edu.id);
          if (error) throw error;
        }
      }

      // 6. Guardar skills
      for (let idx = 0; idx < data.skills.length; idx++) {
        const skill = data.skills[idx];
        if (skill.id.startsWith('temp_')) {
          const { error } = await supabase.from('skills').insert({
            profile_id: PROFILE_ID,
            nombre: skill.nombre,
            nivel: skill.nivel,
            display_order: idx
          });
          if (error) throw error;
        } else {
          const { error } = await supabase.from('skills').update({
            nombre: skill.nombre,
            nivel: skill.nivel,
            display_order: idx
          }).eq('id', skill.id);
          if (error) throw error;
        }
      }

      // 7. Guardar proyectos
      for (let idx = 0; idx < data.proyectos.length; idx++) {
        const proj = data.proyectos[idx];
        if (proj.id.startsWith('temp_')) {
          const { error } = await supabase.from('projects').insert({
            profile_id: PROFILE_ID,
            nombre: proj.nombre,
            descripcion: proj.descripcion,
            tecnologias: proj.tecnologias,
            url: proj.url,
            display_order: idx
          });
          if (error) throw error;
        } else {
          const { error } = await supabase.from('projects').update({
            nombre: proj.nombre,
            descripcion: proj.descripcion,
            tecnologias: proj.tecnologias,
            url: proj.url,
            display_order: idx
          }).eq('id', proj.id);
          if (error) throw error;
        }
      }

      // 8. Recargar datos para sincronizar IDs reales
      await fetchData();
      
      return { success: true };
    } catch (err) {
      console.error('Error saving changes:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al guardar';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setSaving(false);
    }
  };

  // Descartar cambios locales y volver al estado original
  const discardChanges = () => {
    setData(originalData);
    setPendingDeletes({ experiences: [], education: [], skills: [], projects: [] });
  };

  const resetData = async () => {
    setVisitorSettings(null);
    clearVisitorSettings();
    await fetchData();
  };

  return {
    data: displayData,
    loading,
    saving,
    error,
    isDirty,
    refetch: fetchData,
    setTheme,
    resetVisitorTheme,
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
    saveAllChanges,
    discardChanges,
    resetData
  };
};
