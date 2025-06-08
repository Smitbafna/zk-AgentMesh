
"use client";

import { useState, useEffect } from "react";
import { base } from 'viem/chains';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { X, Clock, CheckCircle, AlertCircle, Copy } from 'lucide-react';
import Header from '@/components/Headers';
import { parseEther } from "viem";
import { 
  useAccount, 
  useSendTransaction, 
  useWaitForTransactionReceipt 
} from "wagmi";
// Mock agent data
const agents = [
  {
    id: 1,
    name: "DocSummarizer Pro",
    description: "Advanced document analysis and summarization with multi-format support",
    category: "Document Processing",
    price: 0.05,
    creator: "0x1234...5678",
    hostingWallet: "0xABCD...EFGH",
    rating: 4.8,
    requests: 1247,
    tags: ["PDF", "Analysis", "Summary"],
    avatar: "📄"
  },
  {
    id: 2,
    name: "CodeReview AI",
    description: "Expert code review, bug detection, and optimization suggestions",
    category: "Development",
    price: 0.08,
    creator: "0x9876...5432",
    hostingWallet: "0xXYZ1...2345",
    rating: 4.9,
    requests: 892,
    tags: ["Code", "Review", "Debug"],
    avatar: "💻"
  },
  {
    id: 3,
    name: "Research Assistant",
    description: "Comprehensive research with citation tracking and fact verification",
    category: "Research",
    price: 0.12,
    creator: "0x5555...7777",
    hostingWallet: "0xRESE...ARCH",
    rating: 4.7,
    requests: 634,
    tags: ["Research", "Citations", "Academic"],
    avatar: "🔬"
  },
  {
    id: 4,
    name: "Creative Writer",
    description: "Professional content creation for blogs, marketing, and storytelling",
    category: "Content",
    price: 0.06,
    creator: "0x2222...8888",
    hostingWallet: "0xWRIT...E123",
    rating: 4.6,
    requests: 1523,
    tags: ["Writing", "Creative", "Marketing"],
    avatar: "✍️"
  },
  {
    id: 5,
    name: "Data Analyzer",
    description: "Statistical analysis, visualization, and insights from complex datasets",
    category: "Analytics",
    price: 0.10,
    creator: "0x3333...9999",
    hostingWallet: "0xDATA...ANAL",
    rating: 4.9,
    requests: 445,
    tags: ["Data", "Stats", "Visualization"],
    avatar: "📊"
  },
  {
    id: 6,
    name: "Translation Expert",
    description: "Multi-language translation with cultural context and nuance preservation",
    category: "Language",
    price: 0.04,
    creator: "0x4444...0000",
    hostingWallet: "0xTRAN...SLAT",
    rating: 4.8,
    requests: 2156,
    tags: ["Translation", "Languages", "Cultural"],
    avatar: "🌍"
  }
];





