import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { isWithinInterval } from 'date-fns';

const getYearFoldersToParse = async (
    { start: startDate, end: endDate },
    locationHistoryDir
) => {
    // I am assuming (though I am not positive) that the year folders
    // in the takeout folder are based on UTC times.
    const yearStart = startDate.getUTCFullYear();
    const yearEnd = endDate.getUTCFullYear();

    let locationHistoryDirEnts;

    try {
        locationHistoryDirEnts = await readdir(locationHistoryDir, {
            withFileTypes: true,
        });
    } catch (ex) {
        // eslint-ignore-next-line no-console
        console.error(
            `Something went wrong reading your google takeout directory: ${ex.message}`
        );

        process.exit(1);
    }

    return locationHistoryDirEnts
        .filter((file) => file.isDirectory())
        .map(({ name }) => parseInt(name, 10))
        .filter((year) => year >= yearStart && year <= yearEnd);
};

const GOOGLE_MONTHS = [
    'JANUARY',
    'FEBRUARY',
    'MARCH',
    'APRIL',
    'MAY',
    'JUNE',
    'JULY',
    'AUGUST',
    'SEPTEMBER',
    'OCTOBER',
    'NOVEMBER',
    'DECEMBER',
];

// Assumes year is already within startDate and endDate. Also assumes
// that the month files are UTC-based.
const monthsInDateRangeForYear = ({ start: startDate, end: endDate }, year) => {
    const months = [];

    let startMonth;
    let endMonth;

    if (startDate.getUTCFullYear() < year) {
        startMonth = 0;
    } else {
        startMonth = startDate.getUTCMonth();
    }

    if (endDate.getUTCFullYear() > year) {
        endMonth = 11;
    } else {
        endMonth = endDate.getUTCMonth();
    }

    for (let i = startMonth; i <= endMonth; ++i) {
        months.push(GOOGLE_MONTHS[i]);
    }

    return months;
};

export default async (googleTakeoutDirectory, dateInterval) => {
    const locationHistoryDir = join(
        googleTakeoutDirectory,
        'Location History/Semantic Location History/'
    );

    const yearFoldersToParse = await getYearFoldersToParse(
        dateInterval,
        locationHistoryDir
    );

    const takeoutLocationDataPromises = yearFoldersToParse.reduce(
        (promises, year) => {
            const monthsToParse = monthsInDateRangeForYear(dateInterval, year);

            return promises.concat(
                monthsToParse.map(async (month) => {
                    try {
                        return JSON.parse(
                            await readFile(
                                join(
                                    locationHistoryDir,
                                    `${year}`,
                                    `${year}_${month}.json`
                                )
                            )
                        );
                    } catch (ex) {
                        // Since I'm lazy, we just check for all possible months instead of calculating
                        // what months should exist based on the present files. This is arguably better since
                        // there are race conditions with the former anyway. This means ENOENT exceptions are expected
                        // and fine.
                        if (ex.code !== 'ENOENT') {
                            throw ex;
                        }
                    }

                    return { timelineObjects: [] };
                })
            );
        },
        []
    );

    return (await Promise.all(takeoutLocationDataPromises))
        .map(({ timelineObjects }) => timelineObjects)
        .reduce((accum, timelineObjects) => {
            return [...accum, ...timelineObjects];
        }, [])
        .filter(({ placeVisit, activitySegment }) => {
            if (!(placeVisit || activitySegment)) {
                // eslint-disable-next-line no-console
                console.log(
                    "[WARNING] Object found that does not have a placeVisit or activitySegement. This may be a bug or something new on Google's end. Please file an issue"
                );

                return false;
            }

	    // Google Takeout previously used {start,end}TimestampMs for these keys, but now uses {start,end}Timestamp, so we
	    // parse both.
            const {
                duration: { startTimestamp, startTimestampMs, endTimestamp, endTimestampMs },
            } = placeVisit || activitySegment;

            // Interesting decision by google to represent the timestamp as a string. I'm sure this
            // has to do with concerns of the int overflowing during parsing in some languages/environments.
            const visitStart = new Date(parseInt(startTimestampMs || Date.parse(startTimestamp), 10));
            const visitEnd = new Date(parseInt(endTimestampMs || Date.parse(endTimestamp), 10));

            return (
                isWithinInterval(visitStart, dateInterval) &&
                isWithinInterval(visitEnd, dateInterval)
            );
        });
};
