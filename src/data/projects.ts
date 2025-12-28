export interface Project {
  id: string;
  title: string;
  description: string;
  icon: string;
  link: string;
  tags: string[];
  size: 'small' | 'medium' | 'large' | 'tall';
  status: 'live' | 'wip' | 'demo';
  image?: string;
}

// Safe, high-quality placeholders from Unsplash
const CODING_IMG = 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80';
const GAME_IMG = 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&q=80';
const CREATIVE_IMG = 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80';

export const projects: Project[] = [
  {
    id: 'cv',
    title: 'Curriculum Vitae',
    description: 'Mi trayectoria profesional y experiencia en formato PDF.',
    icon: 'FileText',
    link: '#', 
    tags: ['Resume', 'Professional'],
    size: 'tall',
    status: 'live',
    image: CODING_IMG,
  },
  {
    id: 'buckshot',
    title: 'Buckshot Tracker',
    description: 'Herramienta de seguimiento y conteo para juegos de estrategia.',
    icon: 'Crosshair',
    link: '#', 
    tags: ['Game Tool', 'React'],
    size: 'medium',
    status: 'live',
    image: GAME_IMG,
  },
  {
    id: 'stickergen',
    title: 'StickerGen',
    description: 'Generación creativa de assets visuales.',
    icon: 'Sparkles',
    link: '#', 
    tags: ['Design', 'Creative'],
    size: 'medium',
    status: 'demo',
    image: CREATIVE_IMG,
  },
  {
    id: 'lab',
    title: 'Guarnold Lab',
    description: 'Zona de experimentos y prototipos en desarrollo.',
    icon: 'FlaskConical',
    link: '#',
    tags: ['R&D', 'Experimental'],
    size: 'small',
    status: 'wip',
    // No image intentionally to test icon-only layout
  }
];