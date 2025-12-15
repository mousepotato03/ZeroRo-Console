"use client";

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, RefreshCw } from 'lucide-react';

declare global {
  interface Window {
    kakao: {
      maps: {
        load: (callback: () => void) => void;
        Map: new (container: HTMLElement, options: {
          center: InstanceType<typeof window.kakao.maps.LatLng>;
          level: number;
        }) => KakaoMap;
        LatLng: new (lat: number, lng: number) => KakaoLatLng;
        Marker: new (options: {
          position: KakaoLatLng;
          map?: KakaoMap;
        }) => KakaoMarker;
        Circle: new (options: {
          center: KakaoLatLng;
          radius: number;
          strokeWeight: number;
          strokeColor: string;
          strokeOpacity: number;
          strokeStyle: string;
          fillColor: string;
          fillOpacity: number;
          map?: KakaoMap;
        }) => KakaoCircle;
        services: {
          Geocoder: new () => KakaoGeocoder;
          Status: {
            OK: string;
            ZERO_RESULT: string;
            ERROR: string;
          };
        };
      };
    };
  }
}

interface KakaoLatLng {
  getLat: () => number;
  getLng: () => number;
}

interface KakaoMap {
  setCenter: (latlng: KakaoLatLng) => void;
  setLevel: (level: number) => void;
  getCenter: () => KakaoLatLng;
}

interface KakaoMarker {
  setPosition: (latlng: KakaoLatLng) => void;
  setMap: (map: KakaoMap | null) => void;
}

interface KakaoCircle {
  setPosition: (latlng: KakaoLatLng) => void;
  setRadius: (radius: number) => void;
  setMap: (map: KakaoMap | null) => void;
}

interface KakaoGeocoder {
  addressSearch: (
    address: string,
    callback: (result: Array<{ x: string; y: string; address_name: string }>, status: string) => void
  ) => void;
}

interface KakaoMapProps {
  address?: string;
  lat?: number | null;
  lng?: number | null;
  radius?: number;
  onCoordinatesChange?: (lat: number, lng: number) => void;
  height?: string;
  className?: string;
}

export default function KakaoMap({
  address,
  lat,
  lng,
  radius = 100,
  onCoordinatesChange,
  height = '300px',
  className = ''
}: KakaoMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const markerRef = useRef<KakaoMarker | null>(null);
  const circleRef = useRef<KakaoCircle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scriptLoaded = useRef(false);

  // Kakao Maps SDK 로드
  useEffect(() => {
    if (scriptLoaded.current) return;

    const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY;
    if (!kakaoKey) {
      setError('Kakao API 키가 설정되지 않았습니다.');
      setIsLoading(false);
      return;
    }

    // 이미 로드되어 있는지 확인
    if (window.kakao?.maps) {
      scriptLoaded.current = true;
      initializeMap();
      return;
    }

    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoKey}&libraries=services&autoload=false`;
    script.async = true;
    script.onload = () => {
      scriptLoaded.current = true;
      window.kakao.maps.load(() => {
        initializeMap();
      });
    };
    script.onerror = () => {
      setError('지도 서비스를 불러오는데 실패했습니다.');
      setIsLoading(false);
    };
    document.head.appendChild(script);
  }, []);

  // 지도 초기화
  const initializeMap = () => {
    if (!mapContainerRef.current || !window.kakao?.maps) return;

    try {
      // 기본 위치: 서울 시청
      const defaultLat = lat || 37.5665;
      const defaultLng = lng || 126.9780;

      const options = {
        center: new window.kakao.maps.LatLng(defaultLat, defaultLng),
        level: 4
      };

      const map = new window.kakao.maps.Map(mapContainerRef.current, options);
      mapRef.current = map;

      // 마커 생성
      const marker = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(defaultLat, defaultLng),
        map: map
      });
      markerRef.current = marker;

      // 반경 원 생성
      const circle = new window.kakao.maps.Circle({
        center: new window.kakao.maps.LatLng(defaultLat, defaultLng),
        radius: radius,
        strokeWeight: 2,
        strokeColor: '#10b981',
        strokeOpacity: 0.8,
        strokeStyle: 'solid',
        fillColor: '#10b981',
        fillOpacity: 0.2,
        map: map
      });
      circleRef.current = circle;

      setIsLoading(false);

      // 주소가 있으면 해당 위치로 이동
      if (address) {
        searchAddressAndMove(address);
      } else if (lat && lng) {
        updateMapPosition(lat, lng);
      }
    } catch (err) {
      setError('지도 초기화에 실패했습니다.');
      setIsLoading(false);
    }
  };

  // 주소로 검색하여 지도 이동
  const searchAddressAndMove = (searchAddress: string) => {
    if (!window.kakao?.maps?.services) return;

    const geocoder = new window.kakao.maps.services.Geocoder();

    geocoder.addressSearch(searchAddress, (result, status) => {
      if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
        const coords = result[0];
        const newLat = parseFloat(coords.y);
        const newLng = parseFloat(coords.x);

        updateMapPosition(newLat, newLng);

        if (onCoordinatesChange) {
          onCoordinatesChange(newLat, newLng);
        }
      }
    });
  };

  // 지도 위치 업데이트
  const updateMapPosition = (newLat: number, newLng: number) => {
    if (!mapRef.current || !window.kakao?.maps) return;

    const newPosition = new window.kakao.maps.LatLng(newLat, newLng);

    mapRef.current.setCenter(newPosition);

    if (markerRef.current) {
      markerRef.current.setPosition(newPosition);
    }

    if (circleRef.current) {
      circleRef.current.setPosition(newPosition);
    }
  };

  // 주소 변경 시 지도 업데이트
  useEffect(() => {
    if (address && mapRef.current && !isLoading) {
      searchAddressAndMove(address);
    }
  }, [address, isLoading]);

  // 좌표 변경 시 지도 업데이트
  useEffect(() => {
    if (lat && lng && mapRef.current && !isLoading) {
      updateMapPosition(lat, lng);
    }
  }, [lat, lng, isLoading]);

  // 반경 변경 시 원 업데이트
  useEffect(() => {
    if (circleRef.current && !isLoading) {
      circleRef.current.setRadius(radius);
    }
  }, [radius, isLoading]);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-100 rounded-lg border border-slate-200 ${className}`}
        style={{ height }}
      >
        <div className="text-center text-slate-500">
          <MapPin className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative rounded-lg overflow-hidden border border-slate-200 ${className}`}>
      {isLoading && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-slate-100 z-10"
          style={{ height }}
        >
          <div className="text-center text-slate-500">
            <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" />
            <p className="text-sm">지도 불러오는 중...</p>
          </div>
        </div>
      )}
      <div
        ref={mapContainerRef}
        style={{ width: '100%', height }}
      />
      {!isLoading && lat && lng && (
        <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm text-xs text-slate-600">
          <span className="font-medium">좌표:</span> {lat.toFixed(6)}, {lng.toFixed(6)}
        </div>
      )}
    </div>
  );
}
