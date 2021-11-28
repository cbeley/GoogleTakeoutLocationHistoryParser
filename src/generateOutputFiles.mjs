import { writeFile } from 'fs/promises';
import toKML from '@maphubs/tokml';

export default async (geoJSON) => {
    const writePromises = [];

    if (geoJSON.features.length > 2000) {
        const geoJSON2 = {
            ...geoJSON,
            features: geoJSON.features.slice(2001),
        };

        geoJSON.features = geoJSON.features.slice(0, 2000);

        writePromises.push(writeFile('./result2.kml', toKML(geoJSON2)));
        writePromises.push(
            await writeFile('./result2.json', JSON.stringify(geoJSON2, null, 2))
        );
    }

    writePromises.push(writeFile('./result.kml', toKML(geoJSON)));
    writePromises.push(
        writeFile('./result.json', JSON.stringify(geoJSON, null, 2))
    );

    await Promise.all(writePromises);
};
