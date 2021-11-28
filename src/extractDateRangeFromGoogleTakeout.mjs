import { readFile } from 'fs/promises';

export default async (googleTakeoutLocationJSONFiles) => {
    // TODO: right now this just grabs everything given.

    const takeoutDataPromises = googleTakeoutLocationJSONFiles.map(
        async (filename) => {
            return JSON.parse(await readFile(filename, { encoding: 'utf-8' }));
        }
    );

    return (await Promise.all(takeoutDataPromises))
        .map(({ timelineObjects }) => timelineObjects)
        .reduce((accum, timelineObjects) => {
            return [...accum, ...timelineObjects];
        }, []);
};
