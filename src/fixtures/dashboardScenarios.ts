import { Appointment } from '../context/AppointmentContext';
import { ymd } from '../lib/datetime';

/**
 * Three dashboard scenarios for design/testing (spec deliverable):
 *   - empty:  no appointments today  → every card shows its empty state
 *   - normal: a balanced day, on time → timeline + KPIs populated, no late note
 *   - late:   over-booked / running behind → "fin estimée" shows "+X min de retard"
 *
 * All appointments are stamped for *today* so the dashboard (which filters on
 * today's date) renders them. Pass a doctor name to attribute them.
 */

export type Scenario = 'empty' | 'normal' | 'late';

function apt(p: Partial<Appointment> & Pick<Appointment, 'id' | 'patientName' | 'startTime' | 'endTime'>, doctor: string): Appointment {
  return {
    patientId: `PT-${p.id}`,
    doctor,
    date: ymd(),
    duration: 30,
    type: 'Consultation',
    status: 'Confirmed',
    ...p,
  } as Appointment;
}

export function scenarioAppointments(scenario: Scenario, doctor = 'Dr. Youssef'): Appointment[] {
  if (scenario === 'empty') return [];

  if (scenario === 'normal') {
    return [
      apt({ id: 'n1', patientName: 'Ahmed Mansour',   startTime: '09:00', endTime: '09:30', status: 'Completed', type: 'Consultation' }, doctor),
      apt({ id: 'n2', patientName: 'Sarah Ben Ammar',  startTime: '09:30', endTime: '10:00', status: 'Completed', type: 'Follow-up' }, doctor),
      apt({ id: 'n3', patientName: 'Youssef Trabelsi', startTime: '10:30', endTime: '11:00', status: 'Confirmed', type: 'Consultation' }, doctor),
      apt({ id: 'n4', patientName: 'Leila Haddad',     startTime: '11:30', endTime: '12:00', status: 'Confirmed', type: 'Follow-up' }, doctor),
      apt({ id: 'n5', patientName: 'Karim Bouazizi',   startTime: '14:00', endTime: '15:00', status: 'Confirmed', type: 'Surgery', duration: 60 }, doctor),
      apt({ id: 'n6', patientName: 'Nour Gharbi',      startTime: '15:30', endTime: '16:00', status: 'Pending',   type: 'Consultation' }, doctor),
    ];
  }

  // late: back-to-back long blocks with pending overflow — day runs past schedule
  return [
    apt({ id: 'l1', patientName: 'Ahmed Mansour',   startTime: '09:00', endTime: '10:00', status: 'Completed', type: 'Surgery', duration: 60 }, doctor),
    apt({ id: 'l2', patientName: 'Sarah Ben Ammar',  startTime: '10:00', endTime: '11:00', status: 'Confirmed', type: 'Surgery', duration: 60 }, doctor),
    apt({ id: 'l3', patientName: 'Youssef Trabelsi', startTime: '11:00', endTime: '12:00', status: 'Confirmed', type: 'Consultation', duration: 60 }, doctor),
    apt({ id: 'l4', patientName: 'Leila Haddad',     startTime: '14:00', endTime: '15:30', status: 'Confirmed', type: 'Surgery', duration: 90 }, doctor),
    apt({ id: 'l5', patientName: 'Karim Bouazizi',   startTime: '15:30', endTime: '17:00', status: 'Confirmed', type: 'Surgery', duration: 90 }, doctor),
    apt({ id: 'l6', patientName: 'Nour Gharbi',      startTime: '17:00', endTime: '18:00', status: 'Pending',   type: 'Consultation', duration: 60 }, doctor),
    apt({ id: 'l7', patientName: 'Emna Jaziri',      startTime: '18:00', endTime: '19:00', status: 'Pending',   type: 'Consultation', duration: 60 }, doctor),
    apt({ id: 'l8', patientName: 'Rania Sassi',      startTime: '19:00', endTime: '20:00', status: 'Pending',   type: 'Follow-up', duration: 60 }, doctor),
  ];
}
