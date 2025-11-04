import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Confirmation } from './types';
import { ReportView } from './components/ReportView';
import SignatureCanvas from 'react-signature-canvas';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Helper Icons
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);
const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
);
const ViewIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
);

const initialFormData: Omit<Confirmation, 'id' | 'confirmationDate' | 'reportCreator'> = {
  productCodeName: '',
  customerName: '',
  sampleSewingDate: '',
  productionDate: '',
  sampleEditDetails: '',
  originalForm: '',
  sampleImage: null,
  patternImage: null,
  agreedToTerms: false,
  signature: null,
};

// Mock Data for demonstration
const createMockData = (): Confirmation[] => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
     const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    return [
        {
            id: '1',
            productCodeName: 'AO-001',
            customerName: 'Khách Hàng A',
            sampleSewingDate: twoDaysAgo.toISOString().split('T')[0],
            productionDate: yesterday.toISOString().split('T')[0],
            sampleEditDetails: 'Tăng chiều dài tay áo 2cm.',
            originalForm: 'FORM-GOC-XYZ',
            sampleImage: null,
            patternImage: null,
            agreedToTerms: true,
            signature: null,
            confirmationDate: yesterday.toISOString().split('T')[0],
            reportCreator: 'Admin'
        },
        {
            id: '2',
            productCodeName: 'QUAN-002',
            customerName: 'Khách Hàng B',
            sampleSewingDate: yesterday.toISOString().split('T')[0],
            productionDate: today.toISOString().split('T')[0],
            sampleEditDetails: 'Sử dụng chỉ màu khác.',
            originalForm: 'Tạo Form Mới',
            sampleImage: null,
            patternImage: null,
            agreedToTerms: true,
            signature: null,
            confirmationDate: today.toISOString().split('T')[0],
            reportCreator: 'Admin'
        }
    ];
};

// Helper Components
const FormSection: React.FC<{title: string, children: React.ReactNode}> = ({ title, children }) => (
  <div className="bg-white p-6 rounded-lg shadow-md mb-6">
    <h2 className="text-xl font-bold text-gray-800 border-b pb-3 mb-4">{title}</h2>
    {children}
  </div>
);

const InputField: React.FC<{label: string, name: string, value: string, onChange: any, type?: string, required?: boolean}> = ({ label, name, value, onChange, type = 'text', required }) => (
  <div className="mb-4">
    <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}{required && <span className="text-red-500">*</span>}</label>
    <input type={type} id={name} name={name} value={value} onChange={onChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500" required={required} />
  </div>
);

const FileInputField: React.FC<{label: string, name: string, onChange: any}> = ({ label, name, onChange }) => (
   <div className="mb-4">
    <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input type="file" id={name} name={name} onChange={onChange} accept="image/*" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"/>
  </div>
);


