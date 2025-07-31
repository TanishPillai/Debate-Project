import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Team, type Speaker, type Speech } from '../types';
import { BETWEEN_SPEECHES_GAP_SECONDS } from '../constants';
import * as Icons from './icons';
import { generateSpeech, askJudge } from '../services/geminiService';

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

const SpeakerCard: React.FC<{ speaker: Speaker, isActive: boolean, isSpeaking: boolean }> = ({ speaker, isActive, isSpeaking }) => (
    <div className={`border-2 rounded-xl p-4 transition-all duration-300 ${isActive ? 'border-sky-400 shadow-2xl shadow-sky-500/20' : 'border-slate-700'}`}>
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${speaker.isUser ? 'bg-indigo-500' : 'bg-slate-600'}`}>
                    {isSpeaking ? (
                        <Icons.MicrophoneIcon className="w-6 h-6 text-white animate-pulse" />
                    ) : (
                        <Icons.MicrophoneIcon className="w-6 h-6 text-slate-400" />
                    )}
                </div>
                <div>
                    <p className={`font-bold text-lg ${isActive ? 'text-white' : 'text-slate-300'}`}>{speaker.name}</p>
                    <p className="text-sm text-slate-400">{speaker.role}</p>
                </div>
            </div>
            {isActive && <div className="text-xs uppercase font-bold text-sky-400 bg-sky-900/50 px-2 py-1 rounded-full">Active</div>}
        </div>
        <p className="text-xs text-slate-500 mt-2">{speaker.team}</p>
    </div>
);

interface DebateScreenProps {
    topic: string;
    speakers: Speaker[];
    onDebateEnd: (transcript: Speech[]) => void;
    onStopDebate: () => void;
}

export const DebateScreen: React.FC<DebateScreenProps> = ({ topic, speakers, onDebateEnd, onStopDebate }) => {
    const [currentSpeakerIndex, setCurrentSpeakerIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(speakers[0].speechTime);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [transcript, setTranscript] = useState<Speech[]>([]);
    const [currentUtterance, setCurrentUtterance] = useState("");
    const [inGap, setInGap] = useState(true);
    const [gapTimeLeft, setGapTimeLeft] = useState(BETWEEN_SPEECHES_GAP_SECONDS);
    
    const [isUserPaused, setIsUserPaused] = useState(false);
    const [isJudgeModalOpen, setIsJudgeModalOpen] = useState(false);
    const [judgeQuestion, setJudgeQuestion] = useState('');
    const [judgeAnswer, setJudgeAnswer] = useState('');
    const [isJudgeLoading, setIsJudgeLoading] = useState(false);
    const [judgeHistory, setJudgeHistory] = useState<{ question: string; answer: string }[]>([]);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [showStopConfirm, setShowStopConfirm] = useState(false);


    const recognitionRef = useRef<any | null>(null);
    const timerRef = useRef<number | null>(null);

    const currentSpeaker = speakers[currentSpeakerIndex];

    useEffect(() => {
        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            if (availableVoices.length > 0) {
                const englishVoices = availableVoices.filter(v => v.lang.startsWith('en'));
                setVoices(englishVoices.length > 0 ? englishVoices : availableVoices);
            }
        };
        // Voices may load asynchronously.
        window.speechSynthesis.onvoiceschanged = loadVoices;
        loadVoices();
        return () => {
            window.speechSynthesis.onvoiceschanged = null;
        };
    }, []);

    const nextTurn = useCallback(() => {
        setIsSpeaking(false);
        if (timerRef.current) clearInterval(timerRef.current);
        window.speechSynthesis.cancel();
        
        if (currentSpeakerIndex < speakers.length - 1) {
            setCurrentSpeakerIndex(prev => prev + 1);
            setTimeLeft(speakers[currentSpeakerIndex + 1].speechTime);
            setInGap(true);
            setGapTimeLeft(BETWEEN_SPEECHES_GAP_SECONDS);
        } else {
            onDebateEnd(transcript);
        }
    }, [currentSpeakerIndex, onDebateEnd, transcript, speakers]);

    useEffect(() => {
        if (isUserPaused || isJudgeModalOpen || showStopConfirm) {
            if (timerRef.current) clearTimeout(timerRef.current);
            window.speechSynthesis.pause();
            return;
        }

        if (inGap) {
            if (currentSpeakerIndex === 0) {
                setInGap(false);
                return;
            }
            if (gapTimeLeft > 0) {
                timerRef.current = window.setTimeout(() => setGapTimeLeft(g => g - 1), 1000);
            } else {
                setInGap(false);
            }
        } else {
            if (!isSpeaking) return;

            if (timeLeft > 0) {
                timerRef.current = window.setTimeout(() => setTimeLeft(t => t - 1), 1000);
            } else {
                if (currentSpeaker.isUser) {
                    recognitionRef.current?.stop();
                } else {
                    window.speechSynthesis.cancel();
                }
                const finalTranscript = currentUtterance;
                setTranscript(prev => [...prev, { speakerRole: currentSpeaker.role, transcript: finalTranscript }]);
                setCurrentUtterance("");
                nextTurn();
            }
        }
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [isSpeaking, timeLeft, nextTurn, currentSpeaker, inGap, gapTimeLeft, currentSpeakerIndex, isUserPaused, isJudgeModalOpen, currentUtterance, showStopConfirm]);

    const handleAISpeech = useCallback(async () => {
        setIsThinking(true);
        setIsSpeaking(true);
        const plainTextSpeech = await generateSpeech(currentSpeaker.role, topic, transcript, currentSpeaker.team, currentSpeaker.speechTime);
        setCurrentUtterance(plainTextSpeech);
        setIsThinking(false);

        if (!('speechSynthesis' in window)) {
            console.error("Browser does not support Speech Synthesis.");
            setTimeout(() => {
                setTranscript(prev => [...prev, { speakerRole: currentSpeaker.role, transcript: plainTextSpeech }]);
                setCurrentUtterance("");
                nextTurn();
            }, 3000);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(plainTextSpeech);
        
        if (voices.length > 0) {
            const voiceIndex = currentSpeaker.voiceIndex ?? 0;
            utterance.voice = voices[voiceIndex % voices.length];
        }
        
        // Add subtle, human-like variations to break monotony
        utterance.pitch = 1 + (Math.random() * 0.2 - 0.1); // Range: 0.9 to 1.1
        utterance.rate = 1 + (Math.random() * 0.1 - 0.05); // Range: 0.95 to 1.05

        utterance.onend = () => {
            setTranscript(prev => [...prev, { speakerRole: currentSpeaker.role, transcript: plainTextSpeech }]);
            setCurrentUtterance("");
            nextTurn();
        };
        
        if (!isUserPaused && !isJudgeModalOpen) {
            window.speechSynthesis.speak(utterance);
        }

    }, [currentSpeaker, topic, transcript, nextTurn, isUserPaused, isJudgeModalOpen, voices]);

    useEffect(() => {
        if (!inGap && !currentSpeaker.isUser && !isSpeaking && !isUserPaused && !isJudgeModalOpen) {
           handleAISpeech();
        }
        return () => {
            window.speechSynthesis.cancel();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inGap, currentSpeaker, isSpeaking, isUserPaused, isJudgeModalOpen]);

    const startUserSpeech = () => {
        if (!SpeechRecognition) {
            alert("Speech recognition is not supported in your browser.");
            return;
        }
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onresult = (event: any) => {
            let finalTranscript = "";
            for (let i = 0; i < event.results.length; ++i) {
                finalTranscript += event.results[i][0].transcript;
            }
            setCurrentUtterance(finalTranscript);
        };
        
        recognitionRef.current.onend = () => {
            // This can be triggered by stop() or by silence.
        }

        recognitionRef.current.start();
        setIsSpeaking(true);
    };

    const stopUserSpeech = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setTranscript(prev => [...prev, { speakerRole: currentSpeaker.role, transcript: currentUtterance }]);
            setCurrentUtterance("");
            nextTurn();
        }
    };
    
    const handlePauseResume = () => {
        setIsUserPaused(prev => {
            const isNowPaused = !prev;
            if (isNowPaused) {
                if (timerRef.current) clearTimeout(timerRef.current);
                window.speechSynthesis.pause();
                if (currentSpeaker.isUser && recognitionRef.current) {
                   recognitionRef.current.stop();
                }
            } else {
                if (!isJudgeModalOpen) {
                   window.speechSynthesis.resume();
                   if (currentSpeaker.isUser && isSpeaking) {
                       recognitionRef.current?.start();
                   }
                }
            }
            return isNowPaused;
        });
    };

    const handleOpenJudgeModal = () => {
        setIsJudgeModalOpen(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        window.speechSynthesis.pause();
    };



    const handleCloseJudgeModal = () => {
        setIsJudgeModalOpen(false);
        if (!isUserPaused) {
            window.speechSynthesis.resume();
        }
    };

    const handleAskJudge = async () => {
        if (!judgeQuestion) return;
        setIsJudgeLoading(true);
        setJudgeAnswer('');
        const answer = await askJudge(topic, transcript, judgeQuestion);
        setJudgeHistory(prev => [...prev, { question: judgeQuestion, answer }]);
        setJudgeQuestion('');
        setJudgeAnswer('');
        setIsJudgeLoading(false);
    };

    const skipAISpeech = () => {
        window.speechSynthesis.cancel();
        setTranscript(prev => [...prev, { speakerRole: currentSpeaker.role, transcript: currentUtterance }]);
        setCurrentUtterance("");
        nextTurn();
    };

    return (
      <>
        <div className="min-h-screen bg-slate-900 flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="w-full max-w-7xl mx-auto flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100">Debate in Progress</h1>
                    <p className="text-slate-400 truncate max-w-sm md:max-w-md">Topic: {topic}</p>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-4">
                    <button onClick={() => setShowStopConfirm(true)} aria-label="Stop debate" className="p-2 rounded-full bg-red-900/50 text-red-400 hover:bg-red-800/70 hover:text-red-300 transition-colors">
                        <Icons.XCircleIcon className="w-6 h-6" />
                    </button>
                    <button onClick={handleOpenJudgeModal} aria-label="Ask the judge" className="p-2 rounded-full bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white transition-colors">
                        <Icons.GavelIcon className="w-6 h-6" />
                    </button>
                    <button onClick={handlePauseResume} aria-label={isUserPaused ? "Resume debate" : "Pause debate"} className="p-2 rounded-full bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white transition-colors">
                        {isUserPaused ? <Icons.PlayIcon className="w-6 h-6" /> : <Icons.PauseIcon className="w-6 h-6" />}
                    </button>
                    <div className="bg-slate-800 p-3 rounded-lg flex items-center space-x-2">
                        <Icons.TimerIcon className="w-6 h-6 text-sky-400" />
                        <span className="text-2xl font-mono font-bold text-white">{formatTime(timeLeft)}</span>
                    </div>
                </div>
            </header>

            <main className="w-full max-w-7xl mx-auto flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-4">
                     <h2 className="text-xl font-bold text-center text-slate-300">{Team.A}</h2>
                    {speakers.filter(s => s.team === Team.A).map(s => (
                        <SpeakerCard key={s.id} speaker={s} isActive={s.id === currentSpeaker.id} isSpeaking={isSpeaking && s.id === currentSpeaker.id} />
                    ))}
                </div>

                <div className="lg:col-span-1 bg-slate-800 rounded-xl flex flex-col items-center justify-center p-6 text-center shadow-2xl relative">
                    {inGap ? (
                        <>
                           <h2 className="text-2xl font-bold text-white">Next Speaker In...</h2>
                            <p className="text-8xl font-black text-sky-400 my-4">{gapTimeLeft}</p>
                            <p className="text-slate-400">{speakers[currentSpeakerIndex].role} ({speakers[currentSpeakerIndex].name})</p>
                        </>
                    ) : isThinking ? (
                        <>
                            <Icons.LoadingSpinner className="w-16 h-16 text-sky-400" />
                            <p className="text-xl font-semibold text-slate-300 mt-4">{currentSpeaker.name} is preparing...</p>
                        </>
                    ) : (
                        <>
                            <p className="text-lg font-semibold text-sky-400">{currentSpeaker.role}</p>
                            <p className="text-3xl font-bold my-2 text-white">{currentSpeaker.name}</p>
                            
                            {currentSpeaker.isUser && (
                                <div className="mt-8">
                                    {!isSpeaking ? (
                                        <button onClick={startUserSpeech} className="px-10 py-4 bg-green-500 text-white font-bold rounded-full shadow-lg flex items-center space-x-2 transform hover:scale-105 transition-transform duration-200">
                                            <Icons.PlayIcon className="w-6 h-6"/>
                                            <span>Start My Speech</span>
                                        </button>
                                    ) : (
                                        <button onClick={stopUserSpeech} className="px-10 py-4 bg-red-500 text-white font-bold rounded-full shadow-lg flex items-center space-x-2 transform hover:scale-105 transition-transform duration-200">
                                            <Icons.StopIcon className="w-6 h-6"/>
                                            <span>End My Speech</span>
                                        </button>
                                    )}
                                </div>
                            )}

                             <div className="mt-4 text-slate-300 max-h-64 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-700">
                                <p>{currentUtterance}</p>
                             </div>


                            {!currentSpeaker.isUser && isSpeaking && !isThinking && (
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
                                    <button
                                        onClick={skipAISpeech}
                                        aria-label="Skip AI speech and move to next turn"
                                        className="px-8 py-3 bg-sky-500 text-white font-bold rounded-full shadow-lg flex items-center space-x-3 transform hover:scale-105 transition-transform duration-200 hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-opacity-75"
                                    >
                                        <Icons.FastForwardIcon className="w-6 h-6"/>
                                        <span>Skip</span>
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="lg:col-span-1 space-y-4">
                    <h2 className="text-xl font-bold text-center text-slate-300">{Team.B}</h2>
                    {speakers.filter(s => s.team === Team.B).map(s => (
                        <SpeakerCard key={s.id} speaker={s} isActive={s.id === currentSpeaker.id} isSpeaking={isSpeaking && s.id === currentSpeaker.id} />
                    ))}
                </div>
            </main>
        </div>

        {showStopConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 animate-fade-in-up">
                <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-sm border border-slate-700 text-center">
                    <Icons.XCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">End Debate?</h2>
                    <p className="text-slate-400 mb-8">Are you sure you want to quit? Your progress will be lost and no feedback will be generated.</p>
                    <div className="flex justify-center space-x-4">
                        <button onClick={() => setShowStopConfirm(false)} className="px-8 py-3 bg-slate-600 text-white font-semibold rounded-lg hover:bg-slate-500 transition-colors duration-200 w-full">
                            Cancel
                        </button>
                        <button onClick={onStopDebate} className="px-8 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors duration-200 w-full">
                            Stop Debate
                        </button>
                    </div>
                </div>
                <style>{`
                    @keyframes fade-in-up {
                        from { opacity: 0; transform: translateY(20px) scale(0.95); }
                        to { opacity: 1; transform: translateY(0) scale(1); }
                    }
                    .animate-fade-in-up {
                        animation: fade-in-up 0.3s ease-out forwards;
                    }
                `}</style>
            </div>
        )}

        {isJudgeModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="judge-modal-title">
                <div className="bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl border border-slate-700 flex flex-col" style={{maxHeight: '90vh'}}>
                    <div className="flex-shrink-0">
                        <div className="flex justify-between items-center mb-4">
                            <h2 id="judge-modal-title" className="text-2xl font-bold text-white flex items-center"><Icons.GavelIcon className="w-6 h-6 mr-3 text-sky-400"/> Ask the Judge</h2>
                            <button onClick={handleCloseJudgeModal} aria-label="Close" className="text-slate-400 hover:text-white">
                                <Icons.XIcon className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex-grow overflow-y-auto pr-2 space-y-4 mb-4 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-700">
                        {judgeHistory.length === 0 && !isJudgeLoading && (
                             <p className="text-slate-400 text-center py-4">Your conversation history with the judge will appear here.</p>
                        )}
                        {judgeHistory.map((item, index) => (
                            <div key={index} className="space-y-3">
                                <div className="text-right">
                                    <p className="text-sm text-indigo-300 mb-1">You Asked:</p>
                                    <p className="inline-block bg-indigo-500 text-white p-3 rounded-lg rounded-br-none">{item.question}</p>
                                 </div>
                                <div>
                                    <p className="text-sm text-sky-300 mb-1">Judge Responded:</p>
                                    <div className="inline-block bg-slate-700 text-slate-200 p-3 rounded-lg rounded-bl-none whitespace-pre-wrap">{item.answer}</div>
                                </div>
                            </div>
                        ))}
                         {isJudgeLoading && (
                            <div className="flex items-center space-x-2 text-slate-400">
                                <Icons.LoadingSpinner className="w-5 h-5" />
                                <span>Judge is thinking...</span>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex-shrink-0 space-y-4">
                        <textarea
                            value={judgeQuestion}
                            onChange={(e) => setJudgeQuestion(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleAskJudge();
                                }
                            }}
                            rows={2}
                            className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none text-slate-200"
                            placeholder="Ask for clarification..."
                            disabled={isJudgeLoading}
                        />
                        <button onClick={handleAskJudge} disabled={!judgeQuestion || isJudgeLoading} className="w-full py-2.5 px-5 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center">
                            {isJudgeLoading ? <Icons.LoadingSpinner className="w-6 h-6" /> : 'Submit Question'}
                        </button>
                    </div>
                </div>
            </div>
        )}
      </>
    );
};