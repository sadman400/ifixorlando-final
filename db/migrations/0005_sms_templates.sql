CREATE TABLE IF NOT EXISTS sms_templates (
  id TEXT PRIMARY KEY,
  template_key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  body TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO sms_templates (id, template_key, label, body, sort_order)
VALUES
  (
    'sms-confirmation',
    'confirmation',
    'Confirmation',
    'iFixOrlando: Thank you for booking your repair {customerName}. Your {deviceModel} repair is confirmed and scheduled for {appointmentDate} at {startTime}. For your convenience, we will notify you with updates regarding your appointment via sms text messages. Thank you for choosing us, and we look forward to seeing you soon! {signature}',
    0
  ),
  (
    'sms-reminder',
    'reminder',
    'Reminder',
    'iFixOrlando: Hello {customerName}. Just a friendly reminder about your scheduled {deviceModel} repair appointment for today at {startTime}. We''ll notify you as soon as your technician is en route. {signature}',
    1
  ),
  (
    'sms-en-route',
    'en-route',
    'En Route',
    'iFixOrlando: Good news {customerName}! {technicianName}, is currently en route to your location for your scheduled iPhone repair appointment. The estimated time of arrival (ETA) is {startTime}. You will receive a notification once your technician arrives at your location. {signature}',
    2
  ),
  (
    'sms-arrival',
    'arrival',
    'Arrival',
    'iFixOrlando: {technicianName} has arrived to repair your device. Thank you for your business and for choosing iFixOrlando! www.iFixOrlando.com',
    3
  ),
  (
    'sms-appointment-delay',
    'appointment-delay',
    'Appointment Delay',
    'iFixOrlando: Good news {customerName}! {technicianName}, is currently en route to your location for your scheduled iPhone repair appointment. Please note the slight delay. The estimated time of arrival is between {startTime} and {endTime}. We apologize for the delay and look forward to seeing you shortly. {signature}',
    4
  ),
  (
    'sms-reschedule-request',
    'reschedule-request',
    'Reschedule Request',
    'iFixOrlando: We''ve successfully rescheduled your {deviceModel} repair appointment to today at {startTime}. If you have any further questions or need assistance, feel free to reach out. We look forward to seeing you at {startTime} for your repair. {signature}',
    5
  ),
  (
    'sms-cancellation',
    'cancellation',
    'Cancellation',
    'iFixOrlando: Hello {customerName}. Per your request, your scheduled appointment has been canceled. {signature}',
    6
  ),
  (
    'sms-no-answer',
    'no-answer',
    'No Answer',
    'iFixOrlando:
Hi {customerName}. We are calling regarding an appointment scheduled for an {deviceModel} repair. We are unable to reach you. Please give us a call at your earliest opportunity. We look forward to hearing from you.

{signature}',
    7
  );