const App: React.FC = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [formSelectionType, setFormSelectionType] = useState<'existing' | 'new'>('existing');
  const [confirmations, setConfirmations] = useState<Confirmation[]>([]);
  const [filteredConfirmations, setFilteredConfirmations] = useState<Confirmation[]>([]);
  const [searchCriteria, setSearchCriteria] = useState({ customer: '', productCode: '', startDate: '', endDate: '' });
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [reportToPrint, setReportToPrint] = useState<Confirmation | null>(null);

  const sigPad = useRef<SignatureCanvas>(null);
  const reportComponentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedConfirmations = localStorage.getItem('confirmations');
    if (savedConfirmations) {
      setConfirmations(JSON.parse(savedConfirmations));
    } else {
      // Load mock data if local storage is empty
      const mockData = createMockData();
      setConfirmations(mockData);
      localStorage.setItem('confirmations', JSON.stringify(mockData));
    }
  }, []);

  useEffect(() => {
    handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmations, searchCriteria]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newType = e.target.value as 'existing' | 'new';
    setFormSelectionType(newType);
    if (newType === 'new') {
        setFormData(prev => ({ ...prev, originalForm: 'Tạo Form Mới' }));
    } else {
        setFormData(prev => ({ ...prev, originalForm: '' }));
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'sampleImage' | 'patternImage') => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({ ...prev, [field]: event.target?.result as string }));
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };
  
  const clearSignature = () => {
    sigPad.current?.clear();
  };
  
  const handleSave = () => {
    if (!formData.customerName || !formData.productCodeName) {
      alert("Vui lòng điền Tên Khách Hàng và Tên Mã Hàng.");
      return;
    }
    if (formSelectionType === 'existing' && !formData.originalForm) {
      alert("Vui lòng nhập mã số form gốc.");
      return;
    }
    if (!formData.agreedToTerms) {
      alert("Khách hàng phải đồng ý với các điều khoản.");
      return;
    }
    const signatureData = sigPad.current?.isEmpty() ? null : sigPad.current?.toDataURL('image/png');
    if (!signatureData) {
        alert("Vui lòng cung cấp chữ ký.");
        return;
    }

    const newConfirmation: Confirmation = {
      ...formData,
      id: new Date().getTime().toString(),
      signature: signatureData,
      confirmationDate: new Date().toISOString().split('T')[0],
      reportCreator: 'Admin User', // Replace with actual user later
    };

    const updatedConfirmations = [...confirmations, newConfirmation];
    setConfirmations(updatedConfirmations);
    localStorage.setItem('confirmations', JSON.stringify(updatedConfirmations));

    alert('Lưu xác nhận thành công!');
    setFormData(initialFormData);
    setFormSelectionType('existing');
    sigPad.current?.clear();
  };

  const handleSearch = useCallback(() => {
    let result = [...confirmations];
    if (searchCriteria.customer) {
        result = result.filter(c => c.customerName.toLowerCase().includes(searchCriteria.customer.toLowerCase()));
    }
    if (searchCriteria.productCode) {
        result = result.filter(c => c.productCodeName.toLowerCase().includes(searchCriteria.productCode.toLowerCase()));
    }
    if (searchCriteria.startDate) {
        result = result.filter(c => new Date(c.productionDate) >= new Date(searchCriteria.startDate));
    }
    if (searchCriteria.endDate) {
        result = result.filter(c => new Date(c.productionDate) <= new Date(searchCriteria.endDate));
    }
    setFilteredConfirmations(result);
  }, [confirmations, searchCriteria]);

  const handleGeneratePdf = (confirmation: Confirmation) => {
    setIsGeneratingPdf(true);
    setReportToPrint(confirmation);
  };
  
  useEffect(() => {
    if (reportToPrint && reportComponentRef.current) {
      html2canvas(reportComponentRef.current, { scale: 2 }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        const width = pdfWidth;
        const height = width / ratio;

        let finalHeight = height > pdfHeight ? pdfHeight : height;

        pdf.addImage(imgData, 'PNG', 0, 0, width, finalHeight);
        pdf.save(`BaoCao_${reportToPrint.productCodeName}_${reportToPrint.customerName}.pdf`);
      }).finally(() => {
        setIsGeneratingPdf(false);
        setReportToPrint(null);
      });
    }
  }, [reportToPrint]);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      <header className="bg-primary-700 text-white shadow-lg">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-center">Bảng Xác Nhận Sản Xuất Với Khách Hàng</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FormSection title="Thông tin chung">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="Tên Mã Hàng" name="productCodeName" value={formData.productCodeName} onChange={handleInputChange} required/>
            <InputField label="Tên Khách Hàng" name="customerName" value={formData.customerName} onChange={handleInputChange} required/>
            <InputField label="Ngày May Mẫu" name="sampleSewingDate" value={formData.sampleSewingDate} onChange={handleInputChange} type="date"/>
            <InputField label="Ngày Sản Xuất (Duyệt Mẫu)" name="productionDate" value={formData.productionDate} onChange={handleInputChange} type="date" required/>
          </div>
        </FormSection>

        <FormSection title="Chi tiết mẫu">
            <div className="mb-4">
                <label htmlFor="sampleEditDetails" className="block text-sm font-medium text-gray-700 mb-1">Chi Tiết Chỉnh Sửa Mẫu</label>
                <textarea id="sampleEditDetails" name="sampleEditDetails" value={formData.sampleEditDetails} onChange={handleInputChange} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"></textarea>
            </div>
            <div className="mb-4">
                <p className="block text-sm font-medium text-gray-700 mb-2">Form Gốc</p>
                <div className="flex items-center space-x-4 mb-3">
                    <label className="flex items-center cursor-pointer">
                        <input 
                            type="radio" 
                            name="formType" 
                            value="existing" 
                            checked={formSelectionType === 'existing'} 
                            onChange={handleFormTypeChange} 
                            className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Sử dụng Form Gốc</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                        <input 
                            type="radio" 
                            name="formType" 
                            value="new" 
                            checked={formSelectionType === 'new'} 
                            onChange={handleFormTypeChange} 
                            className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Tạo Form Mới</span>
                    </label>
                </div>
                {formSelectionType === 'existing' && (
                    <div>
                        <label htmlFor="originalForm" className="block text-sm font-medium text-gray-700 mb-1">Mã số Form Gốc</label>
                        <input 
                            type="text" 
                            id="originalForm" 
                            name="originalForm" 
                            value={formData.originalForm} 
                            onChange={handleInputChange} 
                            placeholder="Nhập mã số form..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                        />
                    </div>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <FileInputField label="Hình Ảnh Mẫu" name="sampleImage" onChange={(e) => handleFileChange(e, 'sampleImage')} />
                  {formData.sampleImage && <img src={formData.sampleImage} alt="Mẫu" className="mt-2 h-32 w-auto rounded-md border"/>}
                </div>
                <div>
                  <FileInputField label="Hình Ảnh Rập" name="patternImage" onChange={(e) => handleFileChange(e, 'patternImage')} />
                  {formData.patternImage && <img src={formData.patternImage} alt="Rập" className="mt-2 h-32 w-auto rounded-md border"/>}
                </div>
            </div>
        </FormSection>

        <FormSection title="Ghi chú và xác nhận">
            <div className="mb-4 bg-gray-100 p-3 rounded-md border border-gray-200">
                <p className="text-sm font-medium text-gray-800">Ghi Chú Ràng Buộc Đã Thống Nhất:</p>
                <p className="text-sm text-gray-600 mt-1">"Khách hàng đã xem và duyệt mẫu. Mọi sai sót sau khi sản xuất hàng loạt dựa trên mẫu này, chúng tôi không chịu trách nhiệm."</p>
            </div>
             <div className="flex items-start mb-4">
                <input id="agreedToTerms" name="agreedToTerms" type="checkbox" checked={formData.agreedToTerms} onChange={handleCheckboxChange} className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 mt-1"/>
                <label htmlFor="agreedToTerms" className="ml-2 block text-sm text-gray-900">Đồng ý với các điều khoản <span className="text-red-500">*</span></label>
            </div>
            <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Chữ Ký Khách Hàng <span className="text-red-500">*</span></label>
                 <div className="border border-gray-300 rounded-md">
                    <SignatureCanvas ref={sigPad} penColor='black' canvasProps={{className: 'w-full h-32'}} />
                 </div>
                 <button onClick={clearSignature} className="mt-2 text-sm text-primary-600 hover:text-primary-800">Xóa chữ ký</button>
            </div>
        </FormSection>
        
        {/* REPORT MANAGER SECTION */}
        <FormSection title="Quản lý & Tìm Kiếm Báo Cáo">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 items-end">
                <InputField label="Theo Tên Khách Hàng" name="customer" value={searchCriteria.customer} onChange={(e) => setSearchCriteria(prev => ({...prev, customer: e.target.value}))}/>
                <InputField label="Theo Mã Hàng" name="productCode" value={searchCriteria.productCode} onChange={(e) => setSearchCriteria(prev => ({...prev, productCode: e.target.value}))}/>
                <div className="grid grid-cols-2 gap-2">
                    <InputField label="Từ Ngày" name="startDate" value={searchCriteria.startDate} onChange={(e) => setSearchCriteria(prev => ({...prev, startDate: e.target.value}))} type="date"/>
                    <InputField label="Đến Ngày" name="endDate" value={searchCriteria.endDate} onChange={(e) => setSearchCriteria(prev => ({...prev, endDate: e.target.value}))} type="date"/>
                </div>
                 <button onClick={handleSearch} className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 flex items-center justify-center gap-2 h-10 w-full sm:w-auto">
                    <SearchIcon/> Tìm Kiếm
                </button>
            </div>
            <div className="mt-6 overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên Mã Hàng</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên Khách Hàng</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày Duyệt Mẫu</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {filteredConfirmations.map(c => (
                            <tr key={c.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{c.productCodeName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{c.customerName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{c.productionDate}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                                    <button onClick={() => alert('Chi tiết: ' + c.productCodeName)} className="text-primary-600 hover:text-primary-800 inline-flex items-center gap-1 mr-4"><ViewIcon/> Xem Chi Tiết</button>
                                    <button onClick={() => handleGeneratePdf(c)} disabled={isGeneratingPdf} className="text-green-600 hover:text-green-800 inline-flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed">
                                        <DownloadIcon/> {isGeneratingPdf ? 'Đang tạo...' : 'Tải Báo Cáo (PDF)'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {filteredConfirmations.length === 0 && (
                    <p className="text-center text-gray-500 py-8">Không tìm thấy kết quả phù hợp.</p>
                )}
            </div>
        </FormSection>

      </main>

      <footer className="bg-white shadow-inner sticky bottom-0 border-t">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-end items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <button onClick={handleSave} className="w-full sm:w-auto bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 shadow-sm font-semibold">Lưu và Gửi</button>
            <button onClick={() => window.print()} className="w-full sm:w-auto bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300 font-semibold">In Bảng Xác Nhận</button>
            <button onClick={() => { setFormData(initialFormData); setFormSelectionType('existing'); sigPad.current?.clear();}} className="w-full sm:w-auto bg-red-500 text-white px-6 py-2 rounded-md hover:bg-red-600 font-semibold">Thoát</button>
        </div>
      </footer>
      
      {/* Hidden component for PDF generation */}
      {reportToPrint && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0, width: '210mm' }}>
            <ReportView ref={reportComponentRef} data={reportToPrint} />
        </div>
      )}
    </div>
  );
};

export default App;