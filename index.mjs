import { Command, InvalidArgumentError } from 'commander';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import googleTakeoutToGeoJSON from './src/googleTakeoutToGeoJSON.mjs';
import extractDateRangeFromGoogleTakeout from './src/extractDateRangeFromGoogleTakeout.mjs';
import generateOutputFiles from './src/generateOutputFiles.mjs';
import parseDateIntervalFromOptions from './src/parseDateIntervalFromOptions.mjs';

const parseArgInt = (value) => {
    const parsedValue = parseInt(value, 10);

    if (Number.isNaN(parsedValue)) {
        throw new InvalidArgumentError('Not a number.');
    }

    return parsedValue;
};

const VALID_METADATA = new Set([
    'placeId',
    'activityType',
    'durationInMS',
    'address',
]);

const validateMetadata = (metadata) => {
    metadata.forEach((key) => {
        if (!VALID_METADATA.has(key)) {
            console.error(
                `${key} is not a valid metadata option. Must be one of ${[
                    ...VALID_METADATA.values(),
                ].join(', ')}.`
            );
            process.exit(1);
        }
    });

    return metadata;
};

const getVersion = () => {
    const currentFileDirName = dirname(fileURLToPath(import.meta.url));

    const { version } = JSON.parse(
        readFileSync(join(currentFileDirName, './package.json'), {
            encoding: 'utf-8',
        })
    );

    return version;
};

const program = new Command();

program
    .option(
        '-e, --entries-per-file <value>',
        `
    The max amount of entries allowed per each kml and or geojson
    file. If unset, all entries will be in a single file.
`,
        parseArgInt
    )
    .option('-k, --generate-KML', 'Generate kml')
    .option(
        '-eg, --exclude-geo-JSON',
        `
    If set, no geoJSON will be generated. By default, geoJSON
    is always generated otherwise.`
    )
    .option(
        '-p, --pretty-output',
        `
    If set, output will be more human readable.
    Applies to both JSON and KML.
    `
    )
    .option(
        '-sd, --start-date <ISODateString>',
        `
    Include entries after (inclusive) this date. If unset, you'll get
    results that go back as early as possible. If you do not specify a
    timezone offset, your computer's local timezone will be used.
    Partial ISO date strings are ok, but keep in mind if you leave
    out the time, the time will start at the very beginning of your date.

    ex:
        2021-01-01
        2021-01-01T14:30
`
    )
    .option(
        '-ed, --end-date <ISODateString>',
        `
    Include entries before (inclusive) this date. If unset, you'll get
    results that go up to the present local time. If you do not specify
    a timezone offset, your computer's local timezone will be used.
    Partial ISO date strings are ok, but keep in mind if you leave out
    the time, the time will start at the very beginning of your date.

    ex:
        2021-01-01
        2021-01-01T14:30
`
    )
    .option(
        '-s, --print-stats',
        `
    If set, some stats about what was parsed will be printed to the console.
`
    )
    .option(
        '-o, --output-name <name>',
        `
    The output name to use.
    Numbers and extensions will be appended automatically.
    Numbers will also be left padded with zeros as needed.

    Ex:
        "-o foo" may become:

        "foo.kml"
        "foo.json"

        Or if '-e' is set:

        "foo-001.kml"
        "foo-001.kml"
        "foo-999.json"
        "foo-999.json"
`,
        'out'
    )
    .option(
        '-a, --include-all-waypoints',
        `
    By default, only the beginning and end of activity segments
    are included. However, Google sometimes records waypoints
    between the beginning and end of an activity segment. By default
    these are not included, but can be added with this flag.

    The waypoints will be merged into LineString corresponding
    to the activity segment, so it will not increase the object
    count. However, you may not wantto turn this on if file size
    or processing is a concern. It'll also reveal more of your
    specific route, so it may not be desirable from a privacy
    stand-point as well.
`
    )
    .option(
        '-t, --include-timestamps',
        `
    Adds timestamps to each point and line in your output.
    The time at which you start moving or arrive at a point will
    be used.

    By default, this is disabled.

    If you need the ending time, you can add "duration" to 
    "--metadata".
`
    )
    .option(
        '-m, --metadata <metadata...>',
        `
    Allows you to include certain extra metadata that Google
    generates. In KML files, these values will be available under
    "ExtendedData" and in geoJSON files under "properties". 

    Available metadata:
     * placeId: The Google place ID. 
     * activityType: The type of activity associated with a line segment.
     * durationInMS: How long you were at a particular location/point
                     or how long you spent traversing a line
                     segment/doing an activity.
     * address: A textual representation of the full address of a location/point.

    The value of activityType will be: WALKING, STILL, IN_PASSENGER_VEHICLE, 
    CYCLING, IN_TRAIN, RUNNING, MOTORCYCLING, IN_BUS, IN_TRAM, IN_FERRY, IN_SUBWAY,
    SAILING, SKIING, FLYING, or IN_VEHICLE.

    Use '--' to signify the end of your list.  
    ex: "-m placeId address --"
`,
        []
    )
    .argument('<googleTakeoutDirectory>')
    .name('googleTakeoutLocationHistoryParser')
    .version(getVersion())
    .action(async (googleTakeoutDirectory, options) => {
        validateMetadata(options.metadata);

        if (options.excludeGeoJSON && !options.generateKML) {
            // eslint-ignore-next-line no-console
            console.log(
                '[WARNING] Did you really mean to both exclude geo JSON and not have KML? If so, that is what you are getting'
            );
        }

        let dateInterval;

        try {
            dateInterval = parseDateIntervalFromOptions(options);
        } catch (ex) {
            console.error(`Failed to parse your date interval: ${ex.message}`);
            process.exit(1);
        }

        const mergedTakeoutData = await extractDateRangeFromGoogleTakeout(
            googleTakeoutDirectory,
            dateInterval
        );

        const { geoJSON, stats } = googleTakeoutToGeoJSON(
            mergedTakeoutData,
            options
        );

        await generateOutputFiles(geoJSON, options);

        if (options.printStats) {
            const { placeCount, activitySegmentCount } = stats;

            // eslint-ignore-next-line no-console
            console.log(
                `${placeCount} places and ${activitySegmentCount} activity segments are in your final output.`
            );
        }
    });

program.parse(process.argv);
