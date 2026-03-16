import React, { useState, useEffect, useRef } from 'react';
import { X, Search, PlusCircle, User } from 'lucide-react';
import { usePartyStore } from '../../../stores/partyStore';
import { useTransactionStore } from '../../../stores/transactionStore';
import { formatINRShort } from '../../../utils/currency';

export default function PartyField({ value, onChange, label = "Party", required = false }) {
  const { search, add, parties } = usePartyStore();
  const { getPartyBalance } = useTransactionStore();
  
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [balances, setBalances] = useState({});
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPartyName, setSelectedPartyName] = useState('');
  
  const wrapperRef = useRef(null);

  // If a value is provided externally, try to resolve its name
  useEffect(() => {
    if (value) {
      const party = parties.find(p => p.id === value);
      if (party) {
        setSelectedPartyName(party.name);
      }
    } else {
      setSelectedPartyName('');
      setQuery('');
    }
  }, [value, parties]);

  // Click outside listener to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced Search
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const matches = await search(query);
        setResults(matches);
        
        // Fetch balances for matches
        const newBalances = { ...balances };
        let hasNew = false;
        
        for (const party of matches) {
          if (newBalances[party.id] === undefined) {
            newBalances[party.id] = await getPartyBalance(party.id);
            hasNew = true;
          }
        }
        
        if (hasNew) {
          setBalances(newBalances);
        }
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, isOpen, search]); // Removed balances from dependency to avoid infinite loops

  // Handlers
  const handleSelect = (party) => {
    setSelectedPartyName(party.name);
    setQuery('');
    setIsOpen(false);
    onChange(party.id, party.name);
  };

  const handleAddNew = async () => {
    if (!query.trim()) return;
    try {
      const trimmedName = query.trim();
      const newId = await add({ name: trimmedName });
      setSelectedPartyName(trimmedName);
      setQuery('');
      setIsOpen(false);
      onChange(newId, trimmedName);
    } catch (err) {
      console.error("Failed to add new party:", err);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setSelectedPartyName('');
    setQuery('');
    setIsOpen(false);
    onChange(null, null);
  };

  const exactMatch = results.find(p => p.name.toLowerCase() === query.trim().toLowerCase());

  return (
    <div className="px-4 pb-4" ref={wrapperRef}>
      <label className="block text-sm font-medium text-primary mb-1">
        {label} {!required && <span className="text-primary/50 text-xs font-normal ml-1">(Optional)</span>}
      </label>
      
      <div className="relative">
        {/* Selected State View */}
        {value && selectedPartyName ? (
          <div 
            onClick={() => setIsOpen(true)}
            className="w-full p-3 bg-[#F4F8FA] border border-[#B8D0E8] rounded-[12px] flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <User className="text-primary/60 flex-shrink-0" size={18} />
              <span className="font-medium text-primary truncate">{selectedPartyName}</span>
            </div>
            <button 
              type="button" 
              onClick={handleClear}
              className="p-1 text-primary/40 hover:text-primary transition-colors flex-shrink-0"
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          /* Input View */
          <div className="relative flex items-center w-full bg-[#F4F8FA] border border-[#B8D0E8] rounded-[12px] overflow-hidden focus-within:ring-1 focus-within:ring-primary">
            <div className="pl-3 text-primary/50">
              <Search size={18} />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (!isOpen) setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder="Search or add party..."
              className="w-full p-3 bg-transparent focus:outline-none text-primary placeholder-primary/40"
            />
            {query && (
              <button 
                type="button" 
                onClick={() => setQuery('')}
                className="pr-3 text-primary/40 hover:text-primary transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}

        {/* Dropdown Menu */}
        {isOpen && !value && (
          <div className="absolute z-10 top-full left-0 right-0 mt-2 bg-white border border-[#B8D0E8] rounded-[12px] shadow-lg max-h-[250px] overflow-y-auto">
            {isSearching && results.length === 0 ? (
               <div className="p-4 text-center text-sm text-primary/60">Searching...</div>
            ) : (
              <div className="py-1">
                {results.map((party) => {
                  const bal = balances[party.id] || 0;
                  const absBal = Math.abs(bal);
                  const balColor = bal >= 0 ? 'text-green-600' : 'text-red-500';
                  const balPrefix = bal >= 0 ? 'You Get' : 'You Give';
                  
                  return (
                    <button
                      key={party.id}
                      type="button"
                      onClick={() => handleSelect(party)}
                      className="w-full text-left px-4 py-3 hover:bg-primary/5 flex items-center justify-between transition-colors"
                    >
                      <span className="font-medium text-primary truncate pr-4">{party.name}</span>
                      {absBal > 0 && (
                        <div className="text-right flex-shrink-0">
                          <p className="text-[10px] text-primary/60 uppercase tracking-wider mb-0.5">{balPrefix}</p>
                          <p className={`text-xs font-semibold ${balColor}`}>{formatINRShort(absBal)}</p>
                        </div>
                      )}
                    </button>
                  );
                })}

                {/* Add New Option */}
                {query.trim().length > 0 && !exactMatch && (
                  <button
                    type="button"
                    onClick={handleAddNew}
                    className="w-full text-left px-4 py-3 hover:bg-primary/5 flex items-center gap-2 transition-colors border-t border-primary/5"
                  >
                    <PlusCircle size={16} className="text-primary" />
                    <span className="text-sm font-medium text-primary">
                      Add <span className="font-bold">"{query.trim()}"</span> as new party
                    </span>
                  </button>
                )}
                
                {!isSearching && results.length === 0 && query.trim().length === 0 && (
                   <div className="p-4 text-center text-sm text-primary/60">Type to search parties...</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
