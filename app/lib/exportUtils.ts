import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

// ArrayBuffer를 Base64로 변환하는 헬퍼 함수
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// 한글 폰트 로드 및 등록 함수
// NotoSansKR-Regular.ttf 파일을 public/fonts/ 폴더에 추가해야 합니다.
// 다운로드: https://fonts.google.com/noto/specimen/Noto+Sans+KR
// 반환값: 폰트 로드 성공 여부 (true: 성공, false: 실패)
async function loadKoreanFont(doc: jsPDF): Promise<boolean> {
  try {
    // 폰트 파일을 fetch로 가져오기
    const fontResponse = await fetch('/fonts/NotoSansKR-Regular.ttf');
    
    // 404/403 등 에러 체크 (가장 중요!)
    if (!fontResponse.ok) {
      console.error(
        `한글 폰트 파일 로드 실패: ${fontResponse.status} ${fontResponse.statusText}\n` +
        `폰트 파일이 /fonts/NotoSansKR-Regular.ttf 경로에 존재하는지 확인하세요.\n` +
        `브라우저에서 http://localhost:3000/fonts/NotoSansKR-Regular.ttf 접속 시 200 OK가 나와야 합니다.`
      );
      return false;
    }
    
    const fontArrayBuffer = await fontResponse.arrayBuffer();
    
    // 빈 파일 체크
    if (fontArrayBuffer.byteLength === 0) {
      console.error('한글 폰트 파일이 비어있습니다.');
      return false;
    }
    
    const fontBase64 = arrayBufferToBase64(fontArrayBuffer);
    
    // VFS에 폰트 파일 추가 (임베딩을 위해 필수)
    doc.addFileToVFS('NotoSansKR-Regular.ttf', fontBase64);
    
    // 폰트 등록
    doc.addFont('NotoSansKR-Regular.ttf', 'NotoSansKR', 'normal');
    
    console.log('한글 폰트 로드 및 등록 완료');
    return true;
  } catch (error) {
    console.error('한글 폰트 로드 중 오류 발생:', error);
    return false;
  }
}

interface DashboardOverview {
  totalParticipants: number;
  completedMissions: number;
  missionCompletionRate: number;
  co2Reduction: number;
  monthlyGrowth: number;
  weeklyNewParticipants: number;
  topCampaign: {
    title: string;
    participants: number;
    completed: number;
    completionRate: number;
  } | null;
  weeklyTrend: Array<{
    date: string;
    participants: number;
  }>;
  categoryDistribution: Array<{
    category: string;
    participants: number;
  }>;
  topCategory: string | null;
  topRegion: string | null;
  campaignCompletionRate: number;
}

