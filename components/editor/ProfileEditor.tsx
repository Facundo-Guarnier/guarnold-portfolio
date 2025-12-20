
import React, { useRef } from 'react';
import { User, Upload, X, Plus, Trash2, Globe } from 'lucide-react';
import { Personal, LinkObj } from '../../types/cv';
import { Input, Label, TextArea, SectionTitle } from '../ui/Form';
import { Button } from '../ui/Button';

interface ProfileEditorProps {
  data: Personal;
  onChange: (data: Partial<Personal>) => void;
}

export const ProfileEditor: React.FC<ProfileEditorProps> = ({ data, onChange }) => {
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
      label: 'Portfolio',
      url: ''
    };
    onChange({ links: [...(data.links || []), newLink] });
  };

  const updateLink = (id: string, field: keyof LinkObj, value: string) => {
    const newLinks = data.links.map(link => 
      link.id === id ? { ...link, [field]: value } : link
    );
    onChange({ links: newLinks });
  };

  const removeLink = (id: string) => {
    onChange({ links: data.links.filter(l => l.id !== id) });
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm space-y-4">
      <SectionTitle icon={<User className="w-5 h-5 text-neutral-500" />}>Información Personal</SectionTitle>
      
      {/* Profile Image Uploader */}
      <div className="mb-6">
        <Label>Foto de Perfil</Label>
        <div className="flex items-center gap-4 mt-2">
          {data.foto ? (
            <div className="relative group">
               <img 
                src={data.foto} 
                alt="Profile Preview" 
                className="w-16 h-16 rounded-full object-cover border border-neutral-200"
               />
               <button 
                onClick={removeImage}
                className="absolute -top-1 -right-1 bg-white border border-neutral-200 rounded-full p-1 text-neutral-500 hover:text-red-500 shadow-sm"
                title="Eliminar foto"
               >
                 <X className="w-3 h-3" />
               </button>
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center border border-neutral-200 border-dashed">
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
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 cursor-pointer transition-colors shadow-sm">
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
        <div className="pt-2 border-t border-neutral-100">
           <div className="flex items-center justify-between mb-2">
             <Label>Enlaces y Redes</Label>
             <Button variant="ghost" size="sm" onClick={addLink} className="h-6 px-2 text-neutral-500">
               <Plus className="w-3 h-3 mr-1" /> Add
             </Button>
           </div>
           
           <div className="space-y-3">
             {(data.links || []).map((link) => (
               <div key={link.id} className="flex gap-2 items-start bg-neutral-50 p-2 rounded-lg border border-neutral-200">
                 <div className="flex-1 grid grid-cols-3 gap-2">
                   <div className="col-span-1">
                      <Input 
                        placeholder="Label (e.g. LinkedIn)" 
                        value={link.label} 
                        onChange={(e) => updateLink(link.id, 'label', e.target.value)}
                        className="bg-white"
                      />
                   </div>
                   <div className="col-span-2">
                      <Input 
                        placeholder="URL" 
                        value={link.url} 
                        onChange={(e) => updateLink(link.id, 'url', e.target.value)}
                        className="bg-white"
                      />
                   </div>
                 </div>
                 <button 
                  onClick={() => removeLink(link.id)}
                  className="p-2 text-neutral-400 hover:text-red-500 rounded hover:bg-white transition-colors"
                 >
                   <Trash2 className="w-4 h-4" />
                 </button>
               </div>
             ))}
             {(data.links || []).length === 0 && (
                <div className="text-center p-3 border border-dashed border-neutral-200 rounded-lg text-xs text-neutral-400">
                   No hay enlaces añadidos
                </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};
