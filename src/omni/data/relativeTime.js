// The prototype's email data was written with fixed dates (Feb 2–4). Every date moves by whole days, keeping its time of
// day, so the newest email lands on the latest day it has already happened (today, or yesterday if its time hasn't come
// yet): everything falls within the past week of whenever the page is opened.

const MINUTE = 60 * 1000;
const WRITTEN_YEAR = 2026; // the year the fixed dates were written for

/** A written date ('Feb 4, 02:45 PM') as it was written. */
const writtenAt = (text) => {
  const [day, clock] = text.split(', ');
  return new Date(`${day}, ${WRITTEN_YEAR} ${clock}`).getTime();
};

const NEWEST_WRITTEN = writtenAt('Feb 4, 05:10 PM'); // the newest email in the data
const DAY = 24 * 60 * MINUTE;
const SHIFT = (() => {
  const today = new Date();
  const newest = new Date(NEWEST_WRITTEN);
  // The newest email's time of day, on today's date
  const landed = new Date(today.getFullYear(), today.getMonth(), today.getDate(), newest.getHours(), newest.getMinutes());
  if (landed.getTime() > Date.now()) landed.setDate(landed.getDate() - 1);
  return Math.round((landed.getTime() - NEWEST_WRITTEN) / DAY) * DAY;
})();

/** 'Nov 9, 02:45 PM', the format the cards show. */
export const formatTime = (ms) => {
  const d = new Date(ms);
  const day = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const clock = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return `${day}, ${clock}`;
};

/** A written date moved into the past week. */
export const recent = (text) => formatTime(writtenAt(text) + SHIFT);

/**
 * A shown date ('Nov 9, 02:45 PM', no year) as a timestamp. Dates carry no year, so it's this year, unless that would
 * be more than a day in the future (a December date seen in January), then last year.
 */
export const parseTime = (text) => {
  const [day, clock] = String(text).split(', ');
  const year = new Date().getFullYear();
  const t = new Date(`${day}, ${year} ${clock}`).getTime();
  if (Number.isNaN(t)) return 0;
  return t > Date.now() + DAY ? new Date(`${day}, ${year - 1} ${clock}`).getTime() : t;
};