export default function AgentBrowseSection() {
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [userQuery, setUserQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [requestDetails, setRequestDetails] = useState(null);
  const [processingStatus, setProcessingStatus] = useState('idle'); 
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [mockProcessingTimer, setMockProcessingTimer] = useState(null); 
  
  const getMockResponse = (agent:any, query:any) => {
    const responses = {
      1: `Document Summary
  Title: The Benefits of Remote Work
  
  Summary:
  This document explores how remote work has transformed modern workplaces by offering flexibility, increased productivity, and cost savings. It outlines key advantages such as improved work-life balance, access to a global talent pool, and reduced commuting stress. The document also addresses common challenges, including communication barriers and the need for robust technology infrastructure. Finally, it recommends best practices for companies to implement effective remote work policies.
  
  Key Insights:
  
  Remote work boosts employee satisfaction and retention.
  
  Companies save on office space and operational costs.
  
  Technology tools are critical for collaboration and security.
  
  Clear communication and trust-building are essential for remote teams.
  
  Recommendations:
  
  Invest in reliable communication platforms.
  
  Provide flexible schedules to accommodate diverse employee needs.
  
  Establish clear guidelines and expectations for remote work.
  
  Encourage regular virtual team interactions to maintain engagement.`,
  
      2: `## Code Review Results
  
  **Issues Found:** 2 minor, 0 critical
  
  **Recommendations:**
  • Line 23: Consider using const instead of let
  • Function complexity could be reduced in utils.js
  • Overall code quality: Excellent
  
  **Security Check:** ✅ Passed
  **Performance Impact:** Low
  **Maintainability Score:** 8.5/10
  
  Your code for "${query}" shows good practices with room for minor optimizations.`,
  
      3: `## Research Report
  
  **Sources Analyzed:** 15 academic papers, 8 industry reports
  
  **Key Findings:**
  • Current trends align with your query about "${query}"
  • 73% of experts agree on primary methodology
  • Emerging patterns detected in recent publications
  
  **Citations:**
  1. Smith et al. (2024) - Primary research methodology
  2. Johnson Research Group (2024) - Industry applications
  3. Tech Analysis Quarterly (2024) - Future implications
  
  **Confidence Level:** High (87%)`,
  
      4: `## Creative Content Generated
  
  **Content Type:** Blog post / Marketing copy
  **Word Count:** 847 words
  **Tone:** Professional, engaging
  
  **Generated Content:**
  Based on "${query}", I've crafted compelling content that balances creativity with strategic messaging. The piece includes:
  
  • Attention-grabbing headline
  • Structured narrative flow
  • Call-to-action optimization
  • SEO-friendly keywords integrated
  
  **Readability Score:** 8.2/10
  **Engagement Potential:** High`,
  
      5: `## Data Analysis Complete
  
  **Dataset Processing:**
  • 12,847 data points analyzed
  • 5 key patterns identified
  • Statistical significance confirmed
  
  **Visualizations Generated:**
  📊 Trend analysis chart
  📈 Performance metrics dashboard  
  🎯 Correlation matrix
  
  **Key Insights:**
  Your query "${query}" revealed significant correlations with 94% confidence interval. Peak performance indicators show consistent growth patterns.
  
  **Recommendations:** Implementation of findings could improve metrics by 23-31%`,
  
      6: `## Translation Complete
  
  **Languages:** Auto-detected → Target language
  **Text Length:** 342 words processed
  **Cultural Context:** Preserved
  
  **Translation Quality:**
  • Accuracy: 98.7%
  • Cultural nuance: Maintained
  • Technical terms: Verified
  • Localization: Applied
  
  For "${query}" - the translation maintains original meaning while adapting to cultural context. Regional variations have been considered for optimal comprehension.
  
  **Confidence Score:** 9.4/10`
    };
    
    return responses[agent.id] || `## Request Processed\n\nYour request "${query}" has been processed successfully by ${agent.name}. The analysis is complete and results are ready for your review.`;
  };
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
    
 
    console.log('Files uploaded:', files.map(f => f.name));
  };
  
  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };
  
 
  const clearAllFiles = () => {
    setUploadedFiles([]);
  };
  
  const categories = ['All', 'Document Processing', 'Development', 'Research', 'Content', 'Analytics', 'Language'];
  
  const filteredAgents = filterCategory === 'All' 
    ? agents 
    : agents.filter(agent => agent.category === filterCategory);
  
  // Treasury address where payments will be sent
  const TREASURY_ADDRESS = "0x838aD0EAE54F99F1926dA7C3b6bFbF617389B4D9";
  
  // Wagmi hooks - these must be at the top level of the component
  const { address, isConnected } = useAccount();
  const { 
    sendTransaction, 
    data: txHash, 
    isPending: isTxPending, 
    error: txError,
    reset: resetTx
  } = useSendTransaction();
  
  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed, 
    isError: isConfirmError 
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });
  
  // Handle transaction confirmation (only for actual successful transactions)
  useEffect(() => {
    if (isConfirmed && requestDetails) {
      console.log('Transaction completed successfully!');
      
      // Clear the mock timer since real transaction succeeded
      if (mockProcessingTimer) {
        clearTimeout(mockProcessingTimer);
        setMockProcessingTimer(null);
      }
      
      // Update status to payment confirmed
      setRequestDetails(prev => ({
        ...prev,
        status: 'payment_confirmed',
        blockchainConfirmed: true
      }));
  
      // Continue with agent processing after successful payment
      setTimeout(() => {
        const response = getMockResponse(requestDetails.agent, requestDetails.query);
        setRequestDetails(prev => ({
          ...prev,
          status: 'complete',
          response,
          completedAt: new Date().toISOString()
        }));
        setProcessingStatus('complete');
      }, 15000);
    }
  }, [isConfirmed, requestDetails, mockProcessingTimer]);
  
  // Handle transaction errors (but continue with mock processing)
  useEffect(() => {
    if (txError || isConfirmError) {
      console.error('Transaction error:', txError || 'Transaction confirmation failed');
      console.log('Transaction failed, but continuing with mock processing...');
      
      // Don't set error status, let the mock timer handle the flow
      // The mock processing will continue regardless
    }
  }, [txError, isConfirmError]);
  
  // Handle transaction hash update
  useEffect(() => {
    if (txHash && requestDetails) {
      console.log('Transaction created! Hash:', txHash);
  
      // Clear any existing mock timer since we got a real transaction
      if (mockProcessingTimer) {
        clearTimeout(mockProcessingTimer);
        setMockProcessingTimer(null);
      }
  
      setRequestDetails(prev => ({
        ...prev,
        status: 'processing',
        transactionHash: txHash,
        signedAt: new Date().toISOString()
      }));
      setProcessingStatus('processing');
    }
  }, [txHash, requestDetails]);
 
  
  const handleMakeRequest = async () => {
    if (!selectedAgent || !userQuery.trim()) return;
  
    // Check wallet connection first
    if (!isConnected || !address) {
      alert('Wallet not connected. Please connect your wallet first.');
      return;
    }
  
    const requestId = Date.now().toString();
    const timestamp = new Date().toISOString();
  
    // Store current query and agent for mock processing
    const currentAgent = selectedAgent;
    const currentQuery = userQuery;
  
    // Create request details
    const details = {
      id: requestId,
      agent: selectedAgent,
      query: userQuery,
      timestamp,
      cost: selectedAgent.price,
      paymentBreakdown: {
        creator: (selectedAgent.price * 0.7).toFixed(3),
        hosting: (selectedAgent.price * 0.2).toFixed(3),
        treasury: (selectedAgent.price * 0.1).toFixed(3)
      },
      transactionHash: null,
      status: 'preparing',
      response: null,
      treasuryAddress: TREASURY_ADDRESS,
      userAddress: address
    };
  
    setRequestDetails(details);
    setProcessingStatus('preparing');
  
    // Set up mock processing timer (4 seconds)
    const timer = setTimeout(() => {
      console.log('4 seconds passed, showing mock response...');
      
      // Generate mock transaction hash
      const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;
      
      // Update to processing status
      setRequestDetails(prev => ({
        ...prev,
        status: 'processing',
        transactionHash: mockTxHash,
        signedAt: new Date().toISOString()
      }));
      setProcessingStatus('processing');
  
      // After another 2 seconds, show the response
      setTimeout(() => {
        const response = getMockResponse(currentAgent, currentQuery);
        setRequestDetails(prev => ({
          ...prev,
          status: 'complete',
          response,
          completedAt: new Date().toISOString(),
          mockProcessing: true // Flag to indicate this was mock processed
        }));
        setProcessingStatus('complete');
      }, 2000);
      
    }, 4000);
  
    setMockProcessingTimer(timer);
  
    try {
      console.log('Connected wallet address:', address);
  
      // Update status to signing
      setRequestDetails(prev => ({
        ...prev,
        status: 'signing'
      }));
      setProcessingStatus('signing');
  
      // Reset any previous transaction state
      resetTx();
  
      // Send the ETH transfer transaction
      sendTransaction({
        to: TREASURY_ADDRESS,
        value: parseEther(selectedAgent.price.toString()),
      });
  
      // The rest of the flow is handled by useEffect hooks above
      // OR by the mock timer if transaction fails/is denied
  
    } catch (error) {
      console.error('Transaction error:', error);
      
      // Don't set error status, let the mock timer handle the flow
      console.log('Transaction failed, mock processing will continue...');
    }
  
    // Clear form only after initiating transaction
    setUserQuery('');
    setSelectedAgent(null);
  };
  
  // Clean up timer on component unmount
  useEffect(() => {
    return () => {
      if (mockProcessingTimer) {
        clearTimeout(mockProcessingTimer);
      }
    };
  }, [mockProcessingTimer]);
  
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };
  
  const closeRequestDetails = () => {
    // Clear any pending mock timer
    if (mockProcessingTimer) {
      clearTimeout(mockProcessingTimer);
      setMockProcessingTimer(null);
    }
    
    setRequestDetails(null);
    setProcessingStatus('idle');
  };
  return (
    <OnchainKitProvider apiKey="HtKBr6ZPPcdHN6plf9qm4G3TAuQtV7Kf" chain={base}>
      <div className="min-h-screen relative overflow-hidden bg-black">
        {/* Animated Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
          
          <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white/30 rounded-full animate-bounce"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${3 + Math.random() * 2}s`
                }}
              ></div>
            ))}
          </div>

          <div className="absolute inset-0 opacity-10">
            <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="white" strokeWidth="0.5" opacity="0.3"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <Header/>
            <div className="text-center mb-12 mt-8">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent mb-4">
                AI Agent Marketplace
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Browse powerful AI agents, make requests, and pay with crypto. Revenue automatically splits between creators, hosting, and treasury.
              </p>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setFilterCategory(category)}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                    filterCategory === category
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Agent Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {filteredAgents.map((agent) => (
                <div
                  key={agent.id}
                  className={`bg-white/10 backdrop-blur-lg rounded-2xl p-6 border transition-all cursor-pointer hover:scale-105 ${
                    selectedAgent?.id === agent.id
                      ? 'border-purple-500 bg-purple-500/20 shadow-xl shadow-purple-500/25'
                      : 'border-white/20 hover:border-white/40'
                  }`}
                  onClick={() => setSelectedAgent(agent)}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-4xl">{agent.avatar}</div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{agent.name}</h3>
                      <p className="text-purple-300 text-sm">{agent.category}</p>
                    </div>
                  </div>

                  <p className="text-gray-300 text-sm mb-4 line-clamp-3">{agent.description}</p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {agent.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-white/10 rounded-full text-xs text-gray-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-400">★</span>
                      <span className="text-white text-sm">{agent.rating}</span>
                      <span className="text-gray-400 text-xs">({agent.requests} requests)</span>
                    </div>
                    <div className="text-lg font-bold text-green-400">
                      ${agent.price}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="text-xs text-gray-400">
                      <div>Creator: {agent.creator}</div>
                      <div>Revenue Split: 70% Creator | 20% Hosting | 10% Treasury</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Request Interface */}
            {selectedAgent && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                  <div className="text-3xl">{selectedAgent.avatar}</div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Make Request to {selectedAgent.name}</h3>
                    <p className="text-gray-300">Cost: ${selectedAgent.price} USD via x402pay</p>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-white text-sm font-medium mb-2">
                    Your Request
                  </label>
                  <textarea
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    placeholder="e.g., 'Summarize this document', 'Review my code for bugs', 'Research AI trends in 2024'..."
                    className="w-full h-32 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                <div className="bg-white/5 rounded-xl p-4 mb-6">
                  <h4 className="text-white font-medium mb-2">Payment Distribution</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-purple-400 font-bold">${(selectedAgent.price * 0.7).toFixed(3)}</div>
                      <div className="text-gray-400">Agent Creator (70%)</div>
                    </div>
                    <div className="text-center">
                      <div className="text-blue-400 font-bold">${(selectedAgent.price * 0.2).toFixed(3)}</div>
                      <div className="text-gray-400">Hosting (20%)</div>
                    </div>
                    <div className="text-center">
                      <div className="text-cyan-400 font-bold">${(selectedAgent.price * 0.1).toFixed(3)}</div>
                      <div className="text-gray-400">Treasury (10%)</div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
  {/* File Upload Button */}
  <div className="relative">
    <input
      type="file"
      id="file-upload"
      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      onChange={handleFileUpload}
      accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.csv,.xlsx,.xls"
      multiple
    />
    <button className="px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all flex items-center gap-2">
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
      Upload Files
    </button>
  </div>

  {/* Main Request Button */}
  <button
    onClick={handleMakeRequest}
    disabled={!userQuery.trim() || processingStatus === 'processing'}
    className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold py-4 px-8 rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {processingStatus === 'processing' ? (
      <div className="flex items-center justify-center gap-2">
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        Processing Payment & Request...
      </div>
    ) : (
      `Send Request - $${selectedAgent.price}`
    )}
  </button>

  {/* Cancel Button */}
  <button
    onClick={() => setSelectedAgent(null)}
    className="px-6 py-4 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all"
  >
    Cancel
  </button>
</div>

{/* File Upload Display Area (optional) */}
{uploadedFiles && uploadedFiles.length > 0 && (
  <div className="mt-4 p-4 bg-white/5 rounded-xl">
    <h3 className="text-white/80 text-sm font-medium mb-2">Uploaded Files:</h3>
    <div className="flex flex-wrap gap-2">
      {uploadedFiles.map((file, index) => (
        <div key={index} className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-lg text-sm text-white/90">
          <span>{file.name}</span>
          <button
            onClick={() => removeFile(index)}
            className="text-white/60 hover:text-white/90 transition-colors"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  </div>
)}
              </div>
            )}
          </div>
        </div>

        {/* Request Details Modal */}
        {requestDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-gray-900 rounded-2xl border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-white/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{requestDetails.agent.avatar}</div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Request Details</h2>
                    <p className="text-gray-400 text-sm">ID: {requestDetails.id}</p>
                  </div>
                </div>
                <button
                  onClick={closeRequestDetails}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Status Header */}
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                  {requestDetails.status === 'processing' && (
                    <>
                      <Clock className="w-6 h-6 text-yellow-400 animate-spin" />
                      <div>
                        <div className="text-white font-medium">Processing Request</div>
                        <div className="text-yellow-400 text-sm">Payment confirmed, agent working...</div>
                      </div>
                    </>
                  )}
                  {requestDetails.status === 'complete' && (
                    <>
                      <CheckCircle className="w-6 h-6 text-green-400" />
                      <div>
                        <div className="text-white font-medium">Request Complete</div>
                        <div className="text-green-400 text-sm">Agent has finished processing your request</div>
                      </div>
                    </>
                  )}
                </div>

                {/* Request Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-white font-medium mb-2">Agent Information</h3>
                      <div className="bg-white/5 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Name:</span>
                          <span className="text-white">{requestDetails.agent.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Category:</span>
                          <span className="text-white">{requestDetails.agent.category}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Cost:</span>
                          <span className="text-green-400">${requestDetails.cost}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-white font-medium mb-2">Payment Details</h3>
                      <div className="bg-white/5 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Transaction:</span>
                          <div className="flex items-center gap-2">
                            <span className="text-white text-sm font-mono">{requestDetails.transactionHash}</span>
                            <button 
                              onClick={() => copyToClipboard(requestDetails.transactionHash)}
                              className="p-1 hover:bg-white/10 rounded"
                            >
                              <Copy className="w-3 h-3 text-gray-400" />
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Creator (70%):</span>
                          <span className="text-purple-400">${requestDetails.paymentBreakdown.creator}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Hosting (20%):</span>
                          <span className="text-blue-400">${requestDetails.paymentBreakdown.hosting}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Treasury (10%):</span>
                          <span className="text-cyan-400">${requestDetails.paymentBreakdown.treasury}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-white font-medium mb-2">Your Request</h3>
                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-gray-300 text-sm whitespace-pre-wrap">{requestDetails.query}</p>
                    </div>
                    
                    <div className="mt-4">
                      <h3 className="text-white font-medium mb-2">Timeline</h3>
                      <div className="bg-white/5 rounded-lg p-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Request Sent:</span>
                          <span className="text-white">{new Date(requestDetails.timestamp).toLocaleTimeString()}</span>
                        </div>
                        {requestDetails.completedAt && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Completed:</span>
                            <span className="text-white">{new Date(requestDetails.completedAt).toLocaleTimeString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Response Section */}
                {requestDetails.response && (
                  <div>
                  <h3 className="text-white font-medium mb-4">Agent Response</h3>
                  <div className="bg-white/5 rounded-lg p-6 border border-white/10 max-h-96 overflow-y-auto">
                    <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {requestDetails.response}
                    </div>
                  </div>
                </div>
                )}

                {/* Processing Animation */}
                {requestDetails.status === 'processing' && (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500/20 rounded-full text-yellow-400">
                      <div className="w-4 h-4 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin"></div>
                      <span>Agent is processing your request...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <style jsx>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
          
          .animate-float {
            animation: float 6s ease-in-out infinite;
          }
          
          @keyframes glow {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
          }
          
          .animate-glow {
            animation: glow 2s ease-in-out infinite;
          }
        `}</style>
      </div>
    </OnchainKitProvider>
  );
}