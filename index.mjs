import { Command } from 'commander';

import googleTakeoutToGeoJSON from './src/googleTakeoutToGeoJSON.mjs';
import extractDateRangeFromGoogleTakeout from './src/extractDateRangeFromGoogleTakeout.mjs';
import generateOutputFiles from './src/generateOutputFiles.mjs';

const program = new Command();

program
    .option(
        '-e, --entries-per-file <value>',
        'The max amount of entries allowed per each kml and or geojson file. If unset, all entries will be in a single file.'
    )
    .option('-k, --generate-KML', 'Generate kml')
    .option(
        '-eg, --exclude-geo-JSON',
        'If set, no geoJSON will be generated. By default, geoJSON is always generated otherwise.'
    )
    .option(
        '-p, --pretty-output',
        'If set, output will be more human readable. Applies to both JSON and KML.'
    )
    .option(
        '-s, --print-stats',
        'If set, some stats about what was parsed will be printed to the console.'
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
    .argument('<googleTakeoutLocationJSONFiles...>')
    .action(async (googleTakeoutLocationJSONFiles, options) => {
        if (options.excludeGeoJSON && !options.generateKML) {
            // eslint-ignore-next-line no-console
            console.log(
                '[WARNING] Did you really mean to both exclude geo JSON and not have KML? If so, that is what you are getting'
            );
        }

        const mergedTakeoutData = await extractDateRangeFromGoogleTakeout(
            googleTakeoutLocationJSONFiles
        );

        const { geoJSON, stats } = googleTakeoutToGeoJSON(mergedTakeoutData);

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
