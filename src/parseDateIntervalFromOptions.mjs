import { parseISO, isBefore } from 'date-fns';

export default ({ startDate, endDate }) => {
    const dateInterval = {};

    if (startDate) {
        dateInterval.start = parseISO(startDate);
    } else {
        dateInterval.start = new Date(0);
    }

    if (endDate) {
        dateInterval.end = parseISO(endDate);
    } else {
        dateInterval.end = new Date();
    }

    if (isBefore(dateInterval.end, dateInterval.start)) {
        throw new Error('Your start date must come after your end date.');
    }

    return dateInterval;
};
