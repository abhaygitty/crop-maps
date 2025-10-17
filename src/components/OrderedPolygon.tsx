import React from "react";
import MapView, { LatLng, Polygon } from "react-native-maps";

interface Props {
    boundaryPoints: LatLng[];
}

export const OrderedPolygon: React.FC<Props> = ({boundaryPoints}) => {
    if(!boundaryPoints || boundaryPoints.length < 3) return null;

    const centroid = {
        latitude: boundaryPoints.reduce((sum, p) => sum + p.latitude, 0) / boundaryPoints.length,
        longitude: boundaryPoints.reduce((sum, p) => sum + p.longitude, 0) / boundaryPoints.length,
    };

    const sortedPoints = [...boundaryPoints].sort((a, b) => {
        const angleA = Math.atan2(a.latitude - centroid.latitude, a.longitude - centroid.longitude);
        const angleB = Math.atan2(b.latitude - centroid.latitude, b.longitude - centroid.longitude);
        return angleA - angleB;
    });

    return (
        // <MapView style={{ flex: 1 }}>
            <Polygon
                coordinates={sortedPoints}
                strokeColor="rgba(0,0,255,0.8)"
                fillColor="rgba(0,0,255,0.3)"
                strokeWidth={2}
            />
        // </MapView>
    );
};

export default OrderedPolygon;