
import { CVData } from '../types/cv';

export const initialCVData: CVData = {
  personal: {
    nombre: "Facundo Guarnier",
    titulo: "Ingeniero en Informática | Desarrollador de Software",
    email: "facundoguarnier@gmail.com",
    telefono: "+54 9 261 511-7024",
    ubicacion: "Guaymallén, Mendoza, Argentina",
    links: [
      { id: 'lnk-1', label: 'LinkedIn', url: 'linkedin.com/in/facundo-guarnier' },
      { id: 'lnk-2', label: 'GitHub', url: 'github.com/Facundo-Guarnier' }
    ],
    resumen: "Ingeniero en Informática con experiencia profesional en el desarrollo de soluciones tecnológicas full-stack. Especializado en el ciclo de vida completo del desarrollo, desde la concepción hasta el despliegue, utilizando tecnologías modernas como Flutter, React, FastAPI, Python y K8s. Me motiva el desafío de crear tecnología con propósito y busco colaborar en equipos innovadores para aportar valor real.",
    foto: "assets/profile.jpg"
  },
  experiencia: [
    {
      id: "exp-1",
      puesto: "Desarrollador de Software",
      empresa: "Tinkin (Remoto)",
      periodo: "Agosto 2024 - Actualidad",
      descripcion: "Desarrollo de soluciones full-stack en entorno ágil (Scrum).\n• Proyecto Fideval App: Desarrollo frontend (Flutter/Dart) de plataforma de inversión para mercado ecuatoriano. Contribuí en arquitectura y UI.\n• Proyecto Mercately: Migración de frontend de Ruby on Rails a React/TypeScript, mejorando UX.\n• Proyecto Kamina Academy: Desarrollo de componentes backend (FastAPI/Python) y frontend (React).\n• Cultura: Dictado de sesiones técnicas (Dojos) sobre Git, AWS y Hardware."
    }
  ],
  educacion: [
    {
      id: "edu-1",
      institucion: "Universidad de Mendoza",
      titulo: "Ingeniería en Informática",
      periodo: "2020 - 2025",
      descripcion: "Cursado finalizado, tesis pendiente de defensa."
    },
    {
      id: "edu-2",
      institucion: "Clases Particulares",
      titulo: "Inglés",
      periodo: "2021 - Actualidad",
      descripcion: "Nivel B1 alcanzado."
    }
  ],
  skills: [
    { id: "sk-1", nombre: "Python / FastAPI", nivel: 5 },
    { id: "sk-2", nombre: "React / TypeScript", nivel: 5 },
    { id: "sk-3", nombre: "Flutter / Dart", nivel: 4 },
    { id: "sk-4", nombre: "SQL / MongoDB", nivel: 4 },
    { id: "sk-5", nombre: "Docker / K8s", nivel: 3 },
    { id: "sk-6", nombre: "Git / GitLab Flow", nivel: 5 },
    { id: "sk-9", nombre: "Trabajo en Equipo", nivel: 5 },
    { id: "sk-10", nombre: "Adaptabilidad", nivel: 5 }
  ],
  proyectos: [
    {
      id: "proj-1",
      nombre: "SemaforIA - Tesis de Grado",
      descripcion: "Sistema autónomo de gestión de tráfico usando Aprendizaje por Refuerzo (DQN) y YOLOv8.\n• Resultados: Reducción del 58% en tiempos de espera promedio.\n• Stack: Python, TensorFlow, OpenCV, Flask, Streamlit.",
      tecnologias: "Python, AI, Computer Vision"
    },
    {
      id: "proj-2",
      nombre: "Reconocimiento Facial",
      descripcion: "Implementación de script con modelos InceptionV3 y MobileNetV2 para reconocimiento en tiempo real.",
      tecnologias: "Python, OpenCV, Keras"
    }
  ]
};
