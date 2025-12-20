
import React, { useRef } from 'react';
import { User, Upload, X, Plus, Trash2, Globe, Linkedin, Github, Twitter, Mail, Phone, Link as LinkIcon, Gitlab, Youtube, Instagram, MessageCircle, Send, Code2, BookOpen, Palette } from 'lucide-react';
import { Personal, LinkObj } from '../../types/cv';
import { Input, Label, TextArea, SectionTitle } from '../ui/Form';
import { Button } from '../ui/Button';

interface ProfileEditorProps {
  data: Personal;
  onChange: (data: Partial<Personal>) => void;
  accentColor?: string;
}

const SOCIAL_PLATFORMS = [
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { id: 'github', label: 'GitHub', icon: Github },
  { id: 'gitlab', label: 'GitLab', icon: Gitlab },
  { id: 'portfolio', label: 'Portafolio / Web', icon: Globe },
  { id: 'stackoverflow', label: 'StackOverflow', icon: Code2 },
  { id: 'twitter', label: 'Twitter / X', icon: Twitter },
  { id: 'youtube', label: 'YouTube', icon: Youtube },
  { id: 'medium', label: 'Medium / Blog', icon: BookOpen },
  { id: 'instagram', label: 'Instagram', icon: Instagram },
  { id: 'behance', label: 'Behance', icon: Palette },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { id: 'telegram', label: 'Telegram', icon: Send },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'phone', label: 'Teléfono', icon: Phone },
  { id: 'other', label: 'Otro', icon: LinkIcon }
];

export const ProfileEditor: React.FC<ProfileEditorProps> = ({ data, onChange, accentColor }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onChange({ [name]: value });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("La imagen es muy pesada. Por favor usa una imagen menor a 2MB.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        onChange({ foto: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    onChange({ foto: '' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Link Management
  const addLink = () => {
    const newLink: LinkObj = {
      id: `lnk-${Date.now()}`,
      label: 'LinkedIn',
      url: '',
      platform: 'linkedin'
    };
    onChange({ links: [...(data.links || []), newLink] });
  };

  const updateLink = (id: string, updates: Partial<LinkObj>) => {
    const newLinks = (data.links || []).map(link => 
      link.id === id ? { ...link, ...updates } : link
    );
    onChange({ links: newLinks });
  };

  const removeLink = (id: string) => {
    onChange({ links: (data.links || []).filter(l => l.id !== id) });
  };

  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-neutral-200 dark:border-gray-800 shadow-sm space-y-4">
      <SectionTitle icon={<User className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />}>Información Personal</SectionTitle>
      
      {/* Profile Image Uploader */}
      <div className="mb-6">
        <Label>Foto de Perfil</Label>
        <div className="flex items-center gap-4 mt-2">
          {data.foto ? (
            <div className="relative group">
               <img 
                src={data.foto} 
                alt="Profile Preview" 
                className="w-16 h-16 rounded-full object-cover border border-neutral-200 dark:border-gray-700"
               />
               <button 
                onClick={removeImage}
                className="absolute -top-1 -right-1 bg-white dark:bg-gray-800 border border-neutral-200 dark:border-gray-700 rounded-full p-1 text-neutral-500 hover:text-red-500 shadow-sm"
                title="Eliminar foto"
               >
                 <X className="w-3 h-3" />
               </button>
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-gray-800 flex items-center justify-center border border-neutral-200 dark:border-gray-700 border-dashed">
              <User className="w-6 h-6 text-neutral-400" />
            </div>
          )}
          
          <div className="flex-1">
            <input 
              type="file" 
              ref={fileInputRef}
              accept="image/*" 
              onChange={handleImageUpload}
              className="hidden" 
              id="photo-upload"
            />
            <label htmlFor="photo-upload">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-neutral-300 dark:border-gray-700 rounded-lg text-sm font-medium text-neutral-700 dark:text-gray-300 hover:bg-neutral-50 dark:hover:bg-gray-700 cursor-pointer transition-colors shadow-sm">
                <Upload className="w-4 h-4" />
                {data.foto ? 'Cambiar Foto' : 'Subir Foto'}
              </div>
            </label>
            <p className="text-xs text-neutral-400 mt-2">Recomendado: JPG/PNG, cuadrado, max 2MB.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label htmlFor="nombre">Nombre Completo</Label>
          <Input name="nombre" value={data.nombre} onChange={handleChange} placeholder="Facundo Guarnier" />
        </div>
        
        <div>
          <Label htmlFor="titulo">Título Profesional</Label>
          <Input name="titulo" value={data.titulo} onChange={handleChange} placeholder="Ingeniero en Informática" />
        </div>

        <div>
          <Label htmlFor="resumen">Perfil Profesional</Label>
          <TextArea name="resumen" value={data.resumen} onChange={handleChange} placeholder="Resumen de tu experiencia..." rows={6} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input name="email" value={data.email} onChange={handleChange} placeholder="email@example.com" />
          </div>
          <div>
            <Label htmlFor="telefono">Teléfono</Label>
            <Input name="telefono" value={data.telefono} onChange={handleChange} placeholder="+54 9..." />
          </div>
        </div>

        <div>
           <Label htmlFor="ubicacion">Ubicación</Label>
           <Input name="ubicacion" value={data.ubicacion} onChange={handleChange} placeholder="Mendoza, Argentina" />
        </div>

        {/* Dynamic Links Section */}
        <div className="pt-2 border-t border-neutral-100 dark:border-gray-800">
           <div className="flex items-center justify-between mb-2">
             <Label>Enlaces y Redes Sociales</Label>
             <Button variant="ghost" size="sm" onClick={addLink} className="h-6 px-2 text-neutral-500">
               <Plus className="w-3 h-3 mr-1" /> Agregar
             </Button>
           </div>
           
           <div className="space-y-3">
             {(data.links || []).map((link) => (
               <div key={link.id} className="flex gap-2 items-start bg-neutral-50 dark:bg-gray-800 p-2 rounded-lg border border-neutral-200 dark:border-gray-700">
                 <div className="flex-1 grid grid-cols-3 gap-2">
                   <div className="col-span-1">
                      <select 
                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-neutral-200 dark:border-gray-600 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent transition-all cursor-pointer"
                        value={link.platform || 'other'}
                        onChange={(e) => {
                          const selected = SOCIAL_PLATFORMS.find(p => p.id === e.target.value);
                          if (selected) {
                            updateLink(link.id, { 
                              platform: selected.id,
                              label: selected.label
                            });
                          }
                        }}
                      >
                        {SOCIAL_PLATFORMS.map(p => (
                          <option key={p.id} value={p.id}>{p.label}</option>
                        ))}
                      </select>
                   </div>
                   <div className="col-span-2">
                      <Input 
                        placeholder="URL (ej. linkedin.com/in/usuario)" 
                        value={link.url} 
                        onChange={(e) => updateLink(link.id, { url: e.target.value })}
                        className="bg-white dark:bg-gray-700"
                      />
                   </div>
                 </div>
                 <button 
                  onClick={() => removeLink(link.id)}
                  className="p-2 text-neutral-400 hover:text-red-500 rounded hover:bg-white dark:hover:bg-gray-700 transition-colors"
                 >
                   <Trash2 className="w-4 h-4" />
                 </button>
               </div>
             ))}
             {(data.links || []).length === 0 && (
                <div className="text-center p-3 border border-dashed border-neutral-200 dark:border-gray-700 rounded-lg text-xs text-neutral-400">
                   No hay enlaces añadidos
                </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};
