import { useState } from 'react';
import type { SongSection } from '../../types';

interface StructureBuilderProps {
  sections: SongSection[];
  onChange: (sections: SongSection[]) => void;
}

const SECTION_TYPES: SongSection['type'][] = ['intro', 'verse', 'chorus', 'bridge', 'outro'];

const SECTION_COLORS: Record<SongSection['type'], string> = {
  intro: 'bg-purple-600',
  verse: 'bg-blue-600',
  chorus: 'bg-green-600',
  bridge: 'bg-yellow-600',
  outro: 'bg-red-600',
};

export function StructureBuilder({ sections, onChange }: StructureBuilderProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const addSection = (type: SongSection['type']) => {
    const newSection: SongSection = {
      id: crypto.randomUUID(),
      type,
      lines: [],
    };
    onChange([...sections, newSection]);
  };

  const removeSection = (id: string) => {
    onChange(sections.filter((s) => s.id !== id));
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newSections = [...sections];
    const [dragged] = newSections.splice(draggedIndex, 1);
    newSections.splice(index, 0, dragged);
    onChange(newSections);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-300">
        Song Structure
      </label>

      <div className="flex flex-wrap gap-2">
        {SECTION_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => addSection(type)}
            className={`px-3 py-1 rounded text-sm text-white ${SECTION_COLORS[type]} hover:opacity-80 transition-opacity`}
          >
            + {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {sections.length === 0 ? (
        <p className="text-gray-500 text-sm italic">
          Click buttons above to add sections to your song
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {sections.map((section, index) => (
            <div
              key={section.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-white cursor-move ${SECTION_COLORS[section.type]} ${
                draggedIndex === index ? 'opacity-50' : ''
              }`}
            >
              <span className="text-sm font-medium">
                {section.type.charAt(0).toUpperCase() + section.type.slice(1)}
              </span>
              <button
                onClick={() => removeSection(section.id)}
                className="text-white/70 hover:text-white"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {sections.length > 0 && (
        <p className="text-xs text-gray-500">
          Drag sections to reorder. Current structure: {sections.map(s => s.type.charAt(0).toUpperCase()).join(' → ')}
        </p>
      )}
    </div>
  );
}
