/** Schedule frequencies the free plan can actually build: Hourly is disabled and Custom cron silently no-ops (see data/policies.ts). */
export type ScheduleFrequency = 'Daily' | 'Weekly' | 'Monthly';

export type TimeOfDay = {
  /** 1-12, as typed into the HH field. */
  hour: number;
  minute: number;
  meridiem: 'AM' | 'PM';
};

export type Weekday = {
  /** Suffix of the checkbox id (`repeatDaydate.short_day.WED`); the label next to it is two letters. */
  id: string;
  /** How the schedule rule spells the day out. */
  name: string;
};

type ScheduleBase = {
  /** Names the generated test. */
  label: string;
  time: TimeOfDay;
  retentionDays: number;
};

/** `interval` is the "Repeat every N" field; the rule text omits the clause when it is 1. */
export type DailySchedule = ScheduleBase & { frequency: 'Daily'; interval: number };
export type WeeklySchedule = ScheduleBase & { frequency: 'Weekly'; weekday: Weekday };
export type MonthlySchedule = ScheduleBase & {
  frequency: 'Monthly';
  dayOfMonth: number;
  interval: number;
};

export type ScheduleCase = DailySchedule | WeeklySchedule | MonthlySchedule;
