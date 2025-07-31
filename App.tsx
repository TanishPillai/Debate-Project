




import React, { useState, useReducer, useCallback, useEffect, useMemo } from 'react';
import { supabase, isSupabaseConfigured, type Json } from './services/supabaseClient';
import { DebatePhase, type Speech, type Feedback, DEBATE_CATEGORIES, type UserProfile, type DebateRecord, type Score, DebateFormat, type Speaker, SpeakerRole, type AppState, type Action } from './types';
import { PREP_TIME_SECONDS, SPEAKERS_1V1, SPEAKERS_2V2 } from './constants';
import * as Icons from './components/icons';
import { generateTopics, generateFeedback } from './services/geminiService';
import { DebateScreen } from './components/DebateScreen';
import { FeedbackScreen } from './components/FeedbackScreen';
import { LoginScreen } from './components/LoginScreen';
import { HelpModal } from './components/HelpModal';
import { ClubsScreen } from './components/ClubsScreen';
import { UpdatePasswordScreen } from './components/UpdatePasswordScreen';

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// --- Sub-components for simple phases ---

const SetupPhase: React.FC<{ onSetupComplete: (topic: string, format: DebateFormat) => void }> = ({ onSetupComplete }) => {
    const [selectedFormat, setSelectedFormat] = useState<DebateFormat | null>(null);
    const [mode, setMode] = useState<'custom' | 'generate' | null>(null);
    const [customTopic, setCustomTopic] = useState('');
    const [category, setCategory] = useState('');
    const [generatedTopics, setGeneratedTopics] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async () => {
        if (!category) return;
        setIsLoading(true);
        const topics = await generateTopics(category);
        setGeneratedTopics(topics);
        setIsLoading(false);
    };

    const handleTopicSelection = (topic: string) => {
        if (selectedFormat) {
            onSetupComplete(topic, selectedFormat);
        }
    };

    const renderFormatSelection = () => (
        <>
            <h1 className="text-4xl sm:text-5xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-500 mb-8">Select Debate Format</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button onClick={() => setSelectedFormat(DebateFormat.ONE_V_ONE)} className="p-6 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors duration-200 text-center border-2 border-gray-600 hover:border-sky-500">
                    <h2 className="text-xl font-bold text-white">1v1 Sparring</h2>
                    <p className="text-gray-400 mt-2">A head-to-head debate against a single AI opponent. Perfect for honing your core arguments.</p>
                </button>
                <button onClick={() => setSelectedFormat(DebateFormat.TWO_V_TWO)} className="p-6 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors duration-200 text-center border-2 border-gray-600 hover:border-indigo-500">
                    <h2 className="text-xl font-bold text-white">2v2 Parliamentary</h2>
                    <p className="text-gray-400 mt-2">The classic team format. Work with an AI partner to defeat the opposition.</p>
                </button>
            </div>
        </>
    );

    const renderTopicSourceSelection = () => (
        <>
            <button onClick={() => setSelectedFormat(null)} className="absolute top-4 left-4 flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
                <Icons.ArrowLeftIcon className="w-5 h-5" />
                <span>Back</span>
            </button>
            <h1 className="text-4xl sm:text-5xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-500 mb-2">Start a New Debate</h1>
            <p className="text-center text-gray-400 mb-8">Format: <span className="font-semibold text-white">{selectedFormat}</span></p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button onClick={() => setMode('generate')} className="p-6 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors duration-200 text-center border border-gray-600">
                    <h2 className="text-xl font-bold text-white">Generate a Topic</h2>
                    <p className="text-gray-400 mt-2">Choose a category and let our AI create debate topics for you.</p>
                </button>
                <button onClick={() => setMode('custom')} className="p-6 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors duration-200 text-center border border-gray-600">
                    <h2 className="text-xl font-bold text-white">Use Custom Topic</h2>
                    <p className="text-gray-400 mt-2">Enter your own debate topic to get started immediately.</p>
                </button>
            </div>
        </>
    );

    const renderTopicSelection = () => (
        <div className="w-full">
            <h2 className="text-3xl font-bold text-center mb-6 text-white">Choose a Topic</h2>
            <div className="space-y-4">
                {generatedTopics.map((topic, i) => (
                    <button key={i} onClick={() => handleTopicSelection(topic)} className="w-full text-left p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors duration-200 border border-gray-600">
                        {topic}
                    </button>
                ))}
            </div>
            <button onClick={() => setGeneratedTopics([])} className="w-full mt-6 text-gray-400 hover:text-white transition-colors">
                &larr; Back to Categories
            </button>
        </div>
    );

    const renderCategorySelection = () => (
        <div className="w-full">
            <h2 className="text-3xl font-bold text-center mb-6 text-white">Select a Category</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                {DEBATE_CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => setCategory(cat)} className={`p-4 rounded-lg transition-all duration-200 font-semibold border-2 ${category === cat ? 'bg-sky-500 text-white border-sky-400' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}>
                        {cat}
                    </button>
                ))}
            </div>
            <button onClick={handleGenerate} disabled={!category || isLoading} className="w-full py-3 px-6 bg-indigo-600 text-white font-bold rounded-lg shadow-lg hover:bg-indigo-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center">
                {isLoading ? <Icons.LoadingSpinner className="w-6 h-6" /> : 'Generate Topics'}
            </button>
            <button type="button" onClick={() => setMode(null)} className="w-full mt-4 text-gray-400 hover:text-white transition-colors">Back</button>
        </div>
    );

    const renderCustomTopic = () => (
         <form onSubmit={(e) => { e.preventDefault(); if (customTopic) handleTopicSelection(customTopic); }} className="w-full">
            <h2 className="text-3xl font-bold text-center mb-6 text-white">Enter Your Topic</h2>
            <textarea value={customTopic} onChange={(e) => setCustomTopic(e.target.value)} rows={3} className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none text-white" placeholder="e.g., This house believes that artificial intelligence poses a threat to humanity." />
            <div className="flex items-center space-x-4 mt-4">
                <button type="button" onClick={() => setMode(null)} className="w-full py-3 px-6 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-700 transition-colors duration-200">Back</button>
                <button type="submit" disabled={!customTopic} className="w-full py-3 px-6 bg-sky-500 text-white font-bold rounded-lg shadow-lg hover:bg-sky-600 disabled:bg-gray-500 transition-colors duration-200">Start Debate</button>
            </div>
        </form>
    );

    const renderContent = () => {
        if (!selectedFormat) {
            return renderFormatSelection();
        }
        if (!mode) {
            return renderTopicSourceSelection();
        }
        if (mode === 'custom') {
            return renderCustomTopic();
        }
        if (mode === 'generate') {
            return generatedTopics.length > 0 ? renderTopicSelection() : renderCategorySelection();
        }
        return null;
    }

    return (
        <div className="w-full max-w-2xl bg-gray-800/70 backdrop-blur-sm border border-gray-700 p-8 rounded-2xl shadow-2xl relative">
            {renderContent()}
        </div>
    );
};

const PrepPhase: React.FC<{ topic: string, speakers: Speaker[], onPrepComplete: () => void }> = ({ topic, speakers, onPrepComplete }) => {
    const [timeLeft, setTimeLeft] = useState(PREP_TIME_SECONDS);
    const timerRef = React.useRef<number | null>(null);

    const userSpeeches = useMemo(() => speakers.filter(s => s.isUser), [speakers]);

    useEffect(() => {
        timerRef.current = window.setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    if(timerRef.current) clearInterval(timerRef.current);
                    onPrepComplete();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => { if(timerRef.current) clearInterval(timerRef.current); };
    }, [onPrepComplete]);

    return (
        <div className="w-full max-w-5xl mx-auto">
            <div className="bg-gray-800/70 backdrop-blur-sm border border-gray-700 p-8 rounded-2xl shadow-2xl text-center mb-6">
                <p className="text-gray-400 uppercase tracking-widest">Preparation Phase</p>
                <h1 className="text-3xl font-bold text-white mt-2 mb-4 truncate">Topic: {topic}</h1>
                <div className="flex items-center justify-center space-x-3 text-7xl font-black text-sky-400">
                    <Icons.TimerIcon className="w-16 h-16" />
                    <span className='font-mono'>{formatTime(timeLeft)}</span>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800/70 backdrop-blur-sm border border-gray-700 p-6 rounded-2xl shadow-2xl">
                    <h2 className="text-xl font-bold mb-4 flex items-center text-white"><Icons.NoteIcon className="w-6 h-6 mr-2 text-indigo-400"/> Your Notes ({userSpeeches[0].team})</h2>
                    <textarea className="w-full h-64 p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none text-white" placeholder="Jot down your arguments, rebuttals, and key points here..."></textarea>
                </div>
                <div className="bg-gray-800/70 backdrop-blur-sm border border-gray-700 p-6 rounded-2xl shadow-2xl flex flex-col justify-between">
                     <div>
                        <h2 className="text-xl font-bold mb-4 text-white">Instructions</h2>
                        <ul className="list-disc list-inside text-gray-300 space-y-2">
                            {userSpeeches.map((speech, i) => (
                                <li key={i}>Your "{speech.role}" speech is {speech.speechTime / 60} minutes long.</li>
                             ))}
                            <li>Prepare your opening arguments and anticipate the opposition.</li>
                            <li>You can ask the judge for clarification at any time during the debate.</li>
                        </ul>
                     </div>
                     <button onClick={onPrepComplete} className="w-full py-3 mt-6 bg-green-600 text-white font-bold rounded-lg shadow-lg hover:bg-green-700 transition-colors duration-200">I'm Ready!</button>
                </div>
            </div>
        </div>
    );
};

const HistoryScreen: React.FC<{
    history: DebateRecord[];
    onSelectRecord: (id: string) => void;
    onBack: () => void;
}> = ({ history, onSelectRecord, onBack }) => {
    
    const analytics = React.useMemo(() => {
        if (history.length === 0) return null;
        const totalScores = history.reduce((acc, record) => {
            Object.keys(record.feedback.scores).forEach(key => {
                acc[key as keyof Score] = (acc[key as keyof Score] || 0) + record.feedback.scores[key as keyof Score];
            });
            return acc;
        }, {} as Partial<Record<keyof Score, number>>);

        const avgScores: Partial<Record<keyof Score, number>> = {};
        (Object.keys(totalScores) as Array<keyof Score>).forEach(key => {
            avgScores[key] = totalScores[key]! / history.length;
        });
        return avgScores;
    }, [history]);

    return (
        <div className="w-full max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                 <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-500">Debate History</h1>
                 <button onClick={onBack} className="flex items-center space-x-2 px-4 py-2 bg-gray-700 text-gray-200 font-semibold rounded-lg shadow-md hover:bg-gray-600 transition-colors duration-200">
                    <Icons.ArrowLeftIcon className="w-5 h-5"/>
                    <span>Back</span>
                </button>
            </div>
           
            {analytics && (
                <div className="bg-gray-800/70 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-gray-700 mb-8">
                    <h2 className="text-2xl font-bold text-white mb-4">Performance Snapshot</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        {Object.entries(analytics).map(([key, value]) => (
                            <div key={key}>
                                <p className="text-sm text-gray-400 uppercase tracking-wider">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                </p>
                                <p className="text-3xl font-bold text-sky-400">{value.toFixed(1)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {history.length > 0 ? (
                    history.map(record => (
                        <div key={record.id} className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 flex justify-between items-center hover:bg-gray-800 transition-colors">
                            <div>
                                <p className="font-semibold text-white truncate max-w-md">{record.topic}</p>
                                <p className="text-sm text-gray-400">{new Date(record.created_at).toLocaleString()} ({record.format})</p>
                            </div>
                            <button onClick={() => onSelectRecord(record.id)} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
                                View Analysis
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-gray-700">
                        <Icons.HistoryIcon className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                        <p className="text-lg font-semibold text-gray-300">You have no completed debates.</p>
                        <p className="text-gray-400 mt-1">Finish a debate to see its analysis here.</p>
                        <div className="mt-6 pt-6 border-t border-gray-700 mx-8 text-left">
                            <p className="text-xs text-gray-500">
                                <span className="font-bold block text-gray-400 mb-2">Troubleshooting: Still no history?</span>
                                This is almost always a Row Level Security (RLS) policy issue in your Supabase project.
                                <ol className="list-decimal list-inside space-y-1 mt-1">
                                    <li>Ensure you have a policy for the <code className="bg-gray-900 px-1 py-0.5 rounded text-sky-400">SELECT</code> command on your `debate_records` table.</li>
                                    <li>The policy's <code className="bg-gray-900 px-1 py-0.5 rounded text-sky-400">USING expression</code> must be exactly: <code className="bg-gray-900 px-1.5 py-1 rounded text-amber-300">(auth.uid() = user_id)</code></li>
                                    <li>A common mistake is using <code className="bg-gray-900 px-1.5 py-1 rounded text-red-400">(auth.uid() = id)</code>, which is correct for the `profiles` table but wrong for `debate_records`.</li>
                                </ol>
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
};

const SaveErrorScreen: React.FC<{ error: string; onRestart: () => void }> = ({ error, onRestart }) => (
    <div className="w-full max-w-2xl bg-red-900/20 backdrop-blur-sm border border-red-500/50 p-8 rounded-2xl shadow-2xl text-center">
        <Icons.XCircleIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-white mb-2">Save Failed</h2>
        <p className="text-red-300 mb-6">Your debate record could not be saved to the database.</p>
        
        <div className="bg-gray-900/50 p-4 rounded-lg text-left mb-6 font-mono text-xs text-red-300 overflow-x-auto">
            {error}
        </div>
        
        <div className="text-left text-sm text-gray-400 space-y-2">
            <p className="font-bold text-gray-300">This is usually caused by a missing or incorrect Row Level Security (RLS) policy in Supabase.</p>
            <p>Please ensure you have a policy that allows the <code className="bg-gray-900 px-1 py-0.5 rounded text-sky-400">INSERT</code> command on your `debate_records` table.</p>
            <p>The policy's <code className="bg-gray-900 px-1 py-0.5 rounded text-sky-400">WITH CHECK expression</code> must be exactly: <code className="bg-gray-900 px-1.5 py-1 rounded text-amber-300">(auth.uid() = user_id)</code></p>
        </div>

        <button onClick={onRestart} className="mt-8 w-full py-3 bg-sky-600 text-white font-bold rounded-lg shadow-lg hover:bg-sky-700 transition-colors duration-200">
            Back to Setup
        </button>
    </div>
);


const AppHeader: React.FC<{user: UserProfile; onHelp: () => void; onLogout: () => void; onViewHistory: () => void; onViewClubs: () => void;}> = ({ user, onHelp, onLogout, onViewHistory, onViewClubs }) => {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <header className="absolute top-0 left-0 right-0 p-4 z-10">
            <div className="w-full max-w-7xl mx-auto flex justify-between items-center">
                <div className="text-xl font-bold text-white">Debate <span className="text-sky-400">Compass</span></div>
                <div className="flex items-center space-x-2 sm:space-x-4">
                     <button onClick={onViewClubs} className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors">
                        <Icons.UsersIcon className="w-6 h-6"/>
                        <span className="hidden sm:inline">Clubs</span>
                    </button>
                    <button onClick={onViewHistory} className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors">
                        <Icons.HistoryIcon className="w-6 h-6"/>
                        <span className="hidden sm:inline">History</span>
                    </button>
                    <button onClick={onHelp} className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors">
                        <Icons.QuestionMarkCircleIcon className="w-6 h-6"/>
                        <span className="hidden sm:inline">Help</span>
                    </button>
                    <div className="relative">
                        <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center space-x-2 p-2 bg-gray-800/50 rounded-full border border-gray-700">
                           <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-white">
                               {user.name.charAt(0).toUpperCase()}
                           </div>
                           <span className="hidden md:inline text-white pr-2">
                               {user.clubName && <span className="text-indigo-300 mr-1 text-xs">[{user.clubName}]</span>}
                               {user.name}
                            </span>
                           <Icons.ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {menuOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-md shadow-lg py-1">
                                <button onClick={() => { onLogout(); setMenuOpen(false); }} className="w-full text-left flex items-center space-x-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                                    <Icons.ArrowRightOnRectangleIcon className="w-5 h-5"/>
                                    <span>Logout</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

const SupabaseWarningBanner = () => (
    <div className="bg-red-600 text-white p-3 text-center font-semibold fixed top-0 left-0 right-0 z-50 shadow-lg">
        <div className="flex items-center justify-center">
            <Icons.WarningIcon className="w-6 h-6 mr-3" />
            <span><strong>Configuration Error:</strong> Supabase is not connected. Please set `SUPABASE_URL` and `SUPA_ANON_KEY` environment variables.</span>
        </div>
    </div>
);

// --- Main App Component ---

const initialState: AppState = {
    phase: DebatePhase.AUTH,
    topic: '',
    debateFormat: null,
    speakers: [],
    transcript: [],
    isLoading: false,
    user: null,
    isHelpModalOpen: false,
    history: [],
    selectedRecordId: null,
    appReady: false,
    saveError: null,
};

function appReducer(state: AppState, action: Action): AppState {
    switch (action.type) {
        case 'SET_USER':
            return { 
                ...state, 
                user: action.payload.user, 
                history: action.payload.history,
                phase: DebatePhase.SETUP,
                appReady: true,
            };
        case 'CLEAR_USER':
            return {
                ...initialState,
                phase: DebatePhase.AUTH,
                appReady: true,
            };
        case 'APP_READY':
             return { ...state, appReady: true };
        case 'UPDATE_USER_PROFILE':
            return { ...state, user: action.payload.user };
        case 'START_PREP':
            return { 
                ...state, 
                phase: DebatePhase.PREP, 
                topic: action.payload.topic, 
                debateFormat: action.payload.format,
                speakers: action.payload.format === DebateFormat.ONE_V_ONE ? SPEAKERS_1V1 : SPEAKERS_2V2,
                transcript: [],
                saveError: null, 
            };
        case 'START_DEBATE':
            return { ...state, phase: DebatePhase.DEBATE };
        case 'FINISH_DEBATE':
            return { ...state, phase: DebatePhase.FEEDBACK, transcript: action.payload.transcript, isLoading: true, selectedRecordId: null };
        case 'ADD_HISTORY_RECORD':
            return {
                ...state,
                isLoading: false,
                history: [action.payload.record, ...state.history],
            }
        case 'RESTART':
             return { ...state, phase: DebatePhase.SETUP, topic: '', transcript: [], isLoading: false, selectedRecordId: null, debateFormat: null, speakers: [], saveError: null };
        case 'STOP_DEBATE':
            return { ...state, phase: DebatePhase.SETUP, topic: '', transcript: [], isLoading: false, selectedRecordId: null, debateFormat: null, speakers: [] };
        case 'TOGGLE_HELP':
            return { ...state, isHelpModalOpen: !state.isHelpModalOpen };
        case 'VIEW_HISTORY':
            return { ...state, phase: DebatePhase.HISTORY, selectedRecordId: null };
        case 'VIEW_CLUBS':
            return { ...state, phase: DebatePhase.CLUBS, selectedRecordId: null };
        case 'SELECT_RECORD':
            return { ...state, selectedRecordId: action.payload.id };
        case 'VIEW_SETUP':
            return { ...state, phase: DebatePhase.SETUP, selectedRecordId: null };
        case 'SET_SAVE_ERROR':
            return { ...state, isLoading: false, saveError: action.payload };
        case 'START_PASSWORD_RECOVERY':
            return {
                ...initialState,
                phase: DebatePhase.PASSWORD_RECOVERY,
                appReady: true,
            };
        default:
            return state;
    }
}

export default function App() {
    const [state, dispatch] = useReducer(appReducer, initialState);

    useEffect(() => {
        if (!isSupabaseConfigured) {
            dispatch({ type: 'APP_READY' });
            return;
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                dispatch({ type: 'START_PASSWORD_RECOVERY' });
                return;
            }
            if (session?.user) {
                // With the database trigger, we can assume the profile exists.
                // If it doesn't, it's a critical error, and we should sign out.
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();
                
                if (profileError || !profile) {
                    console.error("Error fetching user profile, or profile not found after trigger should have run. Signing out.", profileError);
                    await supabase.auth.signOut();
                    dispatch({ type: 'CLEAR_USER' });
                    return; // Stop execution
                }

                // By this point, profile is a valid profile object.
                let clubName: string | null = null;
                if (profile.club_id) {
                    const { data: club } = await supabase.from('clubs').select('name').eq('id', profile.club_id).single();
                    clubName = club?.name ?? null;
                }

                const userProfile: UserProfile = {
                    id: profile.id,
                    name: profile.name,
                    email: session.user.email!,
                    clubId: profile.club_id,
                    clubName: clubName,
                };

                const { data: historyData, error: historyError } = await supabase
                    .from('debate_records')
                    .select('*')
                    .eq('user_id', userProfile.id)
                    .order('created_at', { ascending: false });
                
                if (historyError) {
                    console.error("---Supabase History Fetch Error---");
                    console.error("A critical error occurred while fetching debate history. This is almost always an issue with your Row Level Security (RLS) policies on the 'debate_records' table.");
                    console.error("Error Message:", historyError.message);
                    console.error("Error Details:", historyError.details);
                    console.error("Database Hint:", historyError.hint);
                    console.error("Full Error Object:", historyError);
                    console.error("---------------------------------");
                }

                const history: DebateRecord[] = (historyData as any) || [];
                dispatch({ type: 'SET_USER', payload: { user: userProfile, history } });

            } else {
                dispatch({ type: 'CLEAR_USER' });
            }
        });

        return () => subscription.unsubscribe();
    }, []);


    const handleLogout = useCallback(async () => {
        // By dispatching 'CLEAR_USER' immediately, we provide an instant visual
        // feedback to the user that they are being logged out. The UI will
        // switch to the login screen right away.
        dispatch({ type: 'CLEAR_USER' });
        
        // Then, we perform the actual sign-out from Supabase.
        const { error } = await supabase.auth.signOut();
        
        if (error) {
            console.error("Error signing out:", error);
            // The user is already on the login screen, so we'll just log this for debugging.
        }
    }, []);

    const handleUserUpdate = useCallback((user: UserProfile) => dispatch({ type: 'UPDATE_USER_PROFILE', payload: { user } }), []);
    const handleSetupComplete = useCallback((topic: string, format: DebateFormat) => dispatch({ type: 'START_PREP', payload: { topic, format } }), []);
    const handlePrepComplete = useCallback(() => dispatch({ type: 'START_DEBATE' }), []);
    const handleDebateEnd = useCallback((transcript: Speech[]) => dispatch({ type: 'FINISH_DEBATE', payload: { transcript } }), []);
    const handleStopDebate = useCallback(() => dispatch({ type: 'STOP_DEBATE' }), []);
    const handleRestart = useCallback(() => dispatch({ type: 'RESTART' }), []);
    const handleToggleHelp = useCallback(() => dispatch({ type: 'TOGGLE_HELP' }), []);
    const handleViewHistory = useCallback(() => dispatch({ type: 'VIEW_HISTORY' }), []);
    const handleViewClubs = useCallback(() => dispatch({ type: 'VIEW_CLUBS' }), []);
    const handleSelectRecord = useCallback((id: string) => dispatch({ type: 'SELECT_RECORD', payload: {id} }), []);
    const handleBackToHistory = useCallback(() => dispatch({ type: 'VIEW_HISTORY' }), []);
    const handleReturnToSetup = useCallback(() => dispatch({ type: 'VIEW_SETUP' }), []);
    const handleBackToLogin = useCallback(() => dispatch({ type: 'CLEAR_USER' }), []);

    useEffect(() => {
        const body = document.body;
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        body.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);
        if (state.isHelpModalOpen) body.classList.add('modal-open');
        else body.classList.remove('modal-open');
    }, [state.isHelpModalOpen]);

    useEffect(() => {
        if (state.phase === DebatePhase.FEEDBACK && state.isLoading && state.transcript.length > 0 && state.user) {
            const getFeedbackAndSave = async () => {
                const userRoles = state.speakers.filter(s => s.isUser).map(s => s.role);
                const feedbackData = await generateFeedback(state.topic, state.transcript, userRoles);
                
                const { data, error } = await supabase
                    .from('debate_records')
                    .insert([{
                        topic: state.topic,
                        format: state.debateFormat!,
                        speakers: state.speakers as unknown as Json,
                        transcript: state.transcript as unknown as Json,
                        feedback: feedbackData as unknown as Json,
                        user_id: state.user!.id
                    }])
                    .select()
                    .single();

                if (data && !error) {
                    const record: DebateRecord = data as any;
                    dispatch({ type: 'ADD_HISTORY_RECORD', payload: { record } });
                } else {
                    console.error("Error saving debate record:", error);
                    const errorMessage = error ? error.message : "An unknown error occurred while saving the debate.";
                    dispatch({ type: 'SET_SAVE_ERROR', payload: errorMessage });
                }
            };
            getFeedbackAndSave();
        }
    }, [state.phase, state.isLoading, state.topic, state.transcript, state.speakers, state.user, state.debateFormat]);

    if (!state.appReady) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-gray-900">
                <Icons.LoadingSpinner className="w-12 h-12 text-sky-400" />
            </div>
        );
    }
    
    if (state.phase === DebatePhase.DEBATE) {
        return <DebateScreen topic={state.topic} speakers={state.speakers} onDebateEnd={handleDebateEnd} onStopDebate={handleStopDebate} />;
    }

    const renderContent = () => {
        if (!isSupabaseConfigured) {
            return <LoginScreen />;
        }
        
        if (state.phase === DebatePhase.PASSWORD_RECOVERY) {
            return <UpdatePasswordScreen onSuccess={handleBackToLogin} />;
        }

        if (!state.user) {
            return <LoginScreen />;
        }
        
        switch (state.phase) {
            case DebatePhase.AUTH: // Should not be reached if user exists, but as a fallback
                return <LoginScreen />;
            case DebatePhase.SETUP:
                return <SetupPhase onSetupComplete={handleSetupComplete} />;
            case DebatePhase.PREP:
                return <PrepPhase topic={state.topic} speakers={state.speakers} onPrepComplete={handlePrepComplete} />;
            case DebatePhase.CLUBS:
                return <ClubsScreen user={state.user} onUserUpdate={handleUserUpdate} onBack={handleReturnToSetup} />;
            case DebatePhase.HISTORY:
                if (state.selectedRecordId) {
                    const record = state.history.find(r => r.id === state.selectedRecordId);
                    if (record) {
                        return <FeedbackScreen 
                                 feedback={record.feedback} 
                                 transcript={record.transcript} 
                                 onRestart={()=>{}} 
                                 onViewHistory={()=>{}}
                                 isHistoryView={true}
                                 onBackToHistory={handleBackToHistory}
                               />;
                    }
                }
                return <HistoryScreen history={state.history} onSelectRecord={handleSelectRecord} onBack={handleReturnToSetup} />;
            case DebatePhase.FEEDBACK:
                 if (state.saveError) {
                    return <SaveErrorScreen error={state.saveError} onRestart={handleRestart} />;
                }
                if (state.isLoading || state.history.length === 0 && !state.saveError) {
                    return (
                        <div className="text-center">
                            <Icons.LoadingSpinner className="w-16 h-16 text-sky-400 mx-auto" />
                            <h2 className="mt-4 text-2xl font-bold text-white">The Judge is deliberating...</h2>
                            <p className="text-gray-400">Analyzing transcripts and calculating scores.</p>
                        </div>
                    );
                }
                const latestRecord = state.history[0];
                return <FeedbackScreen feedback={latestRecord.feedback} transcript={latestRecord.transcript} onRestart={handleRestart} onViewHistory={handleViewHistory} />;
            default:
                return <LoginScreen />;
        }
    };
    
    return (
        <div className="min-h-screen bg-gray-900 transition-colors duration-500">
            {!isSupabaseConfigured && <SupabaseWarningBanner />}
            <div className="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
            
            <div className={`relative min-h-screen flex items-center justify-center p-4 ${!isSupabaseConfigured ? 'pt-20' : ''}`}>
                {state.user && state.phase !== DebatePhase.AUTH && state.phase !== DebatePhase.PASSWORD_RECOVERY && <AppHeader user={state.user} onHelp={handleToggleHelp} onLogout={handleLogout} onViewHistory={handleViewHistory} onViewClubs={handleViewClubs} />}
                {renderContent()}
            </div>
            
            {state.isHelpModalOpen && <HelpModal onClose={handleToggleHelp} />}
        </div>
    );
}