import { faker } from '@faker-js/faker';
import type { ScheduleCase, TimeOfDay, Weekday } from '../types/data/policy';

/** Checkbox id suffix paired with the day name the schedule rule spells out. */
const WEEKDAYS: Weekday[] = [
  { id: 'SUN', name: 'Sunday' },
  { id: 'MON', name: 'Monday' },
  { id: 'TUE', name: 'Tuesday' },
  { id: 'WED', name: 'Wednesday' },
  { id: 'THU', name: 'Thursday' },
  { id: 'FRI', name: 'Friday' },
  { id: 'SAT', name: 'Saturday' },
];

const randomTime = (): TimeOfDay => {
  const at = faker.date.anytime();
  return {
    hour: at.getHours() % 12 || 12,
    minute: at.getMinutes(),
    meridiem: at.getHours() < 12 ? 'AM' : 'PM',
  };
};

/** 30 is the cap the retention field itself carries on the free plan; a larger value silently disables "Add to schedule". */
const randomRetention = (): number => faker.number.int({ min: 1, max: 30 });

/** The Custom field takes a raw expression, so the same random time is restated in 24-hour form. */
const cronAt = (time: TimeOfDay): string =>
  `${time.minute} ${time.meridiem === 'PM' ? (time.hour % 12) + 12 : time.hour % 12} * * *`;

/**
 * One generated test per frequency, the way the storage catalog generates one per
 * target. Values are random on every run so the assertions cannot pass by matching
 * a hardcoded string; the expected rule below is built from the same values.
 * Intervals start at 1 on purpose — that is the branch where the app drops the
 * "every N" clause entirely.
 */
export const scheduleCases = (): ScheduleCase[] => {
  const customTime = randomTime();

  return [
    {
      label: 'daily',
      frequency: 'Daily',
      interval: faker.number.int({ min: 1, max: 7 }),
      time: randomTime(),
      retentionDays: randomRetention(),
    },
    {
      label: 'weekly',
      frequency: 'Weekly',
      weekday: faker.helpers.arrayElement(WEEKDAYS),
      time: randomTime(),
      retentionDays: randomRetention(),
    },
    {
      // Days past 28 do not exist in every month, so the form is fed a day every month has.
      label: 'monthly',
      frequency: 'Monthly',
      dayOfMonth: faker.number.int({ min: 1, max: 28 }),
      interval: faker.number.int({ min: 1, max: 6 }),
      time: randomTime(),
      retentionDays: randomRetention(),
    },
    {
      // The one frequency reachable only as a raw expression; the app validates nothing here and lets the backend refuse.
      label: 'custom cron',
      frequency: 'Custom',
      cron: cronAt(customTime),
      time: customTime,
      retentionDays: randomRetention(),
    },
  ];
};

const pad = (value: number): string => String(value).padStart(2, '0');

/** The rule spells the time back zero-padded ("At 09:05 AM") whatever was typed into HH/MM. */
export const formatTime = (time: TimeOfDay): string =>
  `${pad(time.hour)}:${pad(time.minute)} ${time.meridiem}`;

/** What the Schedules cell spells out for a case — measured against the live app, never derived from the payload. */
export const expectedRule = (schedule: ScheduleCase): string => {
  const at = `At ${formatTime(schedule.time)}`;

  switch (schedule.frequency) {
    case 'Daily':
      return schedule.interval > 1 ? `${at}, every ${schedule.interval} days` : at;
    case 'Weekly':
      return `${at}, only on ${schedule.weekday.name}`;
    case 'Monthly': {
      const onDay = `${at}, on day ${schedule.dayOfMonth} of the month`;
      return schedule.interval > 1 ? `${onDay}, every ${schedule.interval} months` : onDay;
    }
    case 'Custom':
      return at;
  }
};

export const expectedRetention = (schedule: ScheduleCase): string =>
  `${schedule.retentionDays} day(s)`;

/** The list labels every cron-built schedule "Hourly", whatever the expression actually says. */
export const expectedFrequency = (schedule: ScheduleCase): string =>
  schedule.frequency === 'Custom' ? 'Hourly' : schedule.frequency;
