import { formatISO } from 'date-fns';
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

export default (
    takeoutLocationData,
    { includeAllWaypoints = false, includeTimestamps = false }
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

        let timestamp;

        if (includeTimestamps) {
            const {
                duration: { startTimestampMs },
            } = placeVisit || activitySegment;
            timestamp = formatISO(parseInt(startTimestampMs, 10));
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
                    timestamp,
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
                    { timestamp }
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
