import React, { useState, useEffect } from 'react';
import { Filter, Search, User, X, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { doctorApi } from '../../services/api';

const TreatmentHistoryView: React.FC = () => {
  // Data States
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [doctorId, setDoctorId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [treatedByMe, setTreatedByMe] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await doctorApi.getPatientsHistory();
        if (res.success) {
          setHistoryData(res.data);
          setDoctorId(res.doctorId);
        }
      } catch (error) {
        console.error("Failed to load patient history", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  // Reset to page 1 whenever filters or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, treatedByMe, statusFilter]);

  const filteredHistory = historyData.filter(record => {
    // Apply "Treated by me" filter -> Patient is associated ONLY with the logged-in doctor
    if (treatedByMe && (record.doctors.length > 1 || !record.doctors.some((doc: any) => doc.id === doctorId))) {
      return false;
    }
    
    // Apply status filter
    if (statusFilter !== 'All' && record.status !== statusFilter) {
      return false;
    }
    
    // Apply search filter
    const query = searchQuery.toLowerCase();
    return (
      record.patientName.toLowerCase().includes(query) ||
      record.patientId.toLowerCase().includes(query) ||
      record.diagnosis.toLowerCase().includes(query) ||
      record.department.some((dep: string) => dep.toLowerCase().includes(query)) ||
      record.doctors.some((doc: any) => doc.name.toLowerCase().includes(query) || doc.id.toLowerCase().includes(query))
    );
  });

  // Calculate Pagination
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentRecords = filteredHistory.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Treatment History</h2>
          <p className="text-slate-500">Global patient treatment history</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm relative">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4 rounded-t-2xl relative z-20">
          
          <div className="flex items-center gap-3 w-full md:w-auto relative">
            {/* Filter Option */}
            <div>
              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-semibold shadow-sm transition-all text-sm"
              >
                <Filter className="w-4 h-4" />
                Filter {statusFilter !== 'All' && <span className="bg-blue-100 text-blue-700 px-1.5 rounded text-xs">{statusFilter}</span>}
              </button>
              
              {isFilterOpen && (
                <div className="absolute top-full mt-2 left-0 md:right-auto bg-white border border-slate-200 rounded-xl shadow-lg p-4 z-50 w-48 animate-in fade-in zoom-in-95">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Status</p>
                  <div className="space-y-2">
                    {['All', 'Ongoing', 'Resolved', 'Referred', 'Follow up required'].map(status => (
                      <label key={status} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg transition-colors">
                        <input 
                          type="radio" 
                          name="statusFilter" 
                          value={status} 
                          checked={statusFilter === status}
                          onChange={() => { setStatusFilter(status); setIsFilterOpen(false); }}
                          className="text-blue-600 focus:ring-blue-500" 
                        />
                        {status}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Search Field */}
            <div className="relative flex-1 md:w-64 w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search patient, ID, or doctor..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm" 
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
              onClick={() => setTreatedByMe(!treatedByMe)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold shadow-sm transition-all text-sm border ${
                treatedByMe 
                  ? 'bg-blue-50 text-blue-700 border-blue-200' 
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <User className="w-4 h-4" />
              Treated By Me Only
              {treatedByMe && (
                <X 
                  className="w-4 h-4 ml-1 hover:text-blue-900" 
                  onClick={(e) => { e.stopPropagation(); setTreatedByMe(false); }} 
                />
              )}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-semibold text-slate-700">S.No</th>
                <th className="px-6 py-3 font-semibold text-slate-700">Patient</th>
                <th className="px-6 py-3 font-semibold text-slate-700">Department</th>
                <th className="px-6 py-3 font-semibold text-slate-700">Primary Diagnosis</th>
                <th className="px-6 py-3 font-semibold text-slate-700">Status</th>
                <th className="px-6 py-3 font-semibold text-slate-700">Treating Doctor(s)</th>
                <th className="px-6 py-3 font-semibold text-slate-700">Last Visited</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    Loading patient records...
                  </td>
                </tr>
              ) : currentRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 rounded-b-2xl">
                    {searchQuery || treatedByMe || statusFilter !== 'All' ? "No matching patients found for the selected filters." : "No treatment history available."}
                  </td>
                </tr>
              ) : currentRecords.map((record, idx) => (
                <tr 
                  key={record.id} 
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  onClick={() => setSelectedRecord(record)}
                >
                  <td className="px-6 py-4 text-slate-500">{startIndex + idx + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {record.avatar ? (
                        <img src={record.avatar} alt={record.patientName} className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs border border-blue-200">
                          {record.patientName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-slate-900">{record.patientName}</p>
                        <p className="text-xs text-slate-500 font-mono">{record.patientId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 max-w-[150px] truncate" title={record.department.join(', ')}>
                    {record.department.join(', ')}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-800 max-w-[200px] truncate" title={record.diagnosis}>
                    {record.diagnosis}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold border ${
                      record.status === 'Resolved' ? 'bg-green-50 text-green-700 border-green-200' :
                      record.status === 'Ongoing' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      record.status === 'Referred' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                      record.status === 'Follow up required' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                      'bg-slate-50 text-slate-700 border-slate-200'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex -space-x-2 overflow-hidden" title={record.doctors.map((d: any) => d.name).join(', ')}>
                      {record.doctors.map((doc: any, i: number) => (
                        doc.avatar ? (
                          <img key={i} src={doc.avatar} alt={doc.name} className={`inline-block h-8 w-8 rounded-full ring-2 object-cover ${doc.id === doctorId ? 'ring-blue-400 z-10' : 'ring-white bg-white'}`} />
                        ) : (
                          <div key={i} className={`inline-flex h-8 w-8 items-center justify-center rounded-full ring-2 font-bold text-xs ${doc.id === doctorId ? 'ring-blue-400 bg-blue-100 text-blue-700 z-10' : 'ring-white bg-slate-200 text-slate-600'}`}>
                            {doc.name.replace('Dr. ', '').charAt(0)}
                          </div>
                        )
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-medium">
                    {record.lastDateVisited}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <span className="text-sm text-slate-500">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredHistory.length)} of {filteredHistory.length} patients
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm font-semibold text-slate-700 px-3">
                Page {currentPage} of {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Record Details Popover Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setSelectedRecord(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
              {selectedRecord.avatar ? (
                <img src={selectedRecord.avatar} alt={selectedRecord.patientName} className="w-16 h-16 rounded-full object-cover border border-slate-200 shadow-sm" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-2xl shadow-sm">
                  {selectedRecord.patientName.charAt(0)}
                </div>
              )}
              <div>
                <h3 className="text-2xl font-bold text-slate-900">{selectedRecord.patientName}</h3>
                <p className="text-sm font-mono text-slate-500 mt-1">Patient ID: {selectedRecord.patientId}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Primary Diagnosis</p>
                <p className="font-medium text-slate-900 text-lg leading-tight">{selectedRecord.diagnosis}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Current Status</p>
                <span className={`inline-flex px-3 py-1.5 rounded-lg text-sm font-semibold border ${
                  selectedRecord.status === 'Resolved' ? 'bg-green-50 text-green-700 border-green-200' :
                  selectedRecord.status === 'Ongoing' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                  selectedRecord.status === 'Referred' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                  selectedRecord.status === 'Follow up required' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                  'bg-slate-50 text-slate-700 border-slate-200'
                }`}>
                  {selectedRecord.status}
                </span>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Departments Involved</p>
                <div className="flex flex-wrap gap-2">
                  {selectedRecord.department.map((dep: string) => (
                    <span key={dep} className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium border border-slate-200">{dep}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Last Visited</p>
                <p className="font-medium text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  {selectedRecord.lastDateVisited}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Treating Doctors</p>
                <div className="flex flex-wrap gap-3">
                  {selectedRecord.doctors.map((doc: any) => (
                    <div key={doc.id} className={`flex items-center gap-3 px-3 py-2 rounded-xl border ${doc.id === doctorId ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-slate-50 border-slate-200'}`}>
                      {doc.avatar ? (
                        <img src={doc.avatar} alt={doc.name} className="w-8 h-8 rounded-full object-cover shadow-sm" />
                      ) : (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-sm border ${doc.id === doctorId ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-slate-600 border-slate-100'}`}>
                          {doc.name.replace('Dr. ', '').charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className={`text-sm font-bold ${doc.id === doctorId ? 'text-blue-900' : 'text-slate-800'}`}>
                          {doc.name} {doc.id === doctorId && <span className="ml-1 text-blue-500 font-normal">(You)</span>}
                        </p>
                        <p className="text-xs text-slate-500 font-mono">{doc.id}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-5 border-t border-slate-100">
              <button 
                onClick={() => setSelectedRecord(null)}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors active:scale-95"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TreatmentHistoryView;