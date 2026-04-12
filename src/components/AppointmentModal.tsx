import React from 'react';
import AppointmentFormModal from './AppointmentFormModal';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AppointmentModal({ isOpen, onClose }: AppointmentModalProps) {
  return (
    <AppointmentFormModal 
      isOpen={isOpen} 
      onClose={onClose} 
    />
  );
}
