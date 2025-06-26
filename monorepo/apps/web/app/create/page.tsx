'use client';
import { base } from 'viem/chains';
import styles from "./page.module.css";
import Header from '@/components/Headers';
import React, { useState } from 'react';
import { OnchainKitProvider } from '@coinbase/onchainkit';

// Agent Creation Component replacing CTAsection
function AgentCreationSection() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isDeployed, setIsDeployed] = useState(false);
  const [deploymentDetails, setDeploymentDetails] = useState<{
    agentId: string;
    contractAddress: string;
    akashDeployment: string;
    marketplaceUrl: string;
    apiEndpoint: string;
    deploymentTime: string;
    status: string;
  } | null>(null);
  
  const [agentData, setAgentData] = useState({
    name: '',
    description: '',
    useCase: '',
    pricing: '0.01',
    selfPayout: '70',
    infraPayout: '20',
    daoPayout: '10',
    endpointType: 'bedrock', 
    selectedModel: 'claude',
    customEndpoint: ''
  });

  const steps = [
    { id: 1, title: 'Upload Metadata', icon: '' },
    { id: 2, title: 'Set Pricing', icon: '' },
    { id: 3, title: 'Payout Structure', icon: '' },
    { id: 4, title: 'Configure Handler', icon: '' },
    { id: 5, title: 'Deploy & Launch', icon: '' }
  ];

  const bedrockModels = [
    { id: 'claude', name: 'Claude Sonnet', description: 'Advanced reasoning and analysis' },
    { id: 'nova', name: 'Llama', description: 'Fast and efficient responses' },
    { id: 'titan', name: 'Amazon Titan', description: 'Large-scale text generation' }
  ];

  const handleInputChange = (field:any, value:any) => {
    setAgentData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const deployAgent = () => {
    // Generate deployment details
    const details = {
      agentId: `agent_${Math.random().toString(36).substr(2, 9)}`,
      contractAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
      akashDeployment: `akash-${Math.random().toString(36).substr(2, 8)}`,
      marketplaceUrl: `https://agentstore.com/agent/${Math.random().toString(36).substr(2, 9)}`,
      apiEndpoint: `https://api.agentstore.com/v1/agents/${Math.random().toString(36).substr(2, 9)}`,
      deploymentTime: new Date().toISOString(),
      status: 'Live'
    };
    
    setDeploymentDetails(details);
    setIsDeployed(true);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-20">
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent mb-6">
          Create New Agent
        </h1>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          Deploy your AI agent to the decentralized marketplace in minutes. Set your own pricing, configure payouts, and go live instantly.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex justify-center mb-12">
        <div className="flex space-x-4 bg-gray-900/50 rounded-2xl p-4 backdrop-blur-sm border border-gray-800">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                currentStep === step.id
                  ? 'bg-purple-600 text-white'
                  : currentStep > step.id
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-800 text-gray-400'
              }`}
            >
              <span className="text-lg">{step.icon}</span>
              <span className="font-medium hidden sm:block">{step.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-gray-900/30 backdrop-blur-sm rounded-3xl border border-gray-800 p-8 mb-8">
        {/* Step 1: Upload Metadata */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white mb-6"> Upload Metadata</h2>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-gray-300 font-medium mb-2">Agent Name</label>
                <input
                  type="text"
                  value={agentData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter your agent's name"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:border-purple-500 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-gray-300 font-medium mb-2">Description</label>
                <textarea
                  value={agentData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe what your agent does..."
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:border-purple-500 focus:outline-none transition-colors resize-none"
                />
              </div>
              <div>
                <label className="block text-gray-300 font-medium mb-2">Use Case</label>
                <input
                  type="text"
                  value={agentData.useCase}
                  onChange={(e) => handleInputChange('useCase', e.target.value)}
                  placeholder="e.g., Customer Support, Data Analysis, Content Creation"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:border-purple-500 focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Set Pricing */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white mb-6"> Set Pricing</h2>
            <div className="bg-gray-800/50 rounded-2xl p-6">
              <label className="block text-gray-300 font-medium mb-4">Price per API Call</label>
              <div className="flex items-center space-x-4">
                <span className="text-2xl text-green-400">$</span>
                <input
                  type="number"
                  step="0.001"
                  value={agentData.pricing}
                  onChange={(e) => handleInputChange('pricing', e.target.value)}
                  className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-xl focus:border-purple-500 focus:outline-none transition-colors"
                />
                <span className="text-gray-400">per call</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">Recommended: $0.01 - $0.05 per call</p>
            </div>
          </div>
        )}

        {/* Step 3: Payout Structure */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white mb-6">Define Payout Structure</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-purple-900/30 rounded-2xl p-6 border border-purple-700">
                <label className="block text-purple-300 font-medium mb-2">Your Share</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    value={agentData.selfPayout}
                    onChange={(e) => handleInputChange('selfPayout', e.target.value)}
                    className="w-20 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  />
                  <span className="text-purple-300 ml-2">%</span>
                </div>
              </div>
              <div className="bg-blue-900/30 rounded-2xl p-6 border border-blue-700">
                <label className="block text-blue-300 font-medium mb-2">Infrastructure</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    value={agentData.infraPayout}
                    onChange={(e) => handleInputChange('infraPayout', e.target.value)}
                    className="w-20 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  />
                  <span className="text-blue-300 ml-2">%</span>
                </div>
              </div>
              <div className="bg-cyan-900/30 rounded-2xl p-6 border border-cyan-700">
                <label className="block text-cyan-300 font-medium mb-2">AgentStore DAO</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    value={agentData.daoPayout}
                    onChange={(e) => handleInputChange('daoPayout', e.target.value)}
                    className="w-20 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                  />
                  <span className="text-cyan-300 ml-2">%</span>
                </div>
              </div>
            </div>
            <div className="text-center text-gray-400">
              Total: {parseInt(agentData.selfPayout) + parseInt(agentData.infraPayout) + parseInt(agentData.daoPayout)}%
            </div>
          </div>
        )}

     
        {currentStep === 4 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white mb-6"> Configure Handler</h2>
            <div className="space-y-6">
              <div className="flex space-x-4">
                <button
                  onClick={() => handleInputChange('endpointType', 'bedrock')}
                  className={`flex-1 p-4 rounded-2xl border-2 transition-all ${
                    agentData.endpointType === 'bedrock'
                      ? 'border-purple-500 bg-purple-900/30'
                      : 'border-gray-700 bg-gray-800/30'
                  }`}
                >
                  <h3 className="text-xl font-bold text-white mb-2">Bedrock Model</h3>
                  <p className="text-gray-400">Select from pre-trained models</p>
                </button>
                <button
                  onClick={() => handleInputChange('endpointType', 'custom')}
                  className={`flex-1 p-4 rounded-2xl border-2 transition-all ${
                    agentData.endpointType === 'custom'
                      ? 'border-purple-500 bg-purple-900/30'
                      : 'border-gray-700 bg-gray-800/30'
                  }`}
                >
                  <h3 className="text-xl font-bold text-white mb-2"> Custom Endpoint</h3>
                  <p className="text-gray-400">Upload your own handler</p>
                </button>
              </div>

              {agentData.endpointType === 'bedrock' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {bedrockModels.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => handleInputChange('selectedModel', model.id)}
                      className={`p-4 rounded-xl border transition-all text-left ${
                        agentData.selectedModel === model.id
                          ? 'border-purple-500 bg-purple-900/30'
                          : 'border-gray-700 bg-gray-800/30 hover:border-gray-600'
                      }`}
                    >
                      <h4 className="font-bold text-white">{model.name}</h4>
                      <p className="text-sm text-gray-400">{model.description}</p>
                    </button>
                  ))}
                </div>
              )}

              {agentData.endpointType === 'custom' && (
                <div>
                  <label className="block text-gray-300 font-medium mb-2">Custom Endpoint URL</label>
                  <input
                    type="url"
                    value={agentData.customEndpoint}
                    onChange={(e) => handleInputChange('customEndpoint', e.target.value)}
                    placeholder="https://your-endpoint.com/api"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:border-purple-500 focus:outline-none transition-colors"
                  />
                </div>
              )}
            </div>
          </div>
        )}

  
        {currentStep === 5 && !isDeployed && (
          <div className="space-y-6 text-center">
            <h2 className="text-3xl font-bold text-white mb-6"> Ready to Deploy</h2>
            <div className="bg-gray-800/50 rounded-2xl p-8 space-y-4">
              <div className="text-left space-y-2">
                <p><span className="text-gray-400">Name:</span> <span className="text-white">{agentData.name}</span></p>
                <p><span className="text-gray-400">Pricing:</span> <span className="text-green-400">${agentData.pricing} per call</span></p>
                <p><span className="text-gray-400">Your Share:</span> <span className="text-purple-400">{agentData.selfPayout}%</span></p>
                <p><span className="text-gray-400">Model:</span> <span className="text-blue-400">
                  {agentData.endpointType === 'bedrock' 
                    ? bedrockModels.find(m => m.id === agentData.selectedModel)?.name 
                    : 'Custom Endpoint'}
                </span></p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-2">Deployment Process</h3>
              <div className="text-left space-y-2 text-purple-100">
                <p> Agent hosted on Akash (decentralized cloud)</p>
                
                <p> Instant marketplace listing</p>
                <p> Real-time analytics dashboard</p>
              </div>
            </div>
          </div>
        )}

       
        {currentStep === 5 && isDeployed && deploymentDetails && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              
              <h2 className="text-3xl font-bold text-white mb-2">Agent Successfully Deployed!</h2>
              <p className="text-gray-300">Your agent is now live and available in the marketplace</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                  <span className="text-blue-400 mr-2"></span>
                  Agent Information
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Agent ID:</span>
                    <span className="text-white font-mono">{deploymentDetails.agentId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className="text-green-400 font-semibold">{deploymentDetails.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Deployed:</span>
                    <span className="text-white">{new Date(deploymentDetails.deploymentTime).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                  <span className="text-purple-400 mr-2"></span>
                  Blockchain Details
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Contract:</span>
                    <span className="text-white font-mono text-xs">{deploymentDetails.contractAddress}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Network:</span>
                    <span className="text-blue-400">Base Sepolia</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Gas Used:</span>
                    <span className="text-white">0.0023 ETH</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                  <span className="text-cyan-400 mr-2"></span>
                  Akash Deployment
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Deployment ID:</span>
                    <span className="text-white font-mono">{deploymentDetails.akashDeployment}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Provider:</span>
                    <span className="text-cyan-400">Akash Network</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Region:</span>
                    <span className="text-white">US-West-2</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                  <span className="text-green-400 mr-2"></span>
                  Revenue Settings
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Price per Call:</span>
                    <span className="text-green-400 font-semibold">${agentData.pricing}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Your Share:</span>
                    <span className="text-purple-400">{agentData.selfPayout}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Infrastructure:</span>
                    <span className="text-blue-400">{agentData.infraPayout}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4"> Access Your Agent</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-green-100 mb-2"><strong>Marketplace URL:</strong></p>
                  <a href={deploymentDetails.marketplaceUrl} className="text-white underline hover:text-green-200 break-all">
                    {deploymentDetails.marketplaceUrl}
                  </a>
                </div>
                <div>
                  <p className="text-green-100 mb-2"><strong>API Endpoint:</strong></p>
                  <code className="text-white bg-black/20 px-2 py-1 rounded text-xs block break-all">
                    {deploymentDetails.apiEndpoint}
                  </code>
                </div>
              </div>
            </div>

            <div className="bg-yellow-900/30 border border-yellow-700 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-yellow-300 mb-2 flex items-center">
                
                Next Steps
              </h3>
              <ul className="text-yellow-100 space-y-1 text-sm">
                <li>• Share your agent's marketplace URL to start earning</li>
                <li>• Monitor usage and earnings in your dashboard</li>
                <li>• Update pricing or payout structure anytime</li>
                <li>• Join our Discord for agent creator community</li>
              </ul>
            </div>
          </div>
        )}
      </div>

    
      <div className="flex justify-between">
        <button
          onClick={prevStep}
          disabled={currentStep === 1}
          className="px-6 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        
        {currentStep < 5 ? (
          <button
            onClick={nextStep}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105"
          >
            Next Step
          </button>
        ) : !isDeployed ? (
          <button
            onClick={deployAgent}
            className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all transform hover:scale-105 font-bold"
          >
             Deploy Agent
          </button>
        ) : (
          <button
            disabled
            className="px-8 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl font-bold cursor-not-allowed opacity-75"
          >
             Agent Deployed
          </button>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      <OnchainKitProvider apiKey="HtKBr6ZPPcdHN6plf9qm4G3TAuQtV7Kf" chain={base}>
     
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
            <div className="h-full w-full bg-gradient-to-br from-transparent via-white/5 to-transparent"></div>
            <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="white" strokeWidth="0.5" opacity="0.3"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          <div className="absolute inset-0">
            <div className="absolute h-px w-full bg-gradient-to-r from-transparent via-purple-500/50 to-transparent animate-pulse top-1/4"></div>
            <div className="absolute h-px w-full bg-gradient-to-r from-transparent via-blue-500/50 to-transparent animate-pulse top-2/3 delay-1000"></div>
            <div className="absolute w-px h-full bg-gradient-to-b from-transparent via-cyan-500/50 to-transparent animate-pulse left-1/4 delay-2000"></div>
            <div className="absolute w-px h-full bg-gradient-to-b from-transparent via-purple-500/50 to-transparent animate-pulse right-1/3 delay-500"></div>
          </div>
        </div>

     
        <div className="relative z-10 min-h-screen">
          <Header/>
          <AgentCreationSection/>
        </div>

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
      </OnchainKitProvider>
    </div>
  );
}