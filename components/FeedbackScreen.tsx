import React, { useState, useEffect } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import type { Feedback, Speech } from '../types';
import * as Icons from './icons';

interface FeedbackScreenProps {
  feedback: Feedback;
  transcript: Speech[];
  onRestart: () => void;
  onViewHistory: () => void;
  isHistoryView?: boolean;
  onBackToHistory?: () => void;
}

// --- Sub-components for the new design ---

const ScoreGauge: React.FC<{ score: number }> = ({ score }) => {
    const [displayScore, setDisplayScore] = useState(0);
    const size = 180;
    const strokeWidth = 16;
    const center = size / 2;
    const radius = center - strokeWidth;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (displayScore / 10) * circumference;

    useEffect(() => {
        const animation = requestAnimationFrame(() => setDisplayScore(score));
        return () => cancelAnimationFrame(animation);
    }, [score]);

    const getScoreColor = () => {
        if (score >= 8) return "url(#gaugeGradientGreen)";
        if (score >= 5) return "url(#gaugeGradientYellow)";
        return "url(#gaugeGradientRed)";
    };
    
    const getPraiseText = () => {
        if (score >= 9) return "Outstanding!";
        if (score >= 7.5) return "Excellent!";
        if (score >= 6) return "Great Job!";
        if (score >= 4) return "Good Effort!";
        return "Needs Practice";
    }

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <defs>
                    <linearGradient id="gaugeGradientGreen" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#34d399" />
                        <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                     <linearGradient id="gaugeGradientYellow" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#fbbf24" />
                        <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                     <linearGradient id="gaugeGradientRed" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#f87171" />
                        <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                </defs>
                <circle
                    stroke="#374151"
                    fill="transparent"
                    cx={center}
                    cy={center}
                    r={radius}
                    strokeWidth={strokeWidth}
                />
                <circle
                    stroke={getScoreColor()}
                    fill="transparent"
                    cx={center}
                    cy={center}
                    r={radius}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${center} ${center})`}
                    style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-white">{score.toFixed(1)}</span>
                <span className="text-sm font-semibold text-gray-400 mt-1">{getPraiseText()}</span>
            </div>
        </div>
    );
};


const MetricCard: React.FC<{ title: string; score: number }> = ({ title, score }) => {
    const getBarColor = () => {
        if (score >= 8) return "bg-green-500";
        if (score >= 5) return "bg-yellow-500";
        return "bg-red-500";
    };

    return (
        <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
            <div className="flex justify-between items-baseline">
                <h4 className="font-semibold text-gray-300 text-sm">{title}</h4>
                <p className="font-bold text-white text-lg">{score}<span className="text-xs text-gray-500">/10</span></p>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
                <div
                    className={`${getBarColor()} h-1.5 rounded-full`}
                    style={{ width: `${score * 10}%`, transition: 'width 1s ease-out' }}
                ></div>
            </div>
        </div>
    );
};


const FeedbackInsightCard: React.FC<{ title: string; icon: React.ReactNode; items: string[] | string; }> = ({ title, icon, items }) => (
    <div className="bg-gray-800/60 p-6 rounded-xl border border-gray-700 h-full backdrop-blur-sm">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            {icon}
            <span className="ml-3">{title}</span>
        </h3>
        {Array.isArray(items) ? (
            <ul className="space-y-3 text-gray-300 pl-1">
                {items.map((item, index) => (
                    <li key={index} className="flex">
                        <span className="text-sky-400 font-bold mr-3">&#8227;</span>
                        <span className="flex-1">{item}</span>
                    </li>
                ))}
            </ul>
        ) : (
            <p className="text-gray-300">{items}</p>
        )}
    </div>
);

export const FeedbackScreen: React.FC<FeedbackScreenProps> = ({ feedback, transcript, onRestart, onViewHistory, isHistoryView, onBackToHistory }) => {
  const { scores, overallSummary, strengths, areasForImprovement, strategicAdvice } = feedback;
  
  const overallScore = (scores.speakingPoints + scores.logicAndReasoning + scores.rhetoricAndPersuasion + scores.rebuttalAndAdaptation) / 4;

  const scoreData = [
    { subject: 'Speaking', A: scores.speakingPoints, fullMark: 10 },
    { subject: 'Logic', A: scores.logicAndReasoning, fullMark: 10 },
    { subject: 'Rhetoric', A: scores.rhetoricAndPersuasion, fullMark: 10 },
    { subject: 'Rebuttal', A: scores.rebuttalAndAdaptation, fullMark: 10 },
  ];
  
  const [showTranscript, setShowTranscript] = useState(false);

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
      <h1 className="text-4xl sm:text-5xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-500 mb-2">
        {isHistoryView ? 'Debate Analysis' : 'Debate Complete!'}
      </h1>
      <p className="text-center text-gray-400 mb-10">Here's your performance breakdown.</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left Column: Overall Score & Summary */}
        <div className="lg:col-span-1 bg-gray-800/70 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-gray-700 flex flex-col items-center text-center">
            <Icons.TrophyIcon className="w-12 h-12 text-yellow-400 mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Overall Performance</h2>
            <ScoreGauge score={overallScore} />
            <div className="mt-6">
                <h3 className="text-lg font-semibold text-white mb-2">Judge's Executive Summary</h3>
                <p className="text-gray-300 text-sm">{overallSummary}</p>
            </div>
        </div>

        {/* Right Column: Detailed Metrics & Radar Chart */}
        <div className="lg:col-span-2 bg-gray-800/70 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-gray-700 flex flex-col justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Score Breakdown</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <MetricCard title="Speaking Points" score={scores.speakingPoints} />
                  <MetricCard title="Logic & Reasoning" score={scores.logicAndReasoning} />
                  <MetricCard title="Rhetoric & Persuasion" score={scores.rhetoricAndPersuasion} />
                  <MetricCard title="Rebuttal & Adaptation" score={scores.rebuttalAndAdaptation} />
              </div>
            </div>
             <div className="w-full h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={scoreData}>
                        <defs>
                            <radialGradient id="radarGradient">
                                <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.7}/>
                                <stop offset="100%" stopColor="#6366f1" stopOpacity={0.4}/>
                            </radialGradient>
                        </defs>
                        <PolarGrid stroke="#4b5563" />
                        <PolarAngleAxis dataKey="subject" stroke="#d1d5db" />
                        <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                        <Radar name="Score" dataKey="A" stroke="#38bdf8" fill="url(#radarGradient)" fillOpacity={0.9} />
                        <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.75rem' }}/>
                    </RadarChart>
                </ResponsiveContainer>
             </div>
        </div>
      </div>

      {/* Bottom Section: Insights */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <FeedbackInsightCard title="Key Strengths" icon={<Icons.StarIcon className="w-6 h-6 text-green-400" />} items={strengths} />
            <FeedbackInsightCard title="Areas for Improvement" icon={<Icons.WarningIcon className="w-6 h-6 text-yellow-400" />} items={areasForImprovement} />
            <FeedbackInsightCard title="Strategic Advice" icon={<Icons.LightbulbIcon className="w-6 h-6 text-sky-400" />} items={strategicAdvice} />
        </div>
      
      <div className="text-center space-x-2 sm:space-x-4">
        {isHistoryView && onBackToHistory && (
             <button onClick={onBackToHistory} className="px-5 py-2.5 bg-gray-700 text-gray-200 font-semibold rounded-lg shadow-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-75 transition-colors duration-200 inline-flex items-center">
                <Icons.ArrowLeftIcon className="w-5 h-5 mr-2" />
                Back to History
            </button>
        )}
        <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="px-5 py-2.5 bg-gray-700 text-gray-200 font-semibold rounded-lg shadow-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-75 transition-colors duration-200"
        >
            {showTranscript ? 'Hide' : 'View'} Transcript
        </button>
        {!isHistoryView && (
            <>
                <button
                    onClick={onViewHistory}
                    className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-lg shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 transition-all duration-200"
                >
                    View History
                </button>
                <button
                    onClick={onRestart}
                    className="px-6 py-2.5 bg-sky-500 text-white font-bold rounded-lg shadow-lg hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-opacity-75 transform hover:scale-105 transition-all duration-200"
                >
                    Start New Debate
                </button>
            </>
        )}
      </div>

      {showTranscript && (
        <div className="mt-8 bg-gray-800 p-6 rounded-2xl shadow-2xl max-h-96 overflow-y-auto border border-gray-700 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-900 animate-fade-in">
          <h2 className="text-2xl font-bold text-white mb-4">Full Transcript</h2>
          <div className="space-y-4 text-gray-300">
            {transcript.map((speech, index) => (
              <div key={index} className="p-3 bg-gray-900/50 rounded-lg">
                <p className="font-semibold text-sky-400">{speech.speakerRole}</p>
                <p className="mt-1 whitespace-pre-wrap">{speech.transcript}</p>
              </div>
            ))}
          </div>
        </div>
      )}
       <style>{`
          @keyframes fade-in {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
              animation: fade-in 0.5s ease-out forwards;
          }
      `}</style>
    </div>
  );
};