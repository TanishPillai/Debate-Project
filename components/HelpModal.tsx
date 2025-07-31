import React, { useEffect } from 'react';
import * as Icons from './icons';

interface HelpModalProps {
  onClose: () => void;
}

const faqs = [
  {
    question: "How does the debate format work?",
    answer: "This is a 2v2 Parliamentary-style debate. Team A (Government) speaks first, followed by Team B (Opposition). The speaking order is Prime Minister (A), Leader of Opposition (B), Deputy PM (A), Deputy Leader of Opposition (B), and a final rebuttal from the Prime Minister (A)."
  },
  {
    question: "What are the speech times?",
    answer: "The Prime Minister's first speech is 5 minutes. All other main speeches are 8 minutes. The final PM's Rebuttal is 3 minutes. There's a 15-second grace period between speeches."
  },
  {
    question: "How is the debate scored?",
    answer: "The AI Judge scores you on three categories, each out of 10 points: Speaking Points (clarity, tone, persuasion), Validity of Information (logic, evidence, rebuttal), and Sportsmanship (respectful conduct)."
  },
    {
    question: "What is the 'Ask the Judge' button for?",
    answer: "During the debate, you can pause and ask the AI Judge for neutral clarification on facts, rules, or concepts related to the topic. The judge will not give you arguments or take a side."
  },
  {
    question: "How does the AI work?",
    answer: "The AI debaters and judge are powered by Google's Gemini models. They are trained to understand debate context, generate logical arguments, and provide constructive feedback. The AI voices are generated using your browser's built-in text-to-speech engine."
  }
];

const FAQItem: React.FC<{ faq: { question: string; answer: string } }> = ({ faq }) => (
    <details className="group border-b border-gray-700 py-4">
        <summary className="flex items-center justify-between cursor-pointer list-none">
            <span className="font-semibold text-white">{faq.question}</span>
            <Icons.ChevronDownIcon className="w-5 h-5 text-gray-400 transition-transform duration-300 group-open:rotate-180" />
        </summary>
        <p className="text-gray-300 mt-2 pr-4">{faq.answer}</p>
    </details>
);

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
           if (event.key === 'Escape') {
              onClose();
           }
        };
        window.addEventListener('keydown', handleEsc);
        return () => {
           window.removeEventListener('keydown', handleEsc);
        };
    }, [onClose]);

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" 
            role="dialog" 
            aria-modal="true" 
            aria-labelledby="help-modal-title"
            onClick={onClose}
        >
            <div 
                className="bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-2xl border border-gray-700 flex flex-col animate-fade-in-up" 
                style={{maxHeight: '90vh'}}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex-shrink-0">
                    <div className="flex justify-between items-center mb-4">
                        <h2 id="help-modal-title" className="text-2xl font-bold text-white flex items-center">
                            <Icons.QuestionMarkCircleIcon className="w-7 h-7 mr-3 text-sky-400"/>
                            Frequently Asked Questions
                        </h2>
                        <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-white">
                            <Icons.XIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>
                
                <div className="flex-grow overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-900">
                    {faqs.map((faq, index) => (
                        <FAQItem key={index} faq={faq} />
                    ))}
                </div>
            </div>
            <style>{`
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};