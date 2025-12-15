"use client";

import React, { useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { Button } from './UiKit';

declare global {
  interface Window {
    daum: {
      Postcode: new (config: {
        oncomplete: (data: DaumPostcodeResult) => void;
        onclose?: () => void;
        width?: string;
        height?: string;
      }) => {
        embed: (container: HTMLElement) => void;
        open: () => void;
      };
    };
  }
}

interface DaumPostcodeResult {
  address: string;           // 기본 주소
  addressType: string;       // R(도로명), J(지번)
  roadAddress: string;       // 도로명 주소
  jibunAddress: string;      // 지번 주소
  zonecode: string;          // 우편번호
  buildingName: string;      // 건물명
  apartment: string;         // 아파트 여부 (Y/N)
  sido: string;              // 시/도
  sigungu: string;           // 시/군/구
  bname: string;             // 법정동/법정리
  bname1: string;            // 법정동/법정리 첫번째 부분
  bname2: string;            // 법정동/법정리 두번째 부분
}

interface AddressSearchProps {
  onAddressSelect: (address: string, roadAddress: string, jibunAddress: string) => void;
  buttonText?: string;
  className?: string;
}

export default function AddressSearch({
  onAddressSelect,
  buttonText = '주소 검색',
  className = ''
}: AddressSearchProps) {
  const scriptLoaded = useRef(false);

  useEffect(() => {
    // 이미 스크립트가 로드되어 있으면 스킵
    if (scriptLoaded.current || window.daum?.Postcode) {
      scriptLoaded.current = true;
      return;
    }

    const script = document.createElement('script');
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
    script.async = true;
    script.onload = () => {
      scriptLoaded.current = true;
    };
    document.head.appendChild(script);

    return () => {
      // 컴포넌트 언마운트 시 스크립트 제거하지 않음 (재사용을 위해)
    };
  }, []);

  const handleClick = () => {
    if (!window.daum?.Postcode) {
      alert('주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    new window.daum.Postcode({
      oncomplete: (data: DaumPostcodeResult) => {
        // 도로명 주소와 지번 주소 중 선택
        const address = data.roadAddress || data.jibunAddress;
        onAddressSelect(address, data.roadAddress, data.jibunAddress);
      },
    }).open();
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleClick}
      className={className}
    >
      <Search className="w-4 h-4 mr-2" />
      {buttonText}
    </Button>
  );
}
