import React, { useEffect, useState } from 'react';
import { Input } from './Form';

interface ListaInputProps {
  value: string[];
  onChange: (lista: string[]) => void;
  placeholder?: string;
}

/** Una lista escrita separada por comas. Se confirma al salir del campo, así se puede tipear la coma. */
export const ListaInput: React.FC<ListaInputProps> = ({ value, onChange, placeholder }) => {
  const [texto, setTexto] = useState(value.join(', '));
  useEffect(() => setTexto(value.join(', ')), [value.join('|')]);

  const confirmar = () => {
    const lista = texto.split(',').map((t) => t.trim()).filter(Boolean);
    setTexto(lista.join(', '));
    if (lista.join('|') !== value.join('|')) onChange(lista);
  };

  return <Input value={texto} placeholder={placeholder} onChange={(e) => setTexto(e.target.value)} onBlur={confirmar} />;
};
