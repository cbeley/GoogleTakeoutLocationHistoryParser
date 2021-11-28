import { writeFile } from 'fs/promises';
import toKML from '@maphubs/tokml';
import xmlFormatter from 'xml-formatter';

export default async (
    geoJSON,
    { entriesPerFile, outputName, generateKML, prettyOutput, excludeGeoJSON }
) => {
    const writePromises = [];
    const totalPages = Math.ceil(geoJSON.features.length / entriesPerFile);
    const totalDigits = `${totalPages}`.length;

    const generateFileName = (pageNumber, ext) => {
        if (totalPages > 1) {
            return `${outputName}-${`${pageNumber}`.padStart(
                totalDigits,
                '0'
            )}.${ext}`;
        }
        return `${outputName}.${ext}`;
    };

    const formatXMLIfNeeded = (xml) => (prettyOutput ? xmlFormatter(xml) : xml);

    let currentFeatures = geoJSON.features;
    let currentPage = 1;
    do {
        const geoJSONToWrite = {
            ...geoJSON,
            features: currentFeatures.slice(0, entriesPerFile),
        };

        currentFeatures = currentFeatures.slice(entriesPerFile + 1);

        if (!excludeGeoJSON) {
            writePromises.push(
                writeFile(
                    generateFileName(currentPage, 'json'),
                    JSON.stringify(
                        geoJSONToWrite,
                        null,
                        prettyOutput ? 2 : undefined
                    )
                )
            );
        }

        if (generateKML) {
            writePromises.push(
                writeFile(
                    generateFileName(currentPage, 'kml'),
                    formatXMLIfNeeded(toKML(geoJSONToWrite))
                )
            );
        }

        ++currentPage;
    } while (entriesPerFile !== undefined && currentFeatures.length);

    try {
        await Promise.all(writePromises);
    } catch (ex) {
        // eslint-ignore-next-line no-console
        console.error(`Failed to write output files: ${ex.message}`);
        process.exit(1);
    }
};
