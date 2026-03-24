'use client';

// Wrapper con tabs per la dashboard dipendente
import { useState } from 'react';
import { Calendar as CalendarIcon, CalendarRange } from 'lucide-react';
import { PresenzePersonali } from './PresenzePersonali';
import { CalendarioFerieView } from '@/components/shared/CalendarioFerieView';
import type { RuoloUtente } from '@/types/database.types';

type Tab = 'presenze' | 'calendario-ferie';

interface DipendenteDashboardTabsProps {
  userId: string;
  ruolo: RuoloUtente;
}

export function DipendenteDashboardTabs({ userId, ruolo }: DipendenteDashboardTabsProps) {
  // Collaboratori vedono solo calendario ferie
  const isCollaboratore = ruolo === 'collaboratore';
  const [activeTab, setActiveTab] = useState<Tab>(isCollaboratore ? 'calendario-ferie' : 'presenze');

  const allTabs = [
    { id: 'presenze' as Tab, label: 'Le Mie Presenze', icon: CalendarIcon },
    { id: 'calendario-ferie' as Tab, label: 'Calendario Ferie', icon: CalendarRange },
  ];

  // Filtra le tabs in base al ruolo
  const tabs = isCollaboratore
    ? allTabs.filter(tab => tab.id === 'calendario-ferie')
    : allTabs;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm whitespace-nowrap
                  ${
                    isActive
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'presenze' && <PresenzePersonali userId={userId} />}
        {activeTab === 'calendario-ferie' && <CalendarioFerieView userId={userId} isAdmin={false} />}
      </div>
    </div>
  );
}
