import React, { useState, useEffect, useRef } from 'react';
import { logger, LogEntry } from '../services/logger';
import { Terminal, X, Trash2, Copy, Bug, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';

export const DebugConsole: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [hasNewLogs, setHasNewLogs] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const lastCount = useRef(0);

    useEffect(() => {
        const update = () => {
            const currentLogs = logger.getLogs();
            setLogs([...currentLogs]); // Trigger re-render
            
            if (currentLogs.length > lastCount.current && !isOpen) {
                setHasNewLogs(true);
            }
            lastCount.current = currentLogs.length;
        };
        
        // Initial load
        update();
        
        return logger.subscribe(update);
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) setHasNewLogs(false);
    }, [isOpen]);

    const handleCopy = () => {
        const text = logs.map(l => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}`).join('\n');
        navigator.clipboard.writeText(text);
    };

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'error': return 'text-red-400';
            case 'warn': return 'text-yellow-400';
            case 'debug': return 'text-purple-400';
            default: return 'text-slate-300';
        }
    };

    return (
        <>
            {/* Toggle Button */}
            <button 
                onClick={() => setIsOpen(true)}
                className={clsx(
                    "fixed bottom-20 right-4 z-50 p-3 rounded-full shadow-lg transition-all active:scale-95 group",
                    hasNewLogs ? "bg-amber-500 text-white animate-bounce" : "bg-slate-800 text-slate-400 hover:text-white opacity-50 hover:opacity-100"
                )}
                title="Open Debug Console"
            >
                <Bug size={20} />
                {hasNewLogs && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>}
            </button>

            {/* Console Window */}
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center pointer-events-none">
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto" onClick={() => setIsOpen(false)} />
                    
                    <div className="bg-slate-900 w-full sm:w-[800px] h-[70vh] sm:rounded-xl shadow-2xl flex flex-col pointer-events-auto animate-in slide-in-from-bottom-10 border border-slate-700">
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-950 sm:rounded-t-xl">
                            <div className="flex items-center gap-2">
                                <Terminal size={18} className="text-slate-400" />
                                <h3 className="text-sm font-bold text-slate-200 font-mono">System Logs</h3>
                                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-400 font-mono">
                                    {logs.length} entries
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={handleCopy} className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white" title="Copy to Clipboard">
                                    <Copy size={16} />
                                </button>
                                <button onClick={() => logger.clear()} className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-red-400" title="Clear Logs">
                                    <Trash2 size={16} />
                                </button>
                                <div className="w-px h-4 bg-slate-700 mx-1"></div>
                                <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white">
                                    <ChevronDown size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Logs Area */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-1 font-mono text-xs">
                            {logs.length === 0 && (
                                <div className="text-center text-slate-600 italic py-8">No logs recorded...</div>
                            )}
                            {logs.map((log) => (
                                <div key={log.id} className="flex gap-2 hover:bg-white/5 p-0.5 rounded leading-relaxed break-all">
                                    <span className="text-slate-500 shrink-0 select-none">[{log.timestamp}]</span>
                                    <span className={clsx("font-bold w-12 shrink-0 uppercase select-none", getLevelColor(log.level))}>
                                        {log.level}
                                    </span>
                                    <span className="text-slate-300 whitespace-pre-wrap">{log.message}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};