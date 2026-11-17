"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type Point = { lat: number; lng: number };

const cali = { lat: 3.3417, lng: -76.5306 };

export default function Map({
  destination,
  rider,
  onPick,
}: {
  destination?: Point | null;
  rider?: Point | null;
  onPick?: (p: Point) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const destMarker = useRef<L.CircleMarker | null>(null);
  const zone = useRef<L.Circle | null>(null);
  const riderMarker = useRef<L.CircleMarker | null>(null);
  const pick = useRef(onPick);
  pick.current = onPick;

  useEffect(() => {
    if (!box.current || map.current) return;
    const start = destination || rider || cali;
    const m = L.map(box.current).setView([start.lat, start.lng], 17);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
    }).addTo(m);
    m.on("click", (e: L.LeafletMouseEvent) => {
      if (pick.current) pick.current({ lat: e.latlng.lat, lng: e.latlng.lng });
    });
    map.current = m;

    return () => {
      m.remove();
      map.current = null;
      destMarker.current = null;
      zone.current = null;
      riderMarker.current = null;
    };
  }, []);

  useEffect(() => {
    const m = map.current;
    if (!m || !destination) return;
    const spot: L.LatLngExpression = [destination.lat, destination.lng];
    if (!destMarker.current) {
      zone.current = L.circle(spot, { radius: 10, color: "#f48fb1", weight: 1 }).addTo(m);
      destMarker.current = L.circleMarker(spot, {
        radius: 9,
        color: "#e91e63",
        fillColor: "#ffffff",
        fillOpacity: 1,
        weight: 4,
      })
        .bindTooltip("entrega")
        .addTo(m);
    } else {
      destMarker.current.setLatLng(spot);
      zone.current?.setLatLng(spot);
    }
  }, [destination?.lat, destination?.lng]);

  useEffect(() => {
    const m = map.current;
    if (!m || !rider) return;
    const spot: L.LatLngExpression = [rider.lat, rider.lng];
    if (!riderMarker.current) {
      riderMarker.current = L.circleMarker(spot, {
        radius: 8,
        color: "#880e4f",
        fillColor: "#c62828",
        fillOpacity: 1,
        weight: 2,
      })
        .bindTooltip("repartidor")
        .addTo(m);
    } else {
      riderMarker.current.setLatLng(spot);
    }
    if (!m.getBounds().contains(spot)) m.panTo(spot);
  }, [rider?.lat, rider?.lng]);

  return <div ref={box} className="map" />;
}
