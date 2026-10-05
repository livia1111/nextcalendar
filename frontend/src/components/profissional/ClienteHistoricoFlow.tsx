import { useState } from 'react';
import { type ClientMin } from '@/services/clientServices';
import { type TechnicalSheetEntry } from '@/services/technicalSheetServices';
import { type Appointment } from '@/services/appointmentServices';
import { ClientesAtendidosScreen } from '@/components/profissional/ClientesAtendidosScreen';
import { HistoricoClienteScreen } from '@/components/profissional/HistoricoClienteScreen';
import { AtendimentoDetalheScreen } from '@/components/profissional/AtendimentoDetalheScreen';
import { AtendimentoScreen } from '@/components/profissional/AtendimentoScreen';

interface ClienteHistoricoFlowProps {
  onBack: () => void;
}

export function ClienteHistoricoFlow({ onBack }: ClienteHistoricoFlowProps) {
  const [step, setStep] = useState<'CLIENTS' | 'HISTORY' | 'DETAIL' | 'EDIT_ATENDIMENTO'>('CLIENTS');
  const [selectedClient, setSelectedClient] = useState<ClientMin | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<TechnicalSheetEntry | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  if (step === 'EDIT_ATENDIMENTO' && editingAppointment) {
    return (
      <AtendimentoScreen
        appointment={editingAppointment}
        onBack={() => setStep('HISTORY')}
        onSaved={() => setStep('HISTORY')}
      />
    );
  }

  if (step === 'DETAIL' && selectedEntry && selectedClient) {
    return (
      <AtendimentoDetalheScreen
        entry={selectedEntry}
        clientId={selectedClient.id}
        clientName={selectedClient.name}
        onBack={() => setStep('HISTORY')}
        onEdit={(appt) => {
          setEditingAppointment(appt);
          setStep('EDIT_ATENDIMENTO');
        }}
      />
    );
  }

  if (step === 'HISTORY' && selectedClient) {
    return (
      <HistoricoClienteScreen
        clientId={selectedClient.id}
        clientName={selectedClient.name}
        onBack={() => setStep('CLIENTS')}
        onSelectEntry={(entry) => {
          setSelectedEntry(entry);
          setStep('DETAIL');
        }}
      />
    );
  }

  return (
    <ClientesAtendidosScreen
      onBack={onBack}
      onSelectClient={(client) => {
        setSelectedClient(client);
        setStep('HISTORY');
      }}
    />
  );
}
