UPDATE sms_templates
SET body = 'iFixOrlando:
Thank you for booking your repair {customerName}. Your {deviceModel} repair is confirmed and scheduled for {appointmentDate} at {startTime}.

For your convenience, we will notify you with updates regarding your appointment via sms text messages. Thank you for choosing us, and we look forward to seeing you soon!

{signature}'
WHERE template_key = 'confirmation';

UPDATE sms_templates
SET body = 'iFixOrlando:
Hello {customerName}. Just a friendly reminder about your scheduled {deviceModel} repair appointment for today at {startTime}.

We''ll notify you as soon as your technician is en route.

{signature}'
WHERE template_key = 'reminder';

UPDATE sms_templates
SET body = 'iFixOrlando:
Good news {customerName}! {technicianName} is currently en route to your location for your scheduled iPhone repair appointment.

The estimated time of arrival (ETA) is {startTime}. You will receive a notification once your technician arrives at your location.

{signature}'
WHERE template_key = 'en-route';

UPDATE sms_templates
SET body = 'iFixOrlando:
{technicianName} has arrived to repair your device.

Thank you for your business and for choosing iFixOrlando!

{signature}'
WHERE template_key = 'arrival';

UPDATE sms_templates
SET body = 'iFixOrlando:
Good news {customerName}! {technicianName} is currently en route to your location for your scheduled iPhone repair appointment.

Please note the slight delay. The estimated time of arrival is between {startTime} and {endTime}. We apologize for the delay and look forward to seeing you shortly.

{signature}'
WHERE template_key = 'appointment-delay';

UPDATE sms_templates
SET body = 'iFixOrlando:
We''ve successfully rescheduled your {deviceModel} repair appointment to today at {startTime}.

If you have any further questions or need assistance, feel free to reach out. We look forward to seeing you at {startTime} for your repair.

{signature}'
WHERE template_key = 'reschedule-request';

UPDATE sms_templates
SET body = 'iFixOrlando:
Hello {customerName}. Per your request, your scheduled appointment has been canceled.

{signature}'
WHERE template_key = 'cancellation';

UPDATE sms_templates
SET body = 'iFixOrlando:
Hi {customerName}. We are calling regarding an appointment scheduled for an {deviceModel} repair. We are unable to reach you.

Please give us a call at your earliest opportunity. We look forward to hearing from you.

{signature}'
WHERE template_key = 'no-answer';
