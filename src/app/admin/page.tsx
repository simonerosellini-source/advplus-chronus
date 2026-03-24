'use client';

// Dashboard Amministratore - Pagina principale con tab navigation
import { useState } from 'react';
import { Users, Calendar as CalendarIcon, CalendarDays, BarChart3, CalendarRange } from 'lucide-react';
import { PresenzeView } from '@/components/admin/PresenzeView';
import { GestioneUtentiView } from '@/components/admin/GestioneUtentiView';
import { GestioneFestiviView } from '@/components/admin/GestioneFestiviView';
import { ReportView } from '@/components/admin/ReportView';
import { CalendarioFerieView } from '@/components/shared/CalendarioFerieView';

type Tab = 'presenze' | 'utenti' | 'festivi' | 'calendario-ferie' | 'report';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('presenze');

  const tabs = [
    { id: 'presenze' as Tab, label: 'Presenze', icon: CalendarIcon },
    { id: 'utenti' as Tab, label: 'Gestione Utenti', icon: Users },
    { id: 'festivi' as Tab, label: 'Calendario Festività', icon: CalendarDays },
    { id: 'calendario-ferie' as Tab, label: 'Calendario Ferie', icon: CalendarRange },
    { id: 'report' as Tab, label: 'Report e Statistiche', icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      {/* Header con titolo */}
      <div>
        <h1 className="text-3xl font-bold text-primary">Dashboard Amministratore</h1>
        <p className="text-gray-600 mt-2">Gestione completa presenze e utenti</p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px overflow-x-auto">
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
          {activeTab === 'presenze' && <PresenzeView />}
          {activeTab === 'utenti' && <GestioneUtentiView />}
          {activeTab === 'festivi' && <GestioneFestiviView />}
          {activeTab === 'calendario-ferie' && <CalendarioFerieView isAdmin={true} />}
          {activeTab === 'report' && <ReportView />}
        </div>
      </div>
    </div>
  );
}
