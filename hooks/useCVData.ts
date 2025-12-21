
import { useState, useEffect, useCallback } from 'react';
import { CVData, Personal, Experiencia, Educacion, Skill, Proyecto, CVSettings, LinkObj } from '../types/cv';
import { supabase } from '../lib/supabase';

const SESSION_THEME_KEY = 'guarnold_cv_session_theme';

// ID del perfil principal (singleton)
// En producción, esto vendría de la autenticación o de una query inicial
let PROFILE_ID: string | null = null;

const defaultSettings: CVSettings = {
  themeColor: 'neutral',
  darkMode: false
};

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
  // Estados principales
  const [data, setData] = useState<CVData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Session State (Temporary overrides for public viewers)
  const [sessionSettings, setSessionSettings] = useState<CVSettings | null>(() => {
    const sessionSaved = sessionStorage.getItem(SESSION_THEME_KEY);
    return sessionSaved ? JSON.parse(sessionSaved) : null;
  });

  // Computed Data (Merges persistent data with session overrides)
  const displayData: CVData = {
    ...data,
    settings: sessionSettings || data.settings
  };

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
  const setTheme = async (newSettings: Partial<CVSettings>, isPublicView: boolean) => {
    const currentSettings = displayData.settings;
    const updatedSettings = { ...currentSettings, ...newSettings };

    if (isPublicView) {
      // Public View: Only update session state
      setSessionSettings(updatedSettings);
      sessionStorage.setItem(SESSION_THEME_KEY, JSON.stringify(updatedSettings));
    } else {
      // Admin View: Commit to Supabase
      setData(prev => ({ ...prev, settings: updatedSettings }));
      setSessionSettings(null);
      sessionStorage.removeItem(SESSION_THEME_KEY);

      if (PROFILE_ID) {
        await supabase
          .from('profiles')
          .update({ settings: updatedSettings })
          .eq('id', PROFILE_ID);
      }
    }
  };

  // Generic Move Function
  const moveItem = async (section: 'experiencia' | 'educacion' | 'proyectos' | 'skills', index: number, direction: 'up' | 'down') => {
    const tableMap = {
      experiencia: 'experiences',
      educacion: 'education',
      proyectos: 'projects',
      skills: 'skills'
    };

    setData(prev => {
      const list = [...prev[section]];
      if (direction === 'up' && index > 0) {
        [list[index], list[index - 1]] = [list[index - 1], list[index]];
      } else if (direction === 'down' && index < list.length - 1) {
        [list[index], list[index + 1]] = [list[index + 1], list[index]];
      }

      // Actualizar display_order en Supabase
      const updates = list.map((item, idx) => ({
        id: item.id,
        display_order: idx
      }));

      supabase
        .from(tableMap[section])
        .upsert(updates)
        .then(({ error }) => {
          if (error) console.error('Error updating order:', error);
        });

      return { ...prev, [section]: list };
    });
  };

  // Personal
  const updatePersonal = async (personalUpdate: Partial<Personal>) => {
    // Optimistic update
    setData(prev => ({
      ...prev,
      personal: { ...prev.personal, ...personalUpdate }
    }));

    if (!PROFILE_ID) return;

    // Mapear campos de Personal a columnas de profiles
    const profileUpdate: Record<string, unknown> = {};
    if (personalUpdate.nombre !== undefined) profileUpdate.nombre = personalUpdate.nombre;
    if (personalUpdate.titulo !== undefined) profileUpdate.titulo = personalUpdate.titulo;
    if (personalUpdate.email !== undefined) profileUpdate.email = personalUpdate.email;
    if (personalUpdate.telefono !== undefined) profileUpdate.telefono = personalUpdate.telefono;
    if (personalUpdate.ubicacion !== undefined) profileUpdate.ubicacion = personalUpdate.ubicacion;
    if (personalUpdate.resumen !== undefined) profileUpdate.resumen = personalUpdate.resumen;
    if (personalUpdate.foto !== undefined) profileUpdate.foto_url = personalUpdate.foto;

    if (Object.keys(profileUpdate).length > 0) {
      const { error } = await supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('id', PROFILE_ID);

      if (error) console.error('Error updating profile:', error);
    }

    // Manejar links si se actualizaron
    if (personalUpdate.links !== undefined) {
      // Eliminar links existentes y reinsertar
      await supabase.from('social_links').delete().eq('profile_id', PROFILE_ID);
      
      if (personalUpdate.links.length > 0) {
        const linksToInsert = personalUpdate.links.map((link, idx) => ({
          profile_id: PROFILE_ID,
          label: link.label,
          url: link.url,
          platform: link.platform || null,
          display_order: idx
        }));

        const { error } = await supabase.from('social_links').insert(linksToInsert);
        if (error) console.error('Error updating links:', error);
      }
    }
  };

  // Experiencia
  const addExperiencia = async (experiencia: Omit<Experiencia, 'id'>) => {
    if (!PROFILE_ID) return;

    const { data: newExp, error } = await supabase
      .from('experiences')
      .insert({
        profile_id: PROFILE_ID,
        puesto: experiencia.puesto,
        empresa: experiencia.empresa,
        periodo: experiencia.periodo,
        descripcion: experiencia.descripcion,
        display_order: data.experiencia.length
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding experience:', error);
      return;
    }

    if (newExp) {
      setData(prev => ({
        ...prev,
        experiencia: [...prev.experiencia, {
          id: newExp.id,
          puesto: newExp.puesto || '',
          empresa: newExp.empresa || '',
          periodo: newExp.periodo || '',
          descripcion: newExp.descripcion || ''
        }]
      }));
    }
  };

  const updateExperiencia = async (id: string, updates: Partial<Experiencia>) => {
    // Optimistic update
    setData(prev => ({
      ...prev,
      experiencia: prev.experiencia.map(exp => exp.id === id ? { ...exp, ...updates } : exp)
    }));

    const { error } = await supabase
      .from('experiences')
      .update(updates)
      .eq('id', id);

    if (error) console.error('Error updating experience:', error);
  };

  const removeExperiencia = async (id: string) => {
    // Optimistic update
    setData(prev => ({
      ...prev,
      experiencia: prev.experiencia.filter(exp => exp.id !== id)
    }));

    const { error } = await supabase
      .from('experiences')
      .delete()
      .eq('id', id);

    if (error) console.error('Error removing experience:', error);
  };

  // Educacion
  const addEducacion = async (educacion: Omit<Educacion, 'id'>) => {
    if (!PROFILE_ID) return;

    const { data: newEdu, error } = await supabase
      .from('education')
      .insert({
        profile_id: PROFILE_ID,
        institucion: educacion.institucion,
        titulo: educacion.titulo,
        periodo: educacion.periodo,
        descripcion: educacion.descripcion,
        display_order: data.educacion.length
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding education:', error);
      return;
    }

    if (newEdu) {
      setData(prev => ({
        ...prev,
        educacion: [...prev.educacion, {
          id: newEdu.id,
          institucion: newEdu.institucion || '',
          titulo: newEdu.titulo || '',
          periodo: newEdu.periodo || '',
          descripcion: newEdu.descripcion || ''
        }]
      }));
    }
  };

  const updateEducacion = async (id: string, updates: Partial<Educacion>) => {
    setData(prev => ({
      ...prev,
      educacion: prev.educacion.map(edu => edu.id === id ? { ...edu, ...updates } : edu)
    }));

    const { error } = await supabase
      .from('education')
      .update(updates)
      .eq('id', id);

    if (error) console.error('Error updating education:', error);
  };

  const removeEducacion = async (id: string) => {
    setData(prev => ({
      ...prev,
      educacion: prev.educacion.filter(edu => edu.id !== id)
    }));

    const { error } = await supabase
      .from('education')
      .delete()
      .eq('id', id);

    if (error) console.error('Error removing education:', error);
  };

  // Skills
  const addSkill = async (skill: Omit<Skill, 'id'>) => {
    if (!PROFILE_ID) return;

    const { data: newSkill, error } = await supabase
      .from('skills')
      .insert({
        profile_id: PROFILE_ID,
        nombre: skill.nombre,
        nivel: skill.nivel,
        display_order: data.skills.length
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding skill:', error);
      return;
    }

    if (newSkill) {
      setData(prev => ({
        ...prev,
        skills: [...prev.skills, {
          id: newSkill.id,
          nombre: newSkill.nombre || '',
          nivel: newSkill.nivel || 0
        }]
      }));
    }
  };

  const updateSkill = async (id: string, updates: Partial<Skill>) => {
    setData(prev => ({
      ...prev,
      skills: prev.skills.map(skill => skill.id === id ? { ...skill, ...updates } : skill)
    }));

    const { error } = await supabase
      .from('skills')
      .update(updates)
      .eq('id', id);

    if (error) console.error('Error updating skill:', error);
  };

  const removeSkill = async (id: string) => {
    setData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill.id !== id)
    }));

    const { error } = await supabase
      .from('skills')
      .delete()
      .eq('id', id);

    if (error) console.error('Error removing skill:', error);
  };

  // Proyectos
  const addProyecto = async (proyecto: Omit<Proyecto, 'id'>) => {
    if (!PROFILE_ID) return;

    const { data: newProj, error } = await supabase
      .from('projects')
      .insert({
        profile_id: PROFILE_ID,
        nombre: proyecto.nombre,
        descripcion: proyecto.descripcion,
        tecnologias: proyecto.tecnologias,
        url: proyecto.url,
        display_order: data.proyectos.length
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding project:', error);
      return;
    }

    if (newProj) {
      setData(prev => ({
        ...prev,
        proyectos: [...prev.proyectos, {
          id: newProj.id,
          nombre: newProj.nombre || '',
          descripcion: newProj.descripcion || '',
          tecnologias: newProj.tecnologias || '',
          url: newProj.url || undefined
        }]
      }));
    }
  };

  const updateProyecto = async (id: string, updates: Partial<Proyecto>) => {
    setData(prev => ({
      ...prev,
      proyectos: prev.proyectos.map(proj => proj.id === id ? { ...proj, ...updates } : proj)
    }));

    const { error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id);

    if (error) console.error('Error updating project:', error);
  };

  const removeProyecto = async (id: string) => {
    setData(prev => ({
      ...prev,
      proyectos: prev.proyectos.filter(proj => proj.id !== id)
    }));

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) console.error('Error removing project:', error);
  };

  const resetData = async () => {
    setSessionSettings(null);
    sessionStorage.removeItem(SESSION_THEME_KEY);
    await fetchData();
  };

  return {
    data: displayData,
    loading,
    error,
    refetch: fetchData,
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