// CSV Export
export const exportToCSV = (data: DashboardOverview) => {
  const timestamp = new Date().toISOString().split('T')[0];

  // Create CSV content
  let csv = 'Dashboard Report\n\n';
  csv += '=== 주요 지표 ===\n';
  csv += `총 참여자,${data.totalParticipants}\n`;
  csv += `완료된 미션,${data.completedMissions}\n`;
  csv += `미션 완료율,${data.missionCompletionRate}%\n`;
  csv += `CO2 절감량,${data.co2Reduction}kg\n`;
  csv += `월간 성장률,${data.monthlyGrowth}%\n`;
  csv += `이번 주 신규 참여자,${data.weeklyNewParticipants}\n`;
  csv += `캠페인 완료율,${data.campaignCompletionRate}%\n\n`;

  if (data.topCampaign) {
    csv += '=== 최고 성과 캠페인 ===\n';
    csv += `제목,${data.topCampaign.title}\n`;
    csv += `참여자 수,${data.topCampaign.participants}\n`;
    csv += `완료된 미션,${data.topCampaign.completed}\n`;
    csv += `완료율,${data.topCampaign.completionRate}%\n\n`;
  }

  csv += '=== 카테고리별 참여자 분포 ===\n';
  csv += '카테고리,참여자 수\n';
  data.categoryDistribution.forEach(item => {
    csv += `${item.category},${item.participants}\n`;
  });
  csv += '\n';

  csv += '=== 주간 참여자 추이 ===\n';
  csv += '날짜,참여자 수\n';
  data.weeklyTrend.forEach(item => {
    csv += `${item.date},${item.participants}\n`;
  });

  // Download
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `dashboard_report_${timestamp}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};

// PDF Export
export const exportToPDF = async (data: DashboardOverview) => {
  const timestamp = new Date().toISOString().split('T')[0];
  const doc = new jsPDF();

  // 1) 폰트 파일이 실제로 로드되어야 함 (가장 중요)
  // 2) 텍스트 찍기 전에 폰트 등록이 끝나야 함 (await 필수)
  const fontLoaded = await loadKoreanFont(doc);
  
  // 폰트가 로드되었는지 확인 후 설정
  let fontName = 'helvetica'; // 기본 폰트
  if (fontLoaded) {
    try {
      doc.setFont('NotoSansKR', 'normal');
      fontName = 'NotoSansKR';
    } catch (e) {
      console.warn('한글 폰트 설정 실패:', e);
    }
  } else {
    console.warn('⚠️ 한글 폰트가 로드되지 않았습니다. PDF에서 한글이 깨질 수 있습니다.');
  }

  // Title (폰트 설정 후 텍스트 출력)
  doc.setFont(fontName, 'normal');
  doc.setFontSize(20);
  doc.text('환경 영향 보고서', 105, 20, { align: 'center' });
  doc.setFontSize(10);
  doc.text(`생성일: ${new Date().toLocaleString('ko-KR')}`, 105, 28, { align: 'center' });

  let yPos = 40;

  // Main KPIs
  doc.setFont(fontName, 'normal');
  doc.setFontSize(16);
  doc.text('주요 지표', 20, yPos);
  yPos += 10;

  const kpiData = [
    ['총 참여자', data.totalParticipants.toLocaleString()],
    ['완료된 미션', data.completedMissions.toLocaleString()],
    ['미션 완료율', `${data.missionCompletionRate}%`],
    ['CO2 절감량', `${data.co2Reduction}kg`],
    ['월간 성장률', `${data.monthlyGrowth}%`],
    ['이번 주 신규 참여자', data.weeklyNewParticipants.toString()],
    ['캠페인 완료율', `${data.campaignCompletionRate}%`]
  ];

  // 3) autoTable에도 폰트를 지정해야 함 (styles, headStyles, bodyStyles 모두)
  // 페이지 너비에서 margin을 뺀 후 반반으로 나눔 (595.28 - 40) / 2 = 277.64
  const tableWidth = doc.internal.pageSize.width - 40; // margin left + right
  const columnWidth = tableWidth / 2;
  autoTable(doc, {
    startY: yPos,
    head: [['항목', '값']],
    body: kpiData,
    theme: 'grid',
    headStyles: { 
      fillColor: [16, 185, 129],
      font: fontName,
      fontStyle: 'normal'
    },
    bodyStyles: {
      font: fontName,
      fontStyle: 'normal'
    },
    styles: {
      font: fontName,
      fontStyle: 'normal'
    },
    columnStyles: {
      0: { cellWidth: columnWidth },
      1: { cellWidth: columnWidth }
    },
    margin: { left: 20, right: 20 }
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Top Campaign
  if (data.topCampaign) {
    doc.setFont(fontName, 'normal');
    doc.setFontSize(16);
    doc.text('최고 성과 캠페인', 20, yPos);
    yPos += 10;

    const campaignData = [
      ['제목', data.topCampaign.title],
      ['참여자 수', data.topCampaign.participants.toString()],
      ['완료된 미션', data.topCampaign.completed.toString()],
      ['완료율', `${data.topCampaign.completionRate}%`]
    ];

    const tableWidth2 = doc.internal.pageSize.width - 40;
    const columnWidth2 = tableWidth2 / 2;
    autoTable(doc, {
      startY: yPos,
      head: [['속성', '값']],
      body: campaignData,
      theme: 'grid',
      headStyles: { 
        fillColor: [16, 185, 129],
        font: fontName,
        fontStyle: 'normal'
      },
      bodyStyles: {
        font: fontName,
        fontStyle: 'normal'
      },
      styles: {
        font: fontName,
        fontStyle: 'normal'
      },
      columnStyles: {
        0: { cellWidth: columnWidth2 },
        1: { cellWidth: columnWidth2 }
      },
      margin: { left: 20, right: 20 }
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Category Distribution
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFont(fontName, 'normal');
  doc.setFontSize(16);
  doc.text('카테고리별 참여자 분포', 20, yPos);
  yPos += 10;

  const categoryData = data.categoryDistribution.map(item => [
    item.category,
    item.participants.toString()
  ]);

  const tableWidth3 = doc.internal.pageSize.width - 40;
  const columnWidth3 = tableWidth3 / 2;
  autoTable(doc, {
    startY: yPos,
    head: [['카테고리', '참여자 수']],
    body: categoryData,
    theme: 'grid',
    headStyles: { 
      fillColor: [16, 185, 129],
      font: fontName,
      fontStyle: 'normal'
    },
    bodyStyles: {
      font: fontName,
      fontStyle: 'normal'
    },
    styles: {
      font: fontName,
      fontStyle: 'normal'
    },
    columnStyles: {
      0: { cellWidth: columnWidth3 },
      1: { cellWidth: columnWidth3 }
    },
    margin: { left: 20, right: 20 }
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Weekly Trend - 항상 다음 페이지에서 시작
  doc.addPage();
  yPos = 20;

  doc.setFont(fontName, 'normal');
  doc.setFontSize(16);
  
  // 날짜 범위 계산
  let dateRangeText = '주간 참여자 추이';
  if (data.weeklyTrend && data.weeklyTrend.length > 0) {
    const firstDate = data.weeklyTrend[0].date;
    const lastDate = data.weeklyTrend[data.weeklyTrend.length - 1].date;
    dateRangeText = `주간 참여자 추이 (${firstDate} ~ ${lastDate})`;
  }
  
  doc.text(dateRangeText, 20, yPos);
  yPos += 10;

  const trendData = data.weeklyTrend.map(item => [
    item.date,
    item.participants.toString()
  ]);

  const tableWidth4 = doc.internal.pageSize.width - 40;
  const columnWidth4 = tableWidth4 / 2;
  autoTable(doc, {
    startY: yPos,
    head: [['날짜', '참여자 수']],
    body: trendData,
    theme: 'grid',
    headStyles: { 
      fillColor: [16, 185, 129],
      font: fontName,
      fontStyle: 'normal'
    },
    bodyStyles: {
      font: fontName,
      fontStyle: 'normal'
    },
    styles: {
      font: fontName,
      fontStyle: 'normal'
    },
    columnStyles: {
      0: { cellWidth: columnWidth4 },
      1: { cellWidth: columnWidth4 }
    },
    margin: { left: 20, right: 20 }
  });

  // Save
  doc.save(`dashboard_report_${timestamp}.pdf`);
};

// DOCX Export (PDF와 동일한 내용)
export const exportToDOCX = async (data: DashboardOverview) => {
  const timestamp = new Date().toISOString().split('T')[0];
  
  // 제목
  const title = new Paragraph({
    text: '환경 영향 보고서',
    heading: HeadingLevel.TITLE,
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
  });

  const dateParagraph = new Paragraph({
    text: `생성일: ${new Date().toLocaleString('ko-KR')}`,
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
  });

  // 주요 지표 섹션
  const kpiHeading = new Paragraph({
    text: '주요 지표',
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 200, after: 200 },
  });

  const kpiTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
            new TableCell({
              children: [new Paragraph({ text: '항목', alignment: AlignmentType.CENTER })],
              shading: { fill: '#10B981' },
              width: { size: 50, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: [new Paragraph({ text: '값', alignment: AlignmentType.CENTER })],
              shading: { fill: '#10B981' },
              width: { size: 50, type: WidthType.PERCENTAGE },
            }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph('총 참여자')],
            width: { size: 50, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [new Paragraph(data.totalParticipants.toLocaleString())],
            width: { size: 50, type: WidthType.PERCENTAGE },
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph('완료된 미션')],
            width: { size: 50, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [new Paragraph(data.completedMissions.toLocaleString())],
            width: { size: 50, type: WidthType.PERCENTAGE },
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph('미션 완료율')],
            width: { size: 50, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [new Paragraph(`${data.missionCompletionRate}%`)],
            width: { size: 50, type: WidthType.PERCENTAGE },
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph('CO2 절감량')],
            width: { size: 50, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [new Paragraph(`${data.co2Reduction}kg`)],
            width: { size: 50, type: WidthType.PERCENTAGE },
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph('월간 성장률')],
            width: { size: 50, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [new Paragraph(`${data.monthlyGrowth}%`)],
            width: { size: 50, type: WidthType.PERCENTAGE },
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph('이번 주 신규 참여자')],
            width: { size: 50, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [new Paragraph(data.weeklyNewParticipants.toString())],
            width: { size: 50, type: WidthType.PERCENTAGE },
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph('캠페인 완료율')],
            width: { size: 50, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [new Paragraph(`${data.campaignCompletionRate}%`)],
            width: { size: 50, type: WidthType.PERCENTAGE },
          }),
        ],
      }),
    ],
  });

  const sections: (Paragraph | Table)[] = [title, dateParagraph, kpiHeading, kpiTable];

  // 최고 성과 캠페인 섹션
  if (data.topCampaign) {
    const campaignHeading = new Paragraph({
      text: '최고 성과 캠페인',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    });

    const campaignTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ text: '속성', alignment: AlignmentType.CENTER })],
              shading: { fill: '#10B981' },
              width: { size: 50, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: [new Paragraph({ text: '값', alignment: AlignmentType.CENTER })],
              shading: { fill: '#10B981' },
              width: { size: 50, type: WidthType.PERCENTAGE },
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph('제목')],
              width: { size: 50, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: [new Paragraph(data.topCampaign.title)],
              width: { size: 50, type: WidthType.PERCENTAGE },
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph('참여자 수')],
              width: { size: 50, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: [new Paragraph(data.topCampaign.participants.toString())],
              width: { size: 50, type: WidthType.PERCENTAGE },
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph('완료된 미션')],
              width: { size: 50, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: [new Paragraph(data.topCampaign.completed.toString())],
              width: { size: 50, type: WidthType.PERCENTAGE },
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph('완료율')],
              width: { size: 50, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: [new Paragraph(`${data.topCampaign.completionRate}%`)],
              width: { size: 50, type: WidthType.PERCENTAGE },
            }),
          ],
        }),
      ],
    });

    sections.push(campaignHeading, campaignTable);
  }

  // 카테고리별 참여자 분포 섹션
  const categoryHeading = new Paragraph({
    text: '카테고리별 참여자 분포',
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
  });

  const categoryTableRows = [
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ text: '카테고리', alignment: AlignmentType.CENTER })],
          shading: { fill: '#10B981' },
          width: { size: 50, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph({ text: '참여자 수', alignment: AlignmentType.CENTER })],
          shading: { fill: '#10B981' },
          width: { size: 50, type: WidthType.PERCENTAGE },
        }),
      ],
    }),
    ...data.categoryDistribution.map(
      (item) =>
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph(item.category)],
              width: { size: 50, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: [new Paragraph(item.participants.toString())],
              width: { size: 50, type: WidthType.PERCENTAGE },
            }),
          ],
        })
    ),
  ];

  const categoryTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: categoryTableRows,
  });

  sections.push(categoryHeading, categoryTable);

  // 주간 참여자 추이 섹션
  let dateRangeText = '주간 참여자 추이';
  if (data.weeklyTrend && data.weeklyTrend.length > 0) {
    const firstDate = data.weeklyTrend[0].date;
    const lastDate = data.weeklyTrend[data.weeklyTrend.length - 1].date;
    dateRangeText = `주간 참여자 추이 (${firstDate} ~ ${lastDate})`;
  }

  const trendHeading = new Paragraph({
    text: dateRangeText,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
  });

  const trendTableRows = [
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ text: '날짜', alignment: AlignmentType.CENTER })],
          shading: { fill: '#10B981' },
          width: { size: 50, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph({ text: '참여자 수', alignment: AlignmentType.CENTER })],
          shading: { fill: '#10B981' },
          width: { size: 50, type: WidthType.PERCENTAGE },
        }),
      ],
    }),
    ...data.weeklyTrend.map(
      (item) =>
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph(item.date)],
              width: { size: 50, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: [new Paragraph(item.participants.toString())],
              width: { size: 50, type: WidthType.PERCENTAGE },
            }),
          ],
        })
    ),
  ];

  const trendTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: trendTableRows,
  });

  sections.push(trendHeading, trendTable);

  // 문서 생성
  const doc = new Document({
    sections: [
      {
        children: sections,
      },
    ],
  });

  // 파일 다운로드
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `dashboard_report_${timestamp}.docx`);
};
