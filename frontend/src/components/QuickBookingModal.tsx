import React from 'react';
import { AppointmentBookingWizard } from './appointments/AppointmentBookingWizard';

interface QuickBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialDate?: string;
  initialStaffId?: string;
}

export const QuickBookingModal: React.FC<QuickBookingModalProps> = (props) => {
  return <AppointmentBookingWizard {...props} />;
};
