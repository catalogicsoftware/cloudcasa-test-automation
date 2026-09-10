/** Hourly is the one frequency the free plan disables outright; Custom reaches the same rules through a raw cron. */
export type ScheduleFrequency = 'Daily' | 'Weekly' | 'Monthly' | 'Custom';

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

/** `time` is what the expression encodes, kept alongside it so the rule text stays derivable. */
export type CustomSchedule = ScheduleBase & { frequency: 'Custom'; cron: string };

export type ScheduleCase = DailySchedule | WeeklySchedule | MonthlySchedule | CustomSchedule;
