import type { TFunction } from 'i18next';

import type { BookingStatus } from '@/constants/mockBookings';
import type { MockSupportTicketStatus } from '@/constants/mockData';

export const HUPI_STATUS_BLUE = '#0096FF';

export type StatusPresentation = {
  backgroundColor: string;
  borderColor: string;
  label: string;
  textColor: string;
};

const bookingStatusKeys: Record<BookingStatus, string> = {
  'Solicitud creada': 'bookings.status.created',
  'Solicitud de coordinación': 'bookings.status.coordinationRequested',
  'Oferta enviada': 'bookings.status.offerSent',
  'Pendiente de pago': 'bookings.status.pendingPayment',
  Confirmada: 'bookings.status.confirmed',
  Programada: 'bookings.status.scheduled',
  Próxima: 'bookings.status.upcoming',
  'En curso': 'bookings.status.inProgress',
  Finalizada: 'bookings.status.completed',
  Completada: 'bookings.status.completed',
  Cancelada: 'bookings.status.cancelled',
};

const supportStatusKeys: Record<MockSupportTicketStatus, string> = {
  Abierto: 'supportCaseStatus.open',
  'En revisión': 'supportCaseStatus.underReview',
  'Esperando respuesta': 'supportCaseStatus.waitingResponse',
  Resuelto: 'supportCaseStatus.resolved',
  Cerrado: 'supportCaseStatus.closed',
};

export function getBookingStatusPresentation(
  status: BookingStatus,
  isDark: boolean,
  t: TFunction,
): StatusPresentation {
  const label = t(bookingStatusKeys[status] as never);

  if (status === 'Confirmada') {
    return {
      backgroundColor: isDark ? '#173C2A' : '#E7F5EF',
      borderColor: isDark ? '#4DBB86' : '#32966F',
      label,
      textColor: isDark ? '#86E0B8' : '#237A58',
    };
  }

  if (status === 'Completada' || status === 'Finalizada') {
    return {
      backgroundColor: isDark ? '#36343A' : '#F0EFED',
      borderColor: isDark ? '#77727D' : '#C9C5C1',
      label,
      textColor: isDark ? '#D6D2DA' : '#716D69',
    };
  }

  if (status === 'Cancelada') {
    return {
      backgroundColor: isDark ? '#4A252A' : '#FBEAEA',
      borderColor: isDark ? '#FF8D8D' : '#C94B4B',
      label,
      textColor: isDark ? '#FFAAAA' : '#B43838',
    };
  }

  if (status === 'En curso') {
    return {
      backgroundColor: isDark ? '#0A2E45' : '#E6F5FF',
      borderColor: HUPI_STATUS_BLUE,
      label,
      textColor: HUPI_STATUS_BLUE,
    };
  }

  return {
    backgroundColor: isDark ? '#3B304A' : '#FFF0EC',
    borderColor: isDark ? '#D2B7F5' : '#E45336',
    label,
    textColor: isDark ? '#F0DFFF' : '#B6412A',
  };
}

export function getSupportCaseStatusPresentation(
  status: MockSupportTicketStatus,
  isDark: boolean,
  t: TFunction,
): StatusPresentation {
  const label = t(supportStatusKeys[status] as never);

  if (status === 'En revisión') {
    return {
      backgroundColor: isDark ? '#0A2E45' : '#E6F5FF',
      borderColor: HUPI_STATUS_BLUE,
      label,
      textColor: HUPI_STATUS_BLUE,
    };
  }

  if (status === 'Abierto') {
    return {
      backgroundColor: isDark ? '#173C2A' : '#E7F5EF',
      borderColor: isDark ? '#4DBB86' : '#32966F',
      label,
      textColor: isDark ? '#86E0B8' : '#237A58',
    };
  }

  if (status === 'Cerrado' || status === 'Resuelto') {
    return {
      backgroundColor: isDark ? '#36343A' : '#F0EFED',
      borderColor: isDark ? '#77727D' : '#C9C5C1',
      label,
      textColor: isDark ? '#D6D2DA' : '#716D69',
    };
  }

  return {
    backgroundColor: isDark ? '#3B304A' : '#F0EBF7',
    borderColor: isDark ? '#D2B7F5' : '#614193',
    label,
    textColor: isDark ? '#E0C9FF' : '#614193',
  };
}
