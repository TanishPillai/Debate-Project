import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import type { DebateClub, UserProfile } from '../types';
import * as Icons from './icons';

interface ClubsScreenProps {
  user: UserProfile;
  onUserUpdate: (user: UserProfile) => void;
  onBack: () => void;
}

const CreateClubModal: React.FC<{
    user: UserProfile;
    onClose: () => void;
    onClubCreated: (club: DebateClub) => void;
}> = ({ user, onClose, onClubCreated }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!name.trim() || !description.trim()) {
            setError('Please provide a name and description.');
            return;
        }
        setError('');
        setLoading(true);

        const { data: newClub, error: insertError } = await supabase
            .from('clubs')
            .insert([{
                name: name.trim(),
                description: description.trim(),
                creator_id: user.id,
            }])
            .select()
            .single();

        if (insertError || !newClub) {
            setError(insertError?.message || 'Failed to create club.');
            setLoading(false);
            return;
        }
        
        // The user who creates the club automatically joins it.
        const { data: updatedProfile, error: profileError } = await supabase
            .from('profiles')
            .update({ club_id: newClub.id })
            .eq('id', user.id)
            .select()
            .single();
        
        setLoading(false);
        if (profileError) {
            setError(profileError.message);
        } else {
             onClubCreated({ ...newClub, members: updatedProfile ? [{name: updatedProfile.name}] : []});
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 animate-fade-in-up">
            <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-md border border-slate-700 text-center">
                <h2 className="text-2xl font-bold text-white mb-4">Create New Club</h2>
                <div className="space-y-4 text-left">
                    <input type="text" placeholder="Club Name (e.g., The Rhetoric Ring)" value={name} onChange={e => setName(e.target.value)} className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none text-white" />
                    <textarea placeholder="Club Description" value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none text-white" />
                </div>
                {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                <div className="flex justify-center space-x-4 mt-6">
                    <button onClick={onClose} disabled={loading} className="px-8 py-3 bg-slate-600 text-white font-semibold rounded-lg hover:bg-slate-500 transition-colors duration-200 w-full disabled:opacity-50">Cancel</button>
                    <button onClick={handleCreate} disabled={loading} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors duration-200 w-full disabled:opacity-50 flex items-center justify-center">
                        {loading ? <Icons.LoadingSpinner className="w-6 h-6" /> : 'Create'}
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
    );
};


export const ClubsScreen: React.FC<ClubsScreenProps> = ({ user, onUserUpdate, onBack }) => {
    const [clubs, setClubs] = useState<DebateClub[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const fetchClubs = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('clubs')
            .select('*, members:profiles(name)');
        
        if (error) {
            console.error("Error fetching clubs:", error);
        } else {
            setClubs(data as unknown as DebateClub[]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchClubs();
    }, []);
    
    const handleJoinClub = async (clubId: string) => {
        if (user.clubId) return;

        const { data, error } = await supabase
            .from('profiles')
            .update({ club_id: clubId })
            .eq('id', user.id)
            .select()
            .single();

        if (error || !data) {
            console.error("Error joining club", error);
        } else {
            let clubName: string | null = null;
            if(data.club_id) {
                const { data: clubData } = await supabase.from('clubs').select('name').eq('id', data.club_id).single();
                clubName = clubData?.name ?? null;
            }

            onUserUpdate({
                id: data.id,
                name: data.name,
                email: user.email,
                clubId: data.club_id,
                clubName: clubName,
            });
            fetchClubs();
        }
    };

    const handleLeaveClub = async () => {
        if (!user.clubId) return;
        
        const { data, error } = await supabase
            .from('profiles')
            .update({ club_id: null })
            .eq('id', user.id)
            .select()
            .single();

        if (error) {
            console.error("Error leaving club", error);
        } else {
            onUserUpdate({ ...user, clubId: null, clubName: null });
            fetchClubs();
        }
    };
    
    const handleClubCreated = (newClub: DebateClub) => {
        setShowCreateModal(false);
        // We need to update user state after creation
        const updatedUser = {
            ...user,
            clubId: newClub.id,
            clubName: newClub.name,
        };
        onUserUpdate(updatedUser);
        fetchClubs(); // Re-fetch to get the full list with the new club
    };

    return (
        <div className="w-full max-w-5xl mx-auto animate-fade-in">
            {showCreateModal && <CreateClubModal user={user} onClose={() => setShowCreateModal(false)} onClubCreated={handleClubCreated} />}
            <div className="flex justify-between items-center mb-8">
                 <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-500">Debate Clubs</h1>
                 <button onClick={onBack} className="flex items-center space-x-2 px-4 py-2 bg-gray-700 text-gray-200 font-semibold rounded-lg shadow-md hover:bg-gray-600 transition-colors duration-200">
                    <Icons.ArrowLeftIcon className="w-5 h-5"/>
                    <span>Back</span>
                </button>
            </div>
            
            {user.clubId ? (
                <div className="bg-gray-800/70 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-indigo-500/50 mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2">My Club: {user.clubName}</h2>
                    <p className="text-gray-400 mb-4">{clubs.find(c => c.id === user.clubId)?.description}</p>
                    <div className="flex items-center justify-between">
                         <div className="flex items-center space-x-2 text-gray-300">
                            <Icons.UsersIcon className="w-5 h-5" />
                            <span>{clubs.find(c => c.id === user.clubId)?.members.length || 1} Member{clubs.find(c => c.id === user.clubId)?.members.length !== 1 ? 's' : ''}</span>
                        </div>
                        <button onClick={handleLeaveClub} className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors">Leave Club</button>
                    </div>
                </div>
            ) : (
                <div className="bg-gray-800/70 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-gray-700 mb-8 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-white">You are not in a club yet.</h2>
                        <p className="text-gray-400">Join a club to debate with friends or create your own!</p>
                    </div>
                    <button onClick={() => setShowCreateModal(true)} className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-lg shadow-lg hover:bg-indigo-700 transform hover:scale-105 transition-all">Create a Club</button>
                </div>
            )}
            
            <h3 className="text-xl font-bold text-white mb-4">All Clubs</h3>
             <div className="space-y-4">
                {loading ? <Icons.LoadingSpinner className="w-8 h-8 text-sky-400 mx-auto" /> 
                : clubs.length > 0 ? (
                    clubs.map(club => (
                        <div key={club.id} className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 flex justify-between items-center hover:bg-gray-800 transition-colors">
                            <div>
                                <h4 className="font-semibold text-white text-lg">{club.name}</h4>
                                <p className="text-sm text-gray-400 mt-1 max-w-lg">{club.description}</p>
                                <div className="flex items-center space-x-2 text-gray-500 text-xs mt-2">
                                    <Icons.UsersIcon className="w-4 h-4" />
                                    <span>{club.members.length} Member{club.members.length !== 1 ? 's' : ''}</span>
                                </div>
                            </div>
                            <div className="text-right ml-4 flex-shrink-0">
                                {user.clubId === club.id ? (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-900 text-green-300">
                                        <Icons.CheckIcon className="w-4 h-4 mr-2"/>
                                        Member
                                    </span>
                                ) : (
                                    <button onClick={() => handleJoinClub(club.id)} disabled={!!user.clubId} className="px-4 py-2 w-24 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors">
                                        Join
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-gray-700">
                        <p className="text-gray-400">There are no clubs yet.</p>
                        <p className="text-gray-500 mt-1">Why not be the first to create one?</p>
                    </div>
                )}
            </div>
             <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in {
                    animation: fade-in 0.5s ease-out forwards;
                }
            `}</style>
        </div>
    );
};