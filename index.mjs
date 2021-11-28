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
    .option('-k, --kml', 'Generate kml')
    .option(
        '-eg, --exclude-geo-json',
        'If set, no geoJSON will be generated. By default, geoJSON is always generated otherwise.'
    )
    .option(
        '-o, --output-name',
        `
    The output name to use. Numbers and extensions will be appended automatically.
    Ex:
        "-o foo" may become:

        "foo.kml"
        "foo.json"

        Or if '-e' is set:

        "foo-0.kml"
        "foo-1.kml"
        "foo-0.json"
        "foo-1".json"
`
    )
    .argument('<googleTakeoutLocationJSONFiles...>')
    .action(async (googleTakeoutLocationJSONFiles, options) => {
        const mergedTakeoutData = await extractDateRangeFromGoogleTakeout(
            googleTakeoutLocationJSONFiles
        );

        const { geoJSON, stats } = googleTakeoutToGeoJSON(mergedTakeoutData);

        await generateOutputFiles(geoJSON);
        console.log(stats);
    });

program.parse(process.argv);
