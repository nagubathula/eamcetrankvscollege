// pages/index.js
"use client";
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import * as XLSX from 'xlsx';

export default function EngineeringFilter() {
  const [institutions, setInstitutions] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    branch: '',
    branchCode: '',
    type: '',
    search: '',
    rank: '',
    minRank: '',
    maxRank: '',
    useRangeMode: false
  });

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Apply filters whenever filter state changes
  useEffect(() => {
    applyFilters();
  }, [filters, institutions]);

  // Close modal with Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };
    
    if (modalOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto';
    };
  }, [modalOpen]);

  const loadData = async () => {
    try {
      setLoading(true);
      // In a real Next.js app, you'd put the Excel file in the public folder
      const response = await fetch('/interdata.xlsx');
      const data = await response.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const institutionsData = XLSX.utils.sheet_to_json(sheet);
      
      setInstitutions(institutionsData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  // Helper function to apply current filters to any institution list
  const applyCurrentFilters = (institutionsList) => {
    return institutionsList.filter(inst => {
      const ocBoysRank = parseInt(inst.OC_BOYS, 10);
      const institutionName = (inst.Name || inst.name || inst.NAME || '').toLowerCase();

      // Skip institutions without valid OC_BOYS rank data
      if (isNaN(ocBoysRank)) return false;

      // Search filter
      if (filters.search && !institutionName.includes(filters.search.toLowerCase())) return false;

      // Basic filters
      if (filters.branch && inst.Branch !== filters.branch && inst.branch !== filters.branch) return false;
      if (filters.branchCode && inst.branch_code !== filters.branchCode && inst.BRANCH_CODE !== filters.branchCode && inst.Branch_Code !== filters.branchCode) return false;
      if (filters.type && inst.Type !== filters.type && inst.TYPE !== filters.type && inst.type !== filters.type) return false;

      // Rank filters
      if (filters.useRangeMode) {
        const minRank = parseInt(filters.minRank, 10);
        const maxRank = parseInt(filters.maxRank, 10);
        if (!isNaN(minRank) && !isNaN(maxRank)) {
          return ocBoysRank >= minRank && ocBoysRank <= maxRank;
        } else if (!isNaN(minRank)) {
          return ocBoysRank >= minRank;
        } else if (!isNaN(maxRank)) {
          return ocBoysRank <= maxRank;
        }
      } else {
        const userRank = parseInt(filters.rank, 10);
        if (!isNaN(userRank)) {
          return ocBoysRank >= userRank;
        }
      }

      return true;
    });
  };

  const applyFilters = () => {
    if (institutions.length === 0) return;

    const filtered = applyCurrentFilters(institutions);

    // Group institutions by name
    const groupedInstitutions = {};
    
    filtered.forEach(inst => {
      const institutionName = inst.Name || inst.name || inst.NAME || '';
      
      if (!groupedInstitutions[institutionName]) {
        groupedInstitutions[institutionName] = {
          name: institutionName,
          branches: [],
          district: inst.DIST || inst.District || inst.district || '',
          type: inst.TYPE || inst.Type || inst.type || '',
          ranks: [],
          fees: []
        };
      }
      
      const branchCode = inst.branch_code || inst.BRANCH_CODE || inst.Branch_Code || '';
      const rank = parseInt(inst.OC_BOYS || inst.oc_boys || inst.Oc_Boys || 0, 10);
      const fee = inst.COLLFEE || inst.Fee || inst.fee || inst.CollegeFee || '';
      
      if (branchCode && !groupedInstitutions[institutionName].branches.includes(branchCode)) {
        groupedInstitutions[institutionName].branches.push(branchCode);
      }
      
      if (!isNaN(rank) && rank > 0) {
        groupedInstitutions[institutionName].ranks.push(rank);
      }
      
      if (fee && !groupedInstitutions[institutionName].fees.includes(fee)) {
        groupedInstitutions[institutionName].fees.push(fee);
      }
    });
    
    // Convert to array and sort by best rank
    const uniqueInstitutions = Object.values(groupedInstitutions)
      .map(inst => ({
        ...inst,
        bestRank: Math.min(...inst.ranks),
        worstRank: Math.max(...inst.ranks)
      }))
      .sort((a, b) => a.bestRank - b.bestRank);

    setFilteredResults(uniqueInstitutions);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const toggleRankMode = () => {
    setFilters(prev => ({
      ...prev,
      useRangeMode: !prev.useRangeMode,
      rank: '',
      minRank: '',
      maxRank: ''
    }));
  };

  const openModal = (institutionName) => {
    setSelectedInstitution(institutionName);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedInstitution(null);
  };

  const getBranchCodes = () => {
    const branchCodes = [
      'AER', 'AGR', 'AIM', 'AID', 'AI', 'AUT', 'BIO', 'BDT', 'CAD', 'CAI',
      'CBC', 'CCE', 'CCG', 'CCI', 'CHE', 'CIC', 'CIV', 'CSE', 'CSG', 'CSB',
      'CSC', 'CSD', 'CSM', 'CSO', 'CSW', 'CST', 'CSS', 'DS', 'EBM', 'ECES',
      'ECM', 'ECE', 'ECT', 'EEE', 'EIE', 'EVT', 'FDE', 'FDT', 'GIN', 'INF',
      'IST', 'IOT', 'MAU', 'MAD', 'MEC', 'MIN', 'MRB', 'NAM', 'PET', 'PHM',
      'PHD', 'RBT', 'SWE'
    ];
    return branchCodes.sort();
  };

  const getUniqueValues = (field) => {
    const values = institutions.map(inst => {
      return inst[field] || inst[field.toLowerCase()] || inst[field.toUpperCase()] ||
        inst[field.replace('_', '')] || inst[field.replace(' ', '_')];
    }).filter(x => x !== undefined && x !== "" && x !== null);
    return Array.from(new Set(values)).sort();
  };

  // Updated function that respects current filters
  const getInstitutionBranches = (institutionName) => {
    const filteredInstitutions = applyCurrentFilters(institutions);
    
    return filteredInstitutions.filter(branch => {
      const name = branch.Name || branch.name || branch.NAME || '';
      return name === institutionName;
    }).sort((a, b) => {
      const rankA = parseInt(a.OC_BOYS || a.oc_boys || a.Oc_Boys || Infinity, 10);
      const rankB = parseInt(b.OC_BOYS || b.oc_boys || b.Oc_Boys || Infinity, 10);
      return rankA - rankB;
    });
  };

  const renderModal = () => {
    if (!modalOpen || !selectedInstitution) return null;

    const allBranches = getInstitutionBranches(selectedInstitution);
    const institutionData = filteredResults.find(inst => inst.name === selectedInstitution);

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border border-black/50 w-[98%] shadow-lg rounded-md bg-white">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900">{selectedInstitution}</h3>
            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          <div className="mt-4">
            <div className="mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>District:</strong> {institutionData?.district}</div>
                <div><strong>Type:</strong> {institutionData?.type}</div>
                <div><strong>Filtered Branches:</strong> {allBranches.length}</div>
                <div><strong>Best Rank (Filtered):</strong> {allBranches.length > 0 ? Math.min(...allBranches.map(b => parseInt(b.OC_BOYS || b.oc_boys || b.Oc_Boys || Infinity, 10))) : 'N/A'}</div>
              </div>
            </div>

            {/* Show active filters info */}
            {/* {(filters.branch || filters.branchCode || filters.type || filters.search || filters.rank || filters.minRank || filters.maxRank) && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center mb-2">
                  <svg className="w-4 h-4 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                  </svg>
                  <span className="text-sm font-medium text-yellow-800">Active Filters Applied</span>
                </div>
                <div className="text-xs text-yellow-700">
                  Showing only branches that match your current filter criteria. 
                  {allBranches.length === 0 && " No branches match the current filters."}
                </div>
              </div>
            )} */}

            <div className="mb-3 text-xs text-gray-600">
              <span className="font-medium">Category Legend:</span> 
              <span className="inline-flex items-center px-2 py-1 rounded bg-green-100 text-green-800 mr-2">OC</span>Open Category •
              <span className="inline-flex items-center px-2 py-1 rounded bg-yellow-100 text-yellow-800 mr-2">SC</span>Scheduled Caste •
              <span className="inline-flex items-center px-2 py-1 rounded bg-red-100 text-red-800 mr-2">ST</span>Scheduled Tribe •
              <span className="inline-flex items-center px-2 py-1 rounded bg-purple-100 text-purple-800 mr-2">BC</span>Backward Class •
              <span className="inline-flex items-center px-2 py-1 rounded bg-cyan-100 text-cyan-800 mr-2">EWS</span>Economically Weaker Section •
              <span className="font-medium">B</span>=Boys, <span className="font-medium">G</span>=Girls
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b">
                <h4 className="font-semibold text-gray-900">
                  {allBranches.length > 0 ? 'Filtered Branches & Closing Ranks' : 'No Branches Match Current Filters'}
                </h4>
              </div>
              
              {allBranches.length > 0 ? (
                <>
                  <div className="text-xs text-gray-500 bg-blue-50 px-4 py-2 border-b flex items-center justify-between">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      Scroll horizontally to view all categories • Lower rank numbers are better
                    </div>
                    <div className="text-xs text-blue-600 font-medium">
                      {allBranches.length} branch{allBranches.length !== 1 ? 'es' : ''} shown
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 border-r border-gray-300">Branch</th>
                          <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-16">OC_B</th>
                          <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-16">OC_G</th>
                          <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-16">SC_B</th>
                          <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-16">SC_G</th>
                          <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-16">ST_B</th>
                          <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-16">ST_G</th>
                          <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-16">BCA_B</th>
                          <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-16">BCA_G</th>
                          <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-16">BCB_B</th>
                          <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-16">BCB_G</th>
                          <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-16">BCC_B</th>
                          <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-16">BCC_G</th>
                          <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-16">BCD_B</th>
                          <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-16">BCD_G</th>
                          <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-16">BCE_B</th>
                          <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-16">BCE_G</th>
                          <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-16">EWS_B</th>
                          <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-16">EWS_G</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-20">Fee</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {allBranches.map((branch, branchIndex) => {
                          const branchCode = branch.branch_code || branch.BRANCH_CODE || branch.Branch_Code || '';
                          const branchName = branch.Branch || branch.branch || branch.BRANCH || '';
                          const fee = branch.COLLFEE || branch.Fee || branch.fee || branch.CollegeFee || '';
                          
                          // All category ranks
                          const categories = [
                            { key: 'OC_BOYS', color: 'green' },
                            { key: 'OC_GIRLS', color: 'green' },
                            { key: 'SC_BOYS', color: 'yellow' },
                            { key: 'SC_GIRLS', color: 'yellow' },
                            { key: 'ST_BOYS', color: 'red' },
                            { key: 'ST_GIRLS', color: 'red' },
                            { key: 'BCA_BOYS', color: 'purple' },
                            { key: 'BCA_GIRLS', color: 'purple' },
                            { key: 'BCB_BOYS', color: 'indigo' },
                            { key: 'BCB_GIRLS', color: 'indigo' },
                            { key: 'BCC_BOYS', color: 'pink' },
                            { key: 'BCC_GIRLS', color: 'pink' },
                            { key: 'BCD_BOYS', color: 'teal' },
                            { key: 'BCD_GIRLS', color: 'teal' },
                            { key: 'BCE_BOYS', color: 'orange' },
                            { key: 'BCE_GIRLS', color: 'orange' },
                            { key: 'OC_EWS_BOYS', color: 'cyan' },
                            { key: 'OC_EWS_GIRLS', color: 'cyan' }
                          ];

                          return (
                            <tr key={branchIndex} className={`${branchIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors table-sticky-hover`}>
                              <td className={`px-4 py-3 sticky left-0 ${branchIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'} z-10 border-r border-gray-300 sticky-col`}>
                                <div className="flex flex-col space-y-1">
                                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-800">{branchCode}</span>
                                  <span className="text-xs text-gray-700 font-medium">{branchName}</span>
                                </div>
                              </td>
                              {categories.map(({ key, color }) => {
                                const value = branch[key] || branch[key.toLowerCase()] || branch[key.replace(/_/g, '').toLowerCase()] || '-';
                                return (
                                  <td key={key} className="px-3 py-3 text-center">
                                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${value !== '-' ? `bg-${color}-100 text-${color}-800` : 'bg-gray-100 text-gray-500'}`}>
                                      {value}
                                    </span>
                                  </td>
                                );
                              })}
                              <td className="px-4 py-3 text-right">
                                <span className="text-sm font-semibold text-gray-900">{fee}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No branches match current filters</h3>
                  <p className="mt-1 text-sm text-gray-500">Try adjusting your filter criteria to see branches for this institution.</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button 
                onClick={closeModal}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading institution data...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Engineering Institutions Counselling Filter</title>
        <meta name="description" content="Find the best engineering institutions based on your rank" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Engineering Counselling Filter</h1>
                <p className="mt-1 text-sm text-gray-500">Find the best engineering institutions based on your rank</p>
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Ready</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Info Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">How to use this filter</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>Your Rank:</strong> Enter your rank to see institutions where you&apos;re eligible for admission (institutions with closing ranks at or above your rank)</li>
                    <li><strong>Rank Range:</strong> Toggle range mode to see all institutions with closing ranks within a specific range</li>
                    <li><strong>Institution Details:</strong> Click on any institution name to view all available branches with closing ranks for all categories (OC, SC, ST, BC, EWS - Boys & Girls)</li>
                    <li><strong>Modal Filtering:</strong> The modal respects your current filters - only branches matching your criteria will be shown</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Filters Section */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Filter Options</h2>
            
            {/* Filter Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
                <select 
                  value={filters.branch} 
                  onChange={(e) => handleFilterChange('branch', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  <option value="">All Branches</option>
                  {getUniqueValues('Branch').map(branch => (
                    <option key={branch} value={branch}>{branch}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Branch Code</label>
                <select 
                  value={filters.branchCode} 
                  onChange={(e) => handleFilterChange('branchCode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  <option value="">All Codes</option>
                  {getBranchCodes().map(code => (
                    <option key={code} value={code}>{code}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Institution Type</label>
                <select 
                  value={filters.type} 
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  <option value="">All Types</option>
                  {getUniqueValues('Type').map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <input 
                  type="text" 
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Search institutions..." 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>
            </div>

            {/* Rank Filters */}
            <div className="border-t pt-6">
              <div className="flex items-center mb-4">
                <input 
                  type="checkbox" 
                  id="useRangeMode" 
                  checked={filters.useRangeMode}
                  onChange={toggleRankMode}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="useRangeMode" className="ml-2 text-sm font-medium text-gray-700">Use Rank Range instead of single rank</label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {!filters.useRangeMode ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Your OC_BOYS Rank</label>
                    <input 
                      type="number" 
                      value={filters.rank}
                      onChange={(e) => handleFilterChange('rank', e.target.value)}
                      placeholder="Enter your rank" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>
                ) : (
                  <div className="md:col-span-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Min Rank</label>
                        <input 
                          type="number" 
                          value={filters.minRank}
                          onChange={(e) => handleFilterChange('minRank', e.target.value)}
                          placeholder="Enter min rank" 
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Max Rank</label>
                        <input 
                          type="number" 
                          value={filters.maxRank}
                          onChange={(e) => handleFilterChange('maxRank', e.target.value)}
                          placeholder="Enter max rank" 
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Search Results</h2>
                <div className="text-sm text-gray-500">
                  {filteredResults.length} unique institution{filteredResults.length !== 1 ? 's' : ''} found
                </div>
              </div>
            </div>
            
            {/* Table Container */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Institution Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available Branches</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">District</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Best OC_BOYS Rank</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee Range</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredResults.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No institutions found</h3>
                        <p className="mt-1 text-sm text-gray-500">Try adjusting your filter criteria to see more results.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredResults.map((inst, index) => {
                      const branchesHtml = inst.branches.length > 3 
                        ? (
                          <div className="flex flex-wrap gap-1">
                            {inst.branches.map(branch => (
                              <span key={branch} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">{branch}</span>
                            ))}
                            {/* <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">+{inst.branches.length - 3} more</span> */}
                          </div>
                        )
                        : (
                          <div className="flex flex-wrap gap-1">
                            {inst.branches.map(branch => (
                              <span key={branch} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">{branch}</span>
                            ))}
                          </div>
                        );
                      
                      const rankDisplay = inst.bestRank === inst.worstRank 
                        ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">{inst.bestRank}</span>
                        : (
                          <div className="space-y-1">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">{inst.bestRank}</span>
                            <div className="text-xs text-gray-500">Best of {inst.ranks.length} branches</div>
                          </div>
                        );
                      
                      const feeDisplay = inst.fees.length === 1 
                        ? inst.fees[0]
                        : inst.fees.length > 1 
                          ? `${Math.min(...inst.fees.map(f => parseInt(f) || 0))} - ${Math.max(...inst.fees.map(f => parseInt(f) || 0))}`
                          : '';

                      return (
                        <tr key={inst.name} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                          <td className="px-6 py-4">
                            <div 
                              className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer underline"
                              onClick={() => openModal(inst.name)}
                            >
                              {inst.name}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">{inst.branches.length} branch{inst.branches.length !== 1 ? 'es' : ''} available • Click to view filtered branches</div>
                          </td>
                          <td className="px-6 py-4">
                            {branchesHtml}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{inst.district}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{inst.type}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {rankDisplay}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{feeDisplay}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal */}
        {renderModal()}
      </div>

      <style jsx>{`
        .table-sticky-hover:hover .sticky-col {
          background-color: rgb(239 246 255) !important;
        }
      `}</style>
    </>
  );
}