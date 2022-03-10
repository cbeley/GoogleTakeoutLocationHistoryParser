import { formatISO, parseISO } from 'date-fns';
const convertE7Coord = (coord) => coord / 1e7;

const googleWaypointsToGeoJSONCoords = (
    googleLocationObject,
    includeAllWaypoints
) => {
    if (
        !includeAllWaypoints ||
        !googleLocationObject.waypointPath ||
        !googleLocationObject.waypointPath.waypoints
    ) {
        return [];
    }

    const {
        waypointPath: { waypoints },
    } = googleLocationObject;

    return waypoints.map(({ latE7, lngE7 }) => {
        return [convertE7Coord(lngE7), convertE7Coord(latE7)];
    });
};

const createLineString = (coordinates, properties) => ({
    type: 'Feature',
    geometry: {
        type: 'LineString',
        coordinates,
    },
    properties: {
        name: 'line',
        ...properties,
    },
});

const metdataHandlers = {
    placeId({ location }) {
        if (location) {
            return location.placeId;
        }

        return undefined;
    },
    activityType({ activityType }) {
        return activityType;
    },
    address({ location }) {
        if (location) {
            return location.address;
        }

        return undefined;
    },
    durationInMS({ duration: { startTimestamp, startTimestampMs, endTimestamp, endTimestampMs } }) {
        return parseInt(endTimestampMs || parseISO(endTimestamp), 10) -
	    parseInt(startTimestampMs || parseISO(startTimestamp), 10);
    },
};

const extractMetadata = (locationObj, desiredMetadata) => {
    const metadata = {};

    desiredMetadata.forEach((key) => {
        metadata[key] = metdataHandlers[key](locationObj);
    });

    return metadata;
};

export default (
    takeoutLocationData,
    { includeAllWaypoints = false, includeTimestamps = false, metadata = [] }
) => {
    const stats = {
        placeCount: 0,
        activitySegmentCount: 0,
    };

    const geoJSON = {
        type: 'FeatureCollection',
        features: [],
    };

    takeoutLocationData.forEach(({ placeVisit, activitySegment }) => {
        if (placeVisit && activitySegment) {
            // eslint-disable-next-line no-console
            console.log(
                'WARNING: Object has both a placeVisit and an activitySegment. This is unexpected. Defaulting to placeVisit.'
            );
        }

        const properties = extractMetadata(
            placeVisit || activitySegment,
            metadata
        );

        if (includeTimestamps) {
            const {
                duration: { startTimestamp, startTimestampMs },
            } = placeVisit || activitySegment;

            properties.timestamp = formatISO(parseInt(startTimestampMs || parseISO(startTimestamp), 10));
        }

        if (placeVisit) {
            const {
                location: { latitudeE7, longitudeE7, name },
            } = placeVisit;

            geoJSON.features.push({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [
                        convertE7Coord(longitudeE7),
                        convertE7Coord(latitudeE7),
                    ],
                },
                properties: {
                    name,
                    ...properties,
                },
            });

            ++stats.placeCount;
        } else if (activitySegment) {
            const { startLocation, endLocation } = activitySegment;

            if (!(startLocation && endLocation)) {
                // eslint-disable-next-line no-console
                console.log(
                    'WARNING: activitySegement does not have both a startLocation and an endLocation.'
                );
                return;
            }

            geoJSON.features.push(
                createLineString(
                    [
                        [
                            convertE7Coord(startLocation.longitudeE7),
                            convertE7Coord(startLocation.latitudeE7),
                        ],
                        ...googleWaypointsToGeoJSONCoords(
                            activitySegment,
                            includeAllWaypoints
                        ),
                        [
                            convertE7Coord(endLocation.longitudeE7),
                            convertE7Coord(endLocation.latitudeE7),
                        ],
                    ],
                    properties
                )
            );

            ++stats.activitySegmentCount;
        } else {
            // eslint-disable-next-line no-console
            console.log(
                'WARNING: Unknown object found. Expected placeVisit or activitySegement. Ignoring...'
            );
        }
    });

    return { geoJSON, stats };
};
