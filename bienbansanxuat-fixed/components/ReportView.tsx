
import React, { forwardRef } from 'react';
import type { Confirmation } from '../types';

interface ReportViewProps {
  data: Confirmation;
}

export const ReportView = forwardRef<HTMLDivElement, ReportViewProps>(({ data }, ref) => {
    const today = new Date().toLocaleDateString('vi-VN');

    const ReportSection: React.FC<{ title: string, children: React.ReactNode, className?: string }> = ({ title, children, className = '' }) => (
        <div className={`mt-5 p-1 ${className}`}>
            <h3 className="font-bold text-base bg-gray-200 px-2 py-1 mb-2">{title}</h3>
            {children}
        </div>
    );
    
    const InfoRow: React.FC<{ label: string, value: string | React.ReactNode | undefined}> = ({ label, value }) => (
        <div className="flex mb-1 text-sm">
            <p className="w-1/3 font-semibold">{label}:</p>
            <p className="w-2/3">{value || 'N/A'}</p>
        </div>
    );
    
    return (
        <div ref={ref} className="bg-white p-8 font-sans" style={{ width: '210mm', minHeight: '297mm', color: '#000' }}>
            <header className="text-center border-b-2 border-black pb-4">
                <h1 className="text-2xl font-bold">BÁO CÁO XÁC NHẬN SẢN XUẤT</h1>
                <div className="text-sm mt-2">
                    <p><span className="font-bold">Mã Hàng:</span> {data.productCodeName}</p>
                    <p><span className="font-bold">Khách Hàng:</span> {data.customerName}</p>
                    <p><span className="font-bold">Ngày Duyệt Mẫu:</span> {data.productionDate}</p>
                </div>
            </header>

            <main className="mt-5">
                <ReportSection title="THÔNG TIN CHUNG">
                    <InfoRow label="Tên Mã Hàng" value={data.productCodeName} />
                    <InfoRow label="Ngày May Mẫu" value={data.sampleSewingDate} />
                    <InfoRow label="Ngày Sản Xuất (Duyệt Mẫu)" value={data.productionDate} />
                </ReportSection>

                <ReportSection title="CHI TIẾT MẪU VÀ HÌNH ẢNH">
                     <div className="text-sm">
                        <p className="font-semibold mb-1">1. Chi Tiết Chỉnh Sửa Mẫu:</p>
                        <p className="pl-4 border-l-2 ml-2 mb-3">{data.sampleEditDetails || 'Không có chỉnh sửa.'}</p>
                        <p className="font-semibold mb-1">2. Form Gốc:</p>
                        <p className="pl-4 border-l-2 ml-2 mb-3">{data.originalForm}</p>
                        
                        <div className="grid grid-cols-2 gap-4 mt-3">
                           <div>
                                <p className="font-semibold mb-1">3. Hình Ảnh Mẫu:</p>
                                {data.sampleImage ? 
                                    <img src={data.sampleImage} alt="Hình ảnh mẫu" className="w-full border p-1" /> :
                                    <p className="text-gray-500">Không có hình ảnh</p>}
                           </div>
                           <div>
                               <p className="font-semibold mb-1">4. Hình Ảnh Rập:</p>
                                {data.patternImage ? 
                                    <img src={data.patternImage} alt="Hình ảnh rập" className="w-full border p-1" /> :
                                    <p className="text-gray-500">Không có hình ảnh</p>}
                           </div>
                        </div>
                    </div>
                </ReportSection>

                <ReportSection title="GHI CHÚ VÀ XÁC NHẬN CỦA KHÁCH HÀNG">
                    <div className="text-sm">
                         <p className="font-semibold mb-1">Ghi Chú Ràng Buộc Đã Thống Nhất:</p>
                         <p className="pl-4 border-l-2 ml-2 mb-3 italic">"Khách hàng đã xem và duyệt mẫu. Mọi sai sót sau khi sản xuất hàng loạt dựa trên mẫu này, chúng tôi không chịu trách nhiệm."</p>
                         <p className="font-semibold mb-1">Xác Nhận Của Khách Hàng:</p>
                         <div className="pl-4 border-l-2 ml-2">
                             <InfoRow label="Đồng ý với các điều khoản" value={data.agreedToTerms ? 'Có' : 'Không'} />
                             <InfoRow label="Ngày Xác Nhận" value={data.confirmationDate} />
                             <div className="flex mt-2">
                                <p className="w-1/3 font-semibold">Chữ Ký:</p>
                                <div className="w-2/3">
                                  {data.signature ? 
                                    <img src={data.signature} alt="Chữ ký" className="h-16 w-auto border" /> :
                                    <p className="text-gray-500">Không có chữ ký</p>}
                                </div>
                             </div>
                         </div>
                    </div>
                </ReportSection>
            </main>

            <footer className="text-xs text-gray-600 mt-8 pt-4 border-t">
                 <div className="flex justify-between">
                    <p>Ngày tạo báo cáo: {today}</p>
                    <p>Người tạo báo cáo: {data.reportCreator}</p>
                 </div>
            </footer>
        </div>
    );
});
