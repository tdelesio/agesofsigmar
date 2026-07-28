'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, UploadCloud, FileText, CheckCircle2, 
  AlertCircle, Key, Sparkles, Shield, Heart, ShieldAlert,
  Sword, User, Trash, Plus, Save, Edit, RefreshCw, Layers,
  Activity, Zap, ShieldCheck, Download, Upload, Copy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DEFAULT_FACTIONS } from '../data/default-factions';
import { Faction, Unit, Weapon, Ability } from '../types';

const getAbilityBgClass = (ability: Partial<Ability>) => {
  const phase = ability.phase;
  const appliedPhase = ability.passiveAppliedPhase;

  if (phase === 'passive' && !appliedPhase) {
    // Unscheduled passive: distinct Indigo/violet color to differentiate from End Phase (purple)
    return "bg-[#161a35] border-indigo-500/35 shadow-sm"; 
  }

  const targetPhase = phase === 'passive' ? appliedPhase : phase;

  switch (targetPhase) {
    case 'start':
      return "bg-[#181c25] border-zinc-700/60 shadow-sm"; // Charcoal/slate
    case 'hero':
      return "bg-[#272417] border-yellow-500/30 shadow-sm"; // Premium dark gold/yellow
    case 'movement':
      return "bg-[#131f2c] border-blue-500/30 shadow-sm"; // Premium dark blue
    case 'shooting':
      return "bg-[#11241a] border-emerald-500/30 shadow-sm"; // Premium dark green
    case 'charge':
      return "bg-[#291e14] border-orange-500/30 shadow-sm"; // Premium dark orange
    case 'combat':
      return "bg-[#29161a] border-rose-500/30 shadow-sm"; // Premium dark rose/red
    case 'end':
      return "bg-[#21152a] border-purple-500/30 shadow-sm"; // Premium dark purple
    default:
      return "bg-[#0f121a] border-[#222834]";
  }
};

const mergeFactions = (defaults: Faction[], custom: Faction[]): Faction[] => {
  const map = new Map<string, Faction>();
  defaults.forEach(f => map.set(f.id, f));
  custom.forEach(f => map.set(f.id, f));
  return Array.from(map.values());
};

export default function AdminPage() {
  const router = useRouter();

  // State
  const [apiKey, setApiKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  
  // Custom non-blocking modal states
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ message: string; onConfirm: () => void } | null>(null);

  const showToast = (message: string, type: 'error' | 'success' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => prev?.message === message ? null : prev);
    }, 4500);
  };
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  // App custom factions list
  const [customFactions, setCustomFactions] = useState<Faction[]>([]);
  
  // Editor state
  const [editorFaction, setEditorFaction] = useState<Faction | null>(null);
  const [isEditing, setIsEditing] = useState(false); // true if editor is open
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
  
  // Status hooks
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [progressMsg, setProgressMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Active editor tabs
  const [editorTab, setEditorTab] = useState<'basic' | 'traits' | 'units'>('basic');
  const [selectedUnitIndex, setSelectedUnitIndex] = useState<number>(0);

  // Load configuration and existing custom factions on mount
  const saveFactionsToDisk = async (factions: Faction[]) => {
    try {
      await fetch('/api/save-factions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ factions }),
      });
    } catch (err) {
      console.error('Error syncing custom factions to disk:', err);
    }
  };

  const handleManualSyncToDisk = async () => {
    try {
      const response = await fetch('/api/save-factions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ factions: customFactions }),
      });
      const data = await response.json();
      if (data.warning === 'ReadOnlyEnvironment') {
        showToast('Local disk write bypassed on deployed production server.', 'error');
      } else if (!response.ok) {
        showToast('Failed to save to disk: ' + (data.error || 'Unknown error'), 'error');
      } else {
        showToast('Successfully synced custom factions to static default-factions.json codebase!', 'success');
      }
    } catch (err: any) {
      showToast('Error saving to disk: ' + err.message, 'error');
    }
  };

  // Load configuration and existing custom factions on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('user_gemini_api_key') || '';
    setApiKey(savedKey);
    if (!savedKey) {
      setShowKeyInput(true);
    }

    const savedFactionsStr = localStorage.getItem('custom_factions');
    if (savedFactionsStr) {
      try {
        const parsed = JSON.parse(savedFactionsStr);
        const merged = mergeFactions(DEFAULT_FACTIONS, parsed);
        setCustomFactions(merged);
      } catch (err) {
        console.error('Failed to load custom factions:', err);
        setCustomFactions(DEFAULT_FACTIONS);
      }
    } else {
      setCustomFactions(DEFAULT_FACTIONS);
    }
  }, []);

  const handleExportBackup = () => {
    try {
      const db = localStorage.getItem('custom_factions') || '[]';
      const blob = new Blob([db], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `spearhead-factions-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Backup file exported successfully!');
    } catch (err) {
      showToast('Failed to export backup: ' + err, 'error');
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (!Array.isArray(parsed)) {
          showToast('Invalid backup file format. Expected a JSON array of Factions.', 'error');
          return;
        }
        
        // Validate schemas
        if (parsed.length > 0) {
          const first = parsed[0];
          if (!first.id || !first.name || !Array.isArray(first.units)) {
            showToast('Invalid backup file content. Faction schemas do not match.', 'error');
            return;
          }
        }

        setConfirmModal({
          message: `Are you sure you want to restore ${parsed.length} factions? This will replace your current loaded factions database.`,
          onConfirm: () => {
            localStorage.setItem('custom_factions', JSON.stringify(parsed));
            setCustomFactions(parsed);
            saveFactionsToDisk(parsed);
            showToast('Backup restored successfully!');
          }
        });
      } catch (err) {
        showToast('Failed to restore backup: ' + err, 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('user_gemini_api_key', key);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
      } else {
        showToast('Please upload a PDF file.', 'error');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const runProgressSimulation = async () => {
    const messages = [
      'Reading PDF file...',
      'Encoding document to Base64 format...',
      'Connecting to Gemini API...',
      'Executing self-healing endpoint handshake...',
      'Extracting Battle Traits rules...',
      'Parsing Regiment Abilities...',
      'Mapping Enhancements list...',
      'Scanning Unit sheets and stats...',
      'Parsing weapon tables (attacks, hit, wound, rend, damage)...',
      'Assembling CMS rules schema...'
    ];

    for (let i = 0; i < messages.length; i++) {
      setProgressMsg(messages[i]);
      await new Promise((resolve) => setTimeout(resolve, i === 3 ? 1200 : 400));
    }
  };

  // PDF scanning execution
  const handleScan = async () => {
    if (!file) return;

    setStatus('loading');
    setErrorMsg('');

    // Start progress messages in parallel
    const simulationPromise = runProgressSimulation();

    try {
      const base64Data = await fileToBase64(file);
      
      const response = await fetch('/api/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdfBase64: base64Data,
          apiKey: apiKey.trim() || undefined,
        }),
      });

      const data = await response.json();
      await simulationPromise;

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Server returned an error.');
      }

      const incoming = data.factions || (data.faction ? [data.faction] : []);

      if (incoming.length === 0) {
        throw new Error('No valid army rules could be extracted from the PDF.');
      }

      if (incoming.length === 1) {
        // Single army: Load in visual editor for review & fine-tuning
        setEditorFaction(incoming[0]);
        setEditorMode('create');
        setIsEditing(true);
        setEditorTab('basic');
        setSelectedUnitIndex(0);
        setStatus('idle');
        setFile(null);
      } else {
        // Multiple armies: Bulk save immediately without blocking visual confirmation
        const updatedFactions = [...customFactions];
        
        incoming.forEach((fac: any) => {
          // Generate clean unique ID
          const finalId = fac.id || 'custom-' + (fac.spearheadName || fac.name).toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
          const cleanFac = {
            ...fac,
            id: finalId
          };
          
          // Check if already exists, else append
          const existingIdx = updatedFactions.findIndex(f => f.id === cleanFac.id);
          if (existingIdx > -1) {
            updatedFactions[existingIdx] = cleanFac;
          } else {
            updatedFactions.push(cleanFac);
          }
        });

        localStorage.setItem('custom_factions', JSON.stringify(updatedFactions));
        setCustomFactions(updatedFactions);
        saveFactionsToDisk(updatedFactions);
        setStatus('idle');
        setFile(null);

        const armyNames = incoming.map((f: any) => f.spearheadName || f.name).join(', ');
        showToast(`Successfully bulk-saved ${incoming.length} armies: ${armyNames}! Edit them in the list below.`, 'success');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'An unexpected error occurred while parsing the faction PDF.');
      setStatus('error');
    }
  };

  // CRUD: Initiate new blank faction
  const handleCreateNewBlank = () => {
    const blankFaction: Faction = {
      id: 'custom-' + Date.now(),
      name: 'New Custom Faction',
      spearheadName: 'New Army Detachment',
      battleTraits: [
        { id: 'trait-1', name: 'First Battle Trait', effect: 'Insert rule effect here.', phase: 'passive', timing: 'Passive', once: 'none' }
      ],
      regimentAbilities: [
        { id: 'regiment-1', name: 'Regiment Ability', effect: 'Insert regiment rule here.', phase: 'passive', timing: 'Passive', once: 'none' }
      ],
      enhancements: [
        { id: 'enhancement-1', name: 'General Enhancement', effect: 'Insert general trait here.', phase: 'passive', timing: 'Passive', once: 'none' }
      ],
      units: [
        {
          id: 'unit-1',
          name: 'First Unit',
          move: 5,
          control: 1,
          health: 1,
          save: 4,
          ward: 0,
          isHero: false,
          weapons: [
            { name: 'Melee Weapon', range: 'Melee', attacks: '2', hit: 3, wound: 3, rend: 0, damage: '1' }
          ],
          abilities: []
        }
      ]
    };

    setEditorFaction(blankFaction);
    setEditorMode('create');
    setIsEditing(true);
    setEditorTab('basic');
    setSelectedUnitIndex(0);
  };

  // CRUD: Load existing custom faction for editing
  const handleEditFaction = (faction: Faction) => {
    setEditorFaction(JSON.parse(JSON.stringify(faction))); // Deep copy
    setEditorMode('edit');
    setIsEditing(true);
    setEditorTab('basic');
    setSelectedUnitIndex(0);
  };

  // CRUD: Delete specific custom faction
  const handleDeleteFaction = (id: string) => {
    const faction = customFactions.find(f => f.id === id);
    setConfirmModal({
      message: `Are you sure you want to delete "${faction?.name || 'this custom faction'}"? This cannot be undone.`,
      onConfirm: () => {
        const updated = customFactions.filter(f => f.id !== id);
        setCustomFactions(updated);
        localStorage.setItem('custom_factions', JSON.stringify(updated));
        saveFactionsToDisk(updated);
        showToast('Faction deleted successfully!');
      }
    });
  };

  // CRUD: Save visual editor state back into localStorage
  const handleSaveEditorData = () => {
    if (!editorFaction) return;

    // Standardize ID string
    const finalFaction = {
      ...editorFaction,
      id: editorFaction.id || 'custom-' + Date.now()
    };

    const updatedFactions = [...customFactions];
    const existingIndex = updatedFactions.findIndex(f => f.id === finalFaction.id);

    if (existingIndex > -1) {
      updatedFactions[existingIndex] = finalFaction;
    } else {
      updatedFactions.push(finalFaction);
    }

    localStorage.setItem('custom_factions', JSON.stringify(updatedFactions));
    setCustomFactions(updatedFactions);
    saveFactionsToDisk(updatedFactions);
    setIsEditing(false);
    setEditorFaction(null);
    showToast(`Faction "${finalFaction.name}" saved successfully to your roster!`, 'success');
  };

  // Editor updating state sub-handlers
  const updateFactionField = (field: keyof Faction, value: any) => {
    if (!editorFaction) return;
    setEditorFaction({ ...editorFaction, [field]: value });
  };

  const updateAbility = (
    type: 'battleTraits' | 'regimentAbilities' | 'enhancements',
    index: number,
    field: keyof Ability,
    value: any
  ) => {
    if (!editorFaction) return;
    const updatedList = [...editorFaction[type]];
    updatedList[index] = { ...updatedList[index], [field]: value };
    setEditorFaction({ ...editorFaction, [type]: updatedList });
  };

  const addAbility = (type: 'battleTraits' | 'regimentAbilities' | 'enhancements') => {
    if (!editorFaction) return;
    const newAbility: Ability = {
      id: `${type}-${Date.now()}-${Math.floor(Math.random() * 100)}`,
      name: 'New Ability',
      effect: 'Ability effect text.',
      phase: 'passive',
      timing: 'Passive',
      once: 'none'
    };
    setEditorFaction({ ...editorFaction, [type]: [...editorFaction[type], newAbility] });
  };

  const removeAbility = (type: 'battleTraits' | 'regimentAbilities' | 'enhancements', index: number) => {
    if (!editorFaction) return;
    const updatedList = editorFaction[type].filter((_, i) => i !== index);
    setEditorFaction({ ...editorFaction, [type]: updatedList });
  };

  // Unit CMS management sub-handlers
  const updateUnitField = (index: number, field: keyof Unit, value: any) => {
    if (!editorFaction) return;
    const updatedUnits = [...editorFaction.units];
    updatedUnits[index] = { ...updatedUnits[index], [field]: value };
    setEditorFaction({ ...editorFaction, units: updatedUnits });
  };

  const addUnit = () => {
    if (!editorFaction) return;
    const newUnit: Unit = {
      id: `unit-${Date.now()}`,
      name: 'New Unit Roster',
      move: 5,
      control: 1,
      health: 1,
      save: 5,
      ward: 0,
      isHero: false,
      weapons: [],
      abilities: []
    };
    setEditorFaction({ ...editorFaction, units: [...editorFaction.units, newUnit] });
    setSelectedUnitIndex(editorFaction.units.length);
  };

  const duplicateUnit = (index: number) => {
    if (!editorFaction) return;
    const unitToCopy = editorFaction.units[index];
    if (!unitToCopy) return;
    const duplicated = JSON.parse(JSON.stringify(unitToCopy));
    duplicated.id = `unit-${Date.now()}`;
    duplicated.name = `${duplicated.name} (Copy)`;
    setEditorFaction({ ...editorFaction, units: [...editorFaction.units, duplicated] });
    setSelectedUnitIndex(editorFaction.units.length);
  };

  const removeUnit = (index: number) => {
    if (!editorFaction) return;
    if (editorFaction.units.length <= 1) {
      showToast('A faction must have at least one unit roster.', 'error');
      return;
    }
    const updatedUnits = editorFaction.units.filter((_, i) => i !== index);
    setEditorFaction({ ...editorFaction, units: updatedUnits });
    setSelectedUnitIndex(Math.max(0, index - 1));
  };

  // Unit Weapons Sub-handlers
  const updateWeapon = (unitIndex: number, weaponIndex: number, field: keyof Weapon, value: any) => {
    if (!editorFaction) return;
    const updatedUnits = [...editorFaction.units];
    const updatedWeapons = [...updatedUnits[unitIndex].weapons];
    updatedWeapons[weaponIndex] = { ...updatedWeapons[weaponIndex], [field]: value };
    updatedUnits[unitIndex] = { ...updatedUnits[unitIndex], weapons: updatedWeapons };
    setEditorFaction({ ...editorFaction, units: updatedUnits });
  };

  const addWeapon = (unitIndex: number) => {
    if (!editorFaction) return;
    const updatedUnits = [...editorFaction.units];
    const newWeapon: Weapon = {
      name: 'Melee Weapon',
      range: 'Melee',
      attacks: '2',
      hit: 3,
      wound: 3,
      rend: 0,
      damage: '1'
    };
    updatedUnits[unitIndex] = { 
      ...updatedUnits[unitIndex], 
      weapons: [...updatedUnits[unitIndex].weapons, newWeapon] 
    };
    setEditorFaction({ ...editorFaction, units: updatedUnits });
  };

  const removeWeapon = (unitIndex: number, weaponIndex: number) => {
    if (!editorFaction) return;
    const updatedUnits = [...editorFaction.units];
    const updatedWeapons = updatedUnits[unitIndex].weapons.filter((_, i) => i !== weaponIndex);
    updatedUnits[unitIndex] = { ...updatedUnits[unitIndex], weapons: updatedWeapons };
    setEditorFaction({ ...editorFaction, units: updatedUnits });
  };

  // Unit Abilities Sub-handlers
  const updateUnitAbility = (unitIndex: number, abilityIndex: number, field: keyof Ability, value: any) => {
    if (!editorFaction) return;
    const updatedUnits = [...editorFaction.units];
    const updatedAbilities = [...updatedUnits[unitIndex].abilities];
    updatedAbilities[abilityIndex] = { ...updatedAbilities[abilityIndex], [field]: value };
    updatedUnits[unitIndex] = { ...updatedUnits[unitIndex], abilities: updatedAbilities };
    setEditorFaction({ ...editorFaction, units: updatedUnits });
  };

  const addUnitAbility = (unitIndex: number) => {
    if (!editorFaction) return;
    const updatedUnits = [...editorFaction.units];
    const newAbility: Ability = {
      id: `unit-ability-${Date.now()}`,
      name: 'Unit Ability',
      effect: 'Execute rule detail.',
      phase: 'passive',
      timing: 'Passive',
      once: 'none'
    };
    updatedUnits[unitIndex] = { 
      ...updatedUnits[unitIndex], 
      abilities: [...updatedUnits[unitIndex].abilities, newAbility] 
    };
    setEditorFaction({ ...editorFaction, units: updatedUnits });
  };

  const removeUnitAbility = (unitIndex: number, abilityIndex: number) => {
    if (!editorFaction) return;
    const updatedUnits = [...editorFaction.units];
    const updatedAbilities = updatedUnits[unitIndex].abilities.filter((_, i) => i !== abilityIndex);
    updatedUnits[unitIndex] = { ...updatedUnits[unitIndex], abilities: updatedAbilities };
    setEditorFaction({ ...editorFaction, units: updatedUnits });
  };

  return (
    <div className="min-h-screen bg-[#0f121a] flex flex-col font-sans select-none antialiased">
      {/* Premium Header banner */}
      <header className="border-b border-[#222834] bg-[#151923]/80 backdrop-blur-xl sticky top-0 z-50 py-5 px-6 shadow-md">
        <div className="container mx-auto max-w-5xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-7 w-7 text-amber-500" />
            <div>
              <h1 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                Admin CMS Dashboard <span className="text-amber-500 text-xs font-medium lowercase italic px-1.5 py-0.5 bg-amber-500/10 rounded">portal</span>
              </h1>
              <p className="text-gray-400 text-xs">Manage, create, and refine Warhammer Spearhead custom rules</p>
            </div>
          </div>
          <Link href="/">
            <Button size="sm" variant="outline" className="border-[#2d3748] text-gray-300 hover:text-white hover:bg-[#1d2433] text-xs">
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Setup
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow container mx-auto px-4 py-8 max-w-5xl">
        
        {/* Editor Screen View */}
        {isEditing && editorFaction ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-[#151923] p-4 rounded-xl border border-[#222834]">
              <div>
                <Badge variant="outline" className="border-amber-500/30 text-amber-500 mb-1">Faction Editor</Badge>
                <h2 className="text-xl font-black text-white">{editorFaction.name || 'New Custom Faction'}</h2>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => { setIsEditing(false); setEditorFaction(null); }} className="text-xs text-gray-400 hover:text-white">
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSaveEditorData} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg">
                  <Save className="h-4 w-4 mr-1.5" /> Save Faction Rules
                </Button>
              </div>
            </div>

            {/* Editor Tabs Nav */}
            <div className="flex gap-2 border-b border-[#222834] pb-2">
              <Button 
                size="sm" 
                variant={editorTab === 'basic' ? 'default' : 'ghost'} 
                onClick={() => setEditorTab('basic')}
                className={`text-xs ${editorTab === 'basic' ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <Activity className="h-3.5 w-3.5 mr-1" /> Basic Info
              </Button>
              <Button 
                size="sm" 
                variant={editorTab === 'traits' ? 'default' : 'ghost'} 
                onClick={() => setEditorTab('traits')}
                className={`text-xs ${editorTab === 'traits' ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <Layers className="h-3.5 w-3.5 mr-1" /> Faction Strategies
              </Button>
              <Button 
                size="sm" 
                variant={editorTab === 'units' ? 'default' : 'ghost'} 
                onClick={() => setEditorTab('units')}
                className={`text-xs ${editorTab === 'units' ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <Sword className="h-3.5 w-3.5 mr-1" /> Unit Rosters ({editorFaction.units.length})
              </Button>
            </div>

            {/* TAB 1: BASIC INFORMATION */}
            {editorTab === 'basic' && (
              <Card className="border-[#222834] bg-[#151923] text-white">
                <CardHeader>
                  <CardTitle className="text-md font-bold">Main Descriptions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Faction ID (lowercase, unique string)</label>
                      <Input 
                        value={editorFaction.id} 
                        onChange={(e) => updateFactionField('id', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                        className="bg-[#0f121a] border-[#2d3748] text-white text-xs"
                        disabled={editorMode === 'edit'}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Faction Name</label>
                      <Input 
                        value={editorFaction.name} 
                        onChange={(e) => updateFactionField('name', e.target.value)}
                        className="bg-[#0f121a] border-[#2d3748] text-white text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Spearhead Detachment Detailing (e.g. Warglutt Marauders)</label>
                    <Input 
                      value={editorFaction.spearheadName} 
                      onChange={(e) => updateFactionField('spearheadName', e.target.value)}
                      className="bg-[#0f121a] border-[#2d3748] text-white text-xs"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* TAB 2: STRATEGIES & TRAITS */}
            {editorTab === 'traits' && (
              <div className="space-y-6">
                
                {/* Battle Traits Section */}
                <Card className="border-[#222834] bg-[#151923] text-white">
                  <CardHeader className="flex flex-row justify-between items-center border-b border-[#222834] py-4">
                    <div>
                      <CardTitle className="text-md font-bold text-amber-500">Battle Traits</CardTitle>
                      <CardDescription className="text-gray-400 text-xs">Faction-wide rules active all match long</CardDescription>
                    </div>
                    <Button size="sm" onClick={() => addAbility('battleTraits')} className="bg-[#222834] hover:bg-[#2d3748] text-xs">
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Trait
                    </Button>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    {editorFaction.battleTraits.map((trait, index) => (
                      <div key={trait.id} className={`p-4 rounded-lg border transition-all space-y-3 relative ${getAbilityBgClass(trait)}`}>
                        <Button size="sm" variant="ghost" onClick={() => removeAbility('battleTraits', index)} className="absolute top-2 right-2 text-red-400 hover:text-red-500 hover:bg-red-500/10 h-8 w-8 p-0">
                          <Trash className="h-3.5 w-3.5" />
                        </Button>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] text-gray-500 font-bold uppercase">Trait Name</label>
                            <Input value={trait.name} onChange={(e) => updateAbility('battleTraits', index, 'name', e.target.value)} className="bg-[#151923] border-[#2c3547] text-xs h-8" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-gray-500 font-bold uppercase">Timing Detail (e.g. Hero Phase)</label>
                            <Input value={trait.timing} onChange={(e) => updateAbility('battleTraits', index, 'timing', e.target.value)} className="bg-[#151923] border-[#2c3547] text-xs h-8" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-gray-500 font-bold uppercase">Trigger Phase</label>
                            <select 
                              value={trait.phase} 
                              onChange={(e) => updateAbility('battleTraits', index, 'phase', e.target.value)}
                              className="w-full bg-[#151923] border border-[#2c3547] text-xs h-8 rounded px-2 text-white"
                            >
                              <option value="start">Start of Turn</option>
                              <option value="hero">Hero Phase</option>
                              <option value="movement">Movement Phase</option>
                              <option value="shooting">Shooting Phase</option>
                              <option value="charge">Charge Phase</option>
                              <option value="combat">Combat Phase</option>
                              <option value="end">End of Turn</option>
                              <option value="passive">Passive</option>
                            </select>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-500 font-bold uppercase">Rule Effect Text</label>
                          <textarea value={trait.effect} onChange={(e) => updateAbility('battleTraits', index, 'effect', e.target.value)} className="w-full rounded-md border border-[#2c3547] bg-[#151923] p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 min-h-16" />
                        </div>

                        {/* Custom Passive Applied Phase & Defensive Fields */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-1 border-t border-[#222834]/40 mt-2">
                          {trait.phase === 'passive' && (
                            <div className="flex-1 space-y-1">
                              <label className="text-[10px] text-amber-500 font-extrabold uppercase tracking-wide">Applied Active Phase</label>
                              <select 
                                value={trait.passiveAppliedPhase || ''} 
                                onChange={(e) => updateAbility('battleTraits', index, 'passiveAppliedPhase', e.target.value || undefined)}
                                className="w-full bg-[#151923] border border-[#2c3547] text-xs h-8 rounded px-2 text-white"
                              >
                                <option value="">None (Always Active)</option>
                                <option value="start">Start of Turn</option>
                                <option value="hero">Hero Phase</option>
                                <option value="movement">Movement Phase</option>
                                <option value="shooting">Shooting Phase</option>
                                <option value="charge">Charge Phase</option>
                                <option value="combat">Combat Phase</option>
                                <option value="end">End of Turn</option>
                              </select>
                            </div>
                          )}
                          <div className="flex items-center gap-2 pt-3">
                            <input 
                              type="checkbox" 
                              id={`isDefense-trait-${trait.id}`}
                              checked={trait.isDefense || false} 
                              onChange={(e) => updateAbility('battleTraits', index, 'isDefense', e.target.checked)}
                              className="rounded bg-[#151923] border-[#2c3547] text-amber-500 focus:ring-amber-500/20" 
                            />
                            <label htmlFor={`isDefense-trait-${trait.id}`} className="text-xs text-gray-300 font-bold cursor-pointer select-none">
                              🛡️ Defensive Ability (Show on Opponent's Turn)
                            </label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Regiment Abilities Section */}
                <Card className="border-[#222834] bg-[#151923] text-white">
                  <CardHeader className="flex flex-row justify-between items-center border-b border-[#222834] py-4">
                    <div>
                      <CardTitle className="text-md font-bold text-amber-500">Regiment Abilities</CardTitle>
                      <CardDescription className="text-gray-400 text-xs">Detachment rules specific to this army</CardDescription>
                    </div>
                    <Button size="sm" onClick={() => addAbility('regimentAbilities')} className="bg-[#222834] hover:bg-[#2d3748] text-xs">
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Regiment Ability
                    </Button>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    {editorFaction.regimentAbilities.map((reg, index) => (
                      <div key={reg.id} className={`p-4 rounded-lg border transition-all space-y-3 relative ${getAbilityBgClass(reg)}`}>
                        <Button size="sm" variant="ghost" onClick={() => removeAbility('regimentAbilities', index)} className="absolute top-2 right-2 text-red-400 hover:text-red-500 hover:bg-red-500/10 h-8 w-8 p-0">
                          <Trash className="h-3.5 w-3.5" />
                        </Button>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] text-gray-500 font-bold uppercase">Ability Name</label>
                            <Input value={reg.name} onChange={(e) => updateAbility('regimentAbilities', index, 'name', e.target.value)} className="bg-[#151923] border-[#2c3547] text-xs h-8" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-gray-500 font-bold uppercase">Timing Detail</label>
                            <Input value={reg.timing} onChange={(e) => updateAbility('regimentAbilities', index, 'timing', e.target.value)} className="bg-[#151923] border-[#2c3547] text-xs h-8" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-gray-500 font-bold uppercase">Trigger Phase</label>
                            <select 
                              value={reg.phase} 
                              onChange={(e) => updateAbility('regimentAbilities', index, 'phase', e.target.value)}
                              className="w-full bg-[#151923] border border-[#2c3547] text-xs h-8 rounded px-2 text-white"
                            >
                              <option value="start">Start of Turn</option>
                              <option value="hero">Hero Phase</option>
                              <option value="movement">Movement Phase</option>
                              <option value="shooting">Shooting Phase</option>
                              <option value="charge">Charge Phase</option>
                              <option value="combat">Combat Phase</option>
                              <option value="end">End of Turn</option>
                              <option value="passive">Passive</option>
                            </select>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-500 font-bold uppercase">Rule Effect Text</label>
                          <textarea value={reg.effect} onChange={(e) => updateAbility('regimentAbilities', index, 'effect', e.target.value)} className="w-full rounded-md border border-[#2c3547] bg-[#151923] p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 min-h-16" />
                        </div>

                        {/* Custom Passive Applied Phase & Defensive Fields */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-1 border-t border-[#222834]/40 mt-2">
                          {reg.phase === 'passive' && (
                            <div className="flex-1 space-y-1">
                              <label className="text-[10px] text-amber-500 font-extrabold uppercase tracking-wide">Applied Active Phase</label>
                              <select 
                                value={reg.passiveAppliedPhase || ''} 
                                onChange={(e) => updateAbility('regimentAbilities', index, 'passiveAppliedPhase', e.target.value || undefined)}
                                className="w-full bg-[#151923] border border-[#2c3547] text-xs h-8 rounded px-2 text-white"
                              >
                                <option value="">None (Always Active)</option>
                                <option value="start">Start of Turn</option>
                                <option value="hero">Hero Phase</option>
                                <option value="movement">Movement Phase</option>
                                <option value="shooting">Shooting Phase</option>
                                <option value="charge">Charge Phase</option>
                                <option value="combat">Combat Phase</option>
                                <option value="end">End of Turn</option>
                              </select>
                            </div>
                          )}
                          <div className="flex items-center gap-2 pt-3">
                            <input 
                              type="checkbox" 
                              id={`isDefense-reg-${reg.id}`}
                              checked={reg.isDefense || false} 
                              onChange={(e) => updateAbility('regimentAbilities', index, 'isDefense', e.target.checked)}
                              className="rounded bg-[#151923] border-[#2c3547] text-amber-500 focus:ring-amber-500/20" 
                            />
                            <label htmlFor={`isDefense-reg-${reg.id}`} className="text-xs text-gray-300 font-bold cursor-pointer select-none">
                              🛡️ Defensive Ability (Show on Opponent's Turn)
                            </label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Enhancements Section */}
                <Card className="border-[#222834] bg-[#151923] text-white">
                  <CardHeader className="flex flex-row justify-between items-center border-b border-[#222834] py-4">
                    <div>
                      <CardTitle className="text-md font-bold text-amber-500">Enhancements (General / Hero Traits)</CardTitle>
                      <CardDescription className="text-gray-400 text-xs">Special abilities selected for your general during setup</CardDescription>
                    </div>
                    <Button size="sm" onClick={() => addAbility('enhancements')} className="bg-[#222834] hover:bg-[#2d3748] text-xs">
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Enhancement
                    </Button>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    {editorFaction.enhancements.map((enh, index) => (
                      <div key={enh.id} className={`p-4 rounded-lg border transition-all space-y-3 relative ${getAbilityBgClass(enh)}`}>
                        <Button size="sm" variant="ghost" onClick={() => removeAbility('enhancements', index)} className="absolute top-2 right-2 text-red-400 hover:text-red-500 hover:bg-red-500/10 h-8 w-8 p-0">
                          <Trash className="h-3.5 w-3.5" />
                        </Button>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] text-gray-500 font-bold uppercase">Enhancement Name</label>
                            <Input value={enh.name} onChange={(e) => updateAbility('enhancements', index, 'name', e.target.value)} className="bg-[#151923] border-[#2c3547] text-xs h-8" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-gray-500 font-bold uppercase">Timing Detail</label>
                            <Input value={enh.timing} onChange={(e) => updateAbility('enhancements', index, 'timing', e.target.value)} className="bg-[#151923] border-[#2c3547] text-xs h-8" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-gray-500 font-bold uppercase">Trigger Phase</label>
                            <select 
                              value={enh.phase} 
                              onChange={(e) => updateAbility('enhancements', index, 'phase', e.target.value)}
                              className="w-full bg-[#151923] border border-[#2c3547] text-xs h-8 rounded px-2 text-white"
                            >
                              <option value="start">Start of Turn</option>
                              <option value="hero">Hero Phase</option>
                              <option value="movement">Movement Phase</option>
                              <option value="shooting">Shooting Phase</option>
                              <option value="charge">Charge Phase</option>
                              <option value="combat">Combat Phase</option>
                              <option value="end">End of Turn</option>
                              <option value="passive">Passive</option>
                            </select>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-500 font-bold uppercase">Rule Effect Text</label>
                          <textarea value={enh.effect} onChange={(e) => updateAbility('enhancements', index, 'effect', e.target.value)} className="w-full rounded-md border border-[#2c3547] bg-[#151923] p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 min-h-16" />
                        </div>

                        {/* Custom Passive Applied Phase & Defensive Fields */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-1 border-t border-[#222834]/40 mt-2">
                          {enh.phase === 'passive' && (
                            <div className="flex-1 space-y-1">
                              <label className="text-[10px] text-amber-500 font-extrabold uppercase tracking-wide">Applied Active Phase</label>
                              <select 
                                value={enh.passiveAppliedPhase || ''} 
                                onChange={(e) => updateAbility('enhancements', index, 'passiveAppliedPhase', e.target.value || undefined)}
                                className="w-full bg-[#151923] border border-[#2c3547] text-xs h-8 rounded px-2 text-white"
                              >
                                <option value="">None (Always Active)</option>
                                <option value="start">Start of Turn</option>
                                <option value="hero">Hero Phase</option>
                                <option value="movement">Movement Phase</option>
                                <option value="shooting">Shooting Phase</option>
                                <option value="charge">Charge Phase</option>
                                <option value="combat">Combat Phase</option>
                                <option value="end">End of Turn</option>
                              </select>
                            </div>
                          )}
                          <div className="flex items-center gap-2 pt-3">
                            <input 
                              type="checkbox" 
                              id={`isDefense-enh-${enh.id}`}
                              checked={enh.isDefense || false} 
                              onChange={(e) => updateAbility('enhancements', index, 'isDefense', e.target.checked)}
                              className="rounded bg-[#151923] border-[#2c3547] text-amber-500 focus:ring-amber-500/20" 
                            />
                            <label htmlFor={`isDefense-enh-${enh.id}`} className="text-xs text-gray-300 font-bold cursor-pointer select-none">
                              🛡️ Defensive Ability (Show on Opponent's Turn)
                            </label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* TAB 3: UNITS & WEAPONS */}
            {editorTab === 'units' && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                
                {/* Left Sidebar Units Selector */}
                <div className="md:col-span-1 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400 font-bold uppercase">Unit Rosters</span>
                    <Button size="sm" onClick={addUnit} className="h-7 bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 text-[10px]">
                      <Plus className="h-3 w-3 mr-1" /> Add Unit
                    </Button>
                  </div>
                  <div className="space-y-1.5 max-h-[450px] overflow-y-auto pr-1">
                    {editorFaction.units.map((unit, index) => (
                      <div 
                        key={unit.id}
                        onClick={() => setSelectedUnitIndex(index)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all duration-150 flex items-center justify-between ${
                          selectedUnitIndex === index 
                            ? 'bg-amber-500/10 border-amber-500/40 text-white shadow-md' 
                            : 'bg-[#151923] border-[#222834] text-gray-400 hover:text-white hover:bg-[#1b2230]'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <p className="text-xs font-bold truncate">{unit.name || 'Unnamed Unit'}</p>
                          <p className="text-[10px] text-gray-500">{unit.isHero ? 'Hero general' : 'Regular infantry'} • {unit.models ?? 1} model{unit.models !== 1 ? 's' : ''}</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button size="sm" variant="ghost" title="Duplicate Unit" onClick={(e) => { e.stopPropagation(); duplicateUnit(index); }} className="text-gray-500 hover:text-amber-400 h-6 w-6 p-0 hover:bg-transparent">
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" title="Delete Unit" onClick={(e) => { e.stopPropagation(); removeUnit(index); }} className="text-gray-500 hover:text-red-400 h-6 w-6 p-0 hover:bg-transparent">
                            <Trash className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Area: Form details for selected unit */}
                <div className="md:col-span-3 space-y-6">
                  {editorFaction.units[selectedUnitIndex] ? (
                    <div className="space-y-6">
                      
                      {/* Unit Roster Basic Stats */}
                      <Card className="border-[#222834] bg-[#151923] text-white">
                        <CardHeader className="py-4 border-b border-[#222834]">
                          <CardTitle className="text-md font-bold">Roster Stats</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                              <label className="text-xs text-gray-400 font-bold uppercase">Roster Name</label>
                              <Input 
                                value={editorFaction.units[selectedUnitIndex].name} 
                                onChange={(e) => updateUnitField(selectedUnitIndex, 'name', e.target.value)} 
                                className="bg-[#0f121a] border-[#222834] text-xs h-9" 
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-gray-400 font-bold uppercase">Models Per Unit (Squad Size)</label>
                              <Input 
                                type="number" 
                                min={1}
                                value={editorFaction.units[selectedUnitIndex].models ?? 1} 
                                onChange={(e) => updateUnitField(selectedUnitIndex, 'models', parseInt(e.target.value) || 1)} 
                                className="bg-[#0f121a] border-[#222834] text-xs h-9 text-amber-500 font-black focus-visible:ring-1 focus-visible:ring-amber-500/30" 
                              />
                            </div>
                            <div className="flex items-center gap-2 pt-6">
                              <input 
                                type="checkbox" 
                                id={`isHero-${selectedUnitIndex}`}
                                checked={editorFaction.units[selectedUnitIndex].isHero || false}
                                onChange={(e) => updateUnitField(selectedUnitIndex, 'isHero', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                              />
                              <label htmlFor={`isHero-${selectedUnitIndex}`} className="text-xs text-gray-300 font-bold cursor-pointer">
                                Is Hero general / leader?
                              </label>
                            </div>
                          </div>

                          {/* Stat Grid */}
                          <div className="grid grid-cols-5 gap-2 pt-2">
                            <div className="text-center bg-[#0f121a] p-2 rounded border border-[#222834]">
                              <p className="text-[10px] text-gray-500 font-bold uppercase">Move</p>
                              <Input 
                                type="number" 
                                value={editorFaction.units[selectedUnitIndex].move} 
                                onChange={(e) => updateUnitField(selectedUnitIndex, 'move', parseInt(e.target.value) || 0)} 
                                className="bg-transparent border-none text-center font-black text-amber-500 p-0 text-sm focus-visible:ring-0 h-8" 
                              />
                            </div>
                            <div className="text-center bg-[#0f121a] p-2 rounded border border-[#222834]">
                              <p className="text-[10px] text-gray-500 font-bold uppercase">Control</p>
                              <Input 
                                type="number" 
                                value={editorFaction.units[selectedUnitIndex].control} 
                                onChange={(e) => updateUnitField(selectedUnitIndex, 'control', parseInt(e.target.value) || 0)} 
                                className="bg-transparent border-none text-center font-black text-amber-500 p-0 text-sm focus-visible:ring-0 h-8" 
                              />
                            </div>
                            <div className="text-center bg-[#0f121a] p-2 rounded border border-[#222834]">
                              <p className="text-[10px] text-gray-500 font-bold uppercase">Health (per model)</p>
                              <Input 
                                type="number" 
                                value={editorFaction.units[selectedUnitIndex].health} 
                                onChange={(e) => updateUnitField(selectedUnitIndex, 'health', parseInt(e.target.value) || 0)} 
                                className="bg-transparent border-none text-center font-black text-amber-500 p-0 text-sm focus-visible:ring-0 h-8" 
                              />
                            </div>
                            <div className="text-center bg-[#0f121a] p-2 rounded border border-[#222834]">
                              <p className="text-[10px] text-gray-500 font-bold uppercase">Save (Save+)</p>
                              <Input 
                                type="number" 
                                value={editorFaction.units[selectedUnitIndex].save} 
                                onChange={(e) => updateUnitField(selectedUnitIndex, 'save', parseInt(e.target.value) || 0)} 
                                className="bg-transparent border-none text-center font-black text-amber-500 p-0 text-sm focus-visible:ring-0 h-8" 
                              />
                            </div>
                            <div className="text-center bg-[#0f121a] p-2 rounded border border-[#222834]">
                              <p className="text-[10px] text-gray-500 font-bold uppercase">Ward (Ward+)</p>
                              <Input 
                                type="number" 
                                value={editorFaction.units[selectedUnitIndex].ward} 
                                onChange={(e) => updateUnitField(selectedUnitIndex, 'ward', parseInt(e.target.value) || 0)} 
                                className="bg-transparent border-none text-center font-black text-amber-500 p-0 text-sm focus-visible:ring-0 h-8" 
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Unit Weapons Table */}
                      <Card className="border-[#222834] bg-[#151923] text-white">
                        <CardHeader className="flex flex-row justify-between items-center py-4 border-b border-[#222834]">
                          <CardTitle className="text-md font-bold">Weapons profiles</CardTitle>
                          <Button size="sm" onClick={() => addWeapon(selectedUnitIndex)} className="h-7 bg-[#222834] hover:bg-[#2d3748] text-[10px]">
                            <Plus className="h-3 w-3 mr-1" /> Add Weapon
                          </Button>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                          {editorFaction.units[selectedUnitIndex].weapons.map((wpn, weaponIdx) => (
                            <div key={weaponIdx} className="bg-[#0f121a] p-3 rounded-lg border border-[#222834] relative space-y-2">
                              <Button size="sm" variant="ghost" onClick={() => removeWeapon(selectedUnitIndex, weaponIdx)} className="absolute top-2 right-2 text-red-400 hover:text-red-500 h-6 w-6 p-0 hover:bg-transparent">
                                <Trash className="h-3.5 w-3.5" />
                              </Button>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <label className="text-[9px] text-gray-500 font-bold uppercase">Weapon Name</label>
                                  <Input value={wpn.name} onChange={(e) => updateWeapon(selectedUnitIndex, weaponIdx, 'name', e.target.value)} className="bg-[#151923] border-[#222834] text-xs h-7" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] text-gray-500 font-bold uppercase">Range (e.g. Melee or 12")</label>
                                  <Input value={wpn.range} onChange={(e) => updateWeapon(selectedUnitIndex, weaponIdx, 'range', e.target.value)} className="bg-[#151923] border-[#222834] text-xs h-7" />
                                </div>
                              </div>
                              <div className="grid grid-cols-5 gap-1.5 pt-1">
                                <div className="text-center">
                                  <label className="text-[9px] text-gray-500 font-bold uppercase">Attacks</label>
                                  <Input value={wpn.attacks} onChange={(e) => updateWeapon(selectedUnitIndex, weaponIdx, 'attacks', e.target.value)} className="bg-[#151923] border-[#222834] text-center text-xs h-7 p-0" />
                                </div>
                                <div className="text-center">
                                  <label className="text-[9px] text-gray-500 font-bold uppercase">Hit</label>
                                  <Input type="number" value={wpn.hit} onChange={(e) => updateWeapon(selectedUnitIndex, weaponIdx, 'hit', parseInt(e.target.value) || 0)} className="bg-[#151923] border-[#222834] text-center text-xs h-7 p-0" />
                                </div>
                                <div className="text-center">
                                  <label className="text-[9px] text-gray-500 font-bold uppercase">Wound</label>
                                  <Input type="number" value={wpn.wound} onChange={(e) => updateWeapon(selectedUnitIndex, weaponIdx, 'wound', parseInt(e.target.value) || 0)} className="bg-[#151923] border-[#222834] text-center text-xs h-7 p-0" />
                                </div>
                                <div className="text-center">
                                  <label className="text-[9px] text-gray-500 font-bold uppercase">Rend</label>
                                  <Input type="number" value={wpn.rend} onChange={(e) => updateWeapon(selectedUnitIndex, weaponIdx, 'rend', parseInt(e.target.value) || 0)} className="bg-[#151923] border-[#222834] text-center text-xs h-7 p-0" />
                                </div>
                                <div className="text-center">
                                  <label className="text-[9px] text-gray-500 font-bold uppercase">Damage</label>
                                  <Input value={wpn.damage} onChange={(e) => updateWeapon(selectedUnitIndex, weaponIdx, 'damage', e.target.value)} className="bg-[#151923] border-[#222834] text-center text-xs h-7 p-0" />
                                </div>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] text-gray-500 font-bold uppercase">Weapon Abilities (e.g. Crit (Mortal))</label>
                                <Input value={wpn.abilities || ''} onChange={(e) => updateWeapon(selectedUnitIndex, weaponIdx, 'abilities', e.target.value)} className="bg-[#151923] border-[#222834] text-xs h-7" />
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>

                      {/* Unit Abilities Section */}
                      <Card className="border-[#222834] bg-[#151923] text-white">
                        <CardHeader className="flex flex-row justify-between items-center py-4 border-b border-[#222834]">
                          <CardTitle className="text-md font-bold">Unit Abilities (Tactics & Actions)</CardTitle>
                          <Button size="sm" onClick={() => addUnitAbility(selectedUnitIndex)} className="h-7 bg-[#222834] hover:bg-[#2d3748] text-[10px]">
                            <Plus className="h-3 w-3 mr-1" /> Add Unit Ability
                          </Button>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                          {editorFaction.units[selectedUnitIndex].abilities?.map((ability, abilityIdx) => (
                            <div key={ability.id} className={`p-3 rounded-lg border transition-all relative space-y-2 ${getAbilityBgClass(ability)}`}>
                              <Button size="sm" variant="ghost" onClick={() => removeUnitAbility(selectedUnitIndex, abilityIdx)} className="absolute top-2 right-2 text-red-400 hover:text-red-500 h-6 w-6 p-0 hover:bg-transparent">
                                <Trash className="h-3.5 w-3.5" />
                              </Button>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                <div className="space-y-1">
                                  <label className="text-[9px] text-gray-500 font-bold uppercase">Ability Name</label>
                                  <Input value={ability.name} onChange={(e) => updateUnitAbility(selectedUnitIndex, abilityIdx, 'name', e.target.value)} className="bg-[#151923] border-[#222834] text-xs h-7" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] text-gray-500 font-bold uppercase">Timing Detail</label>
                                  <Input value={ability.timing} onChange={(e) => updateUnitAbility(selectedUnitIndex, abilityIdx, 'timing', e.target.value)} className="bg-[#151923] border-[#222834] text-xs h-7" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] text-gray-500 font-bold uppercase">Trigger Phase</label>
                                  <select 
                                    value={ability.phase} 
                                    onChange={(e) => updateUnitAbility(selectedUnitIndex, abilityIdx, 'phase', e.target.value)}
                                    className="w-full bg-[#151923] border border-[#222834] text-xs h-7 rounded px-2 text-white"
                                  >
                                    <option value="start">Start of Turn</option>
                                    <option value="hero">Hero Phase</option>
                                    <option value="movement">Movement Phase</option>
                                    <option value="shooting">Shooting Phase</option>
                                    <option value="charge">Charge Phase</option>
                                    <option value="combat">Combat Phase</option>
                                    <option value="end">End of Turn</option>
                                    <option value="passive">Passive</option>
                                  </select>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] text-gray-500 font-bold uppercase">Rule Effect Text</label>
                                <textarea value={ability.effect} onChange={(e) => updateUnitAbility(selectedUnitIndex, abilityIdx, 'effect', e.target.value)} className="w-full rounded-md border border-[#2c3547] bg-[#151923] p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 min-h-12" />
                              </div>

                              {/* Custom Passive Applied Phase & Defensive Fields */}
                              <div className="flex flex-col sm:flex-row gap-4 pt-1 border-t border-[#222834]/40 mt-2">
                                {ability.phase === 'passive' && (
                                  <div className="flex-1 space-y-1">
                                    <label className="text-[10px] text-amber-500 font-extrabold uppercase tracking-wide">Applied Active Phase</label>
                                    <select 
                                      value={ability.passiveAppliedPhase || ''} 
                                      onChange={(e) => updateUnitAbility(selectedUnitIndex, abilityIdx, 'passiveAppliedPhase', e.target.value || undefined)}
                                      className="w-full bg-[#151923] border border-[#2c3547] text-xs h-8 rounded px-2 text-white"
                                    >
                                      <option value="">None (Always Active)</option>
                                      <option value="start">Start of Turn</option>
                                      <option value="hero">Hero Phase</option>
                                      <option value="movement">Movement Phase</option>
                                      <option value="shooting">Shooting Phase</option>
                                      <option value="charge">Charge Phase</option>
                                      <option value="combat">Combat Phase</option>
                                      <option value="end">End of Turn</option>
                                    </select>
                                  </div>
                                )}
                                <div className="flex items-center gap-2 pt-3">
                                  <input 
                                    type="checkbox" 
                                    id={`isDefense-unit-${ability.id}`}
                                    checked={ability.isDefense || false} 
                                    onChange={(e) => updateUnitAbility(selectedUnitIndex, abilityIdx, 'isDefense', e.target.checked)}
                                    className="rounded bg-[#151923] border-[#2c3547] text-amber-500 focus:ring-amber-500/20" 
                                  />
                                  <label htmlFor={`isDefense-unit-${ability.id}`} className="text-xs text-gray-300 font-bold cursor-pointer select-none">
                                    🛡️ Defensive Ability (Show on Opponent's Turn)
                                  </label>
                                </div>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>

                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500 bg-[#151923] rounded-xl border border-[#222834]">
                      Select a unit roster from the sidebar or click "Add Unit" to populate.
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>
        ) : (
          
          /* Admin Main Portal View */
          <div className="space-y-8">
            
            {/* API Key Configurator Panel */}
            <Card className="border-[#222834] bg-gradient-to-br from-[#151923] to-[#1c2230] text-white">
              <CardHeader className="flex flex-row items-center justify-between py-4 pb-2">
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-amber-500" />
                  <CardTitle className="text-sm font-bold uppercase tracking-wider">Gemini API Key Configuration</CardTitle>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setShowKeyInput(!showKeyInput)} className="text-xs text-amber-400 hover:text-amber-500 h-8">
                  {showKeyInput ? 'Collapse' : 'Manage key'}
                </Button>
              </CardHeader>
              {showKeyInput && (
                <CardContent className="pt-2 pb-4 space-y-3 border-t border-[#222834]/50">
                  <p className="text-xs text-gray-400">
                    Your key is saved locally in your browser's memory and is never transmitted anywhere besides the secure parsing endpoint.
                  </p>
                  <div className="flex gap-2">
                    <Input 
                      type="password" 
                      placeholder="AIzaSy..." 
                      value={apiKey} 
                      onChange={(e) => saveApiKey(e.target.value)}
                      className="bg-[#0f121a] border-[#2d3748] text-white text-xs flex-grow h-9" 
                    />
                    <Button size="sm" onClick={() => setShowKeyInput(false)} className="bg-[#222834] hover:bg-[#2d3748] text-xs">
                      Lock
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Scanning and Manual Insertion Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Manual Creation Card */}
              <Card className="border-[#222834] bg-[#151923] text-white flex flex-col justify-between shadow-lg">
                <CardHeader>
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 w-fit mb-1">Manual CMS</Badge>
                  <CardTitle className="text-lg font-bold">Manual Faction Creator</CardTitle>
                  <CardDescription className="text-gray-400 text-xs">
                    Create a blank template and type stats manually
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    If you don't have a Faction PDF, you can generate a clean, empty spreadsheet template in our editor. Easily input units, movement circles, weapon blocks, and custom reaction triggers.
                  </p>
                </CardContent>
                <CardFooter className="border-t border-[#222834]/50 py-4 bg-[#0f121a]/30">
                  <Button onClick={handleCreateNewBlank} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs">
                    <Plus className="h-4 w-4 mr-1.5" /> Create Empty Faction
                  </Button>
                </CardFooter>
              </Card>

              {/* PDF Scanner Card */}
              <Card className="border-[#222834] bg-[#151923] text-white shadow-lg">
                <CardHeader>
                  <Badge variant="outline" className="border-amber-500/30 text-amber-500 w-fit mb-1">Multimodal AI</Badge>
                  <CardTitle className="text-lg font-bold">AI Faction Pack Scanner</CardTitle>
                  <CardDescription className="text-gray-400 text-xs">
                    Accelerate data entry via automated PDF parsing
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-4">
                  {status === 'loading' ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center space-y-3">
                      <RefreshCw className="h-8 w-8 text-amber-500 animate-spin" />
                      <p className="text-xs text-amber-500 font-bold animate-pulse">{progressMsg}</p>
                    </div>
                  ) : (
                    <div 
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
                        isDragging 
                          ? 'border-amber-500 bg-amber-500/5' 
                          : file 
                            ? 'border-emerald-500/40 bg-emerald-500/5' 
                            : 'border-[#2d3748] hover:border-amber-500/40 hover:bg-[#1b212f]'
                      }`}
                      onClick={() => document.getElementById('file-upload')?.click()}
                    >
                      <input 
                        type="file" 
                        id="file-upload" 
                        accept="application/pdf" 
                        onChange={handleFileChange} 
                        className="hidden" 
                      />
                      {file ? (
                        <>
                          <FileText className="h-10 w-10 text-emerald-400 mb-2" />
                          <p className="text-xs font-bold text-white max-w-[200px] truncate">{file.name}</p>
                          <p className="text-[10px] text-emerald-400/70 mt-1">Ready to parse faction rules</p>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="h-10 w-10 text-gray-400 mb-2 group-hover:text-amber-500" />
                          <p className="text-xs font-bold text-white">Drag and Drop PDF here</p>
                          <p className="text-[10px] text-gray-500 mt-1">or click to browse computer</p>
                        </>
                      )}
                    </div>
                  )}

                  {status === 'error' && (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex gap-2 items-start text-left text-xs text-red-400 whitespace-pre-wrap">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Scan Error: </span>{errorMsg}
                      </div>
                    </div>
                  )}
                </CardContent>
                {file && status !== 'loading' && (
                  <CardFooter className="border-t border-[#222834]/50 py-4 bg-[#0f121a]/30">
                    <Button onClick={handleScan} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs">
                      <Sparkles className="h-4 w-4 mr-1.5" /> Scan & Populate Editor
                    </Button>
                  </CardFooter>
                )}
              </Card>

            </div>

            {/* Database Backup & Restore Panel */}
            <Card className="border-[#222834] bg-[#151923] text-white shadow-lg">
              <CardHeader className="py-4 border-b border-[#222834] bg-[#0f121a]/20">
                <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 text-amber-500">
                  <Download className="h-4 w-4" /> Backup & Restore Database
                </CardTitle>
                <CardDescription className="text-xxs text-gray-400">
                  Export or import your complete uploaded factions database as a JSON backup file.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-3.5">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={handleExportBackup} 
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 h-10 shadow-md"
                  >
                    <Download className="h-4 w-4" /> Export Database Backup
                  </Button>
                  
                  <div className="flex-1 relative">
                    <input
                      type="file"
                      id="restore-backup-file"
                      accept=".json"
                      onChange={handleImportBackup}
                      className="hidden"
                    />
                    <Button 
                      onClick={() => document.getElementById('restore-backup-file')?.click()} 
                      className="w-full bg-[#1c2230] hover:bg-[#2c3548] text-gray-300 font-bold text-xs gap-1.5 border border-[#2c3548] h-10 shadow-md"
                    >
                      <Upload className="h-4 w-4" /> Restore Database Backup
                    </Button>
                  </div>
                </div>

                <div className="border-t border-[#222834]/50 pt-3.5">
                  <Button 
                    onClick={handleManualSyncToDisk} 
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1.5 h-10 shadow-md"
                  >
                    <Save className="h-4 w-4" /> 💾 Save to Static Codebase (Local Disk)
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Custom Factions Database Directory Panel */}
            <Card className="border-[#222834] bg-[#151923] text-white shadow-lg">
              <CardHeader className="py-5 border-b border-[#222834]">
                <CardTitle className="text-md font-bold flex items-center gap-2">
                  <Layers className="h-5 w-5 text-amber-500" /> Loaded Factions Database ({customFactions.length})
                </CardTitle>
                <CardDescription className="text-xs text-gray-400">
                  Custom schemas loaded in localStorage that can be selected on the Setup Launcher
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {customFactions.length === 0 ? (
                  <div className="text-center py-10 text-gray-500 text-xs">
                    No custom factions currently loaded. Use the scanner above or click "Create Empty Faction" to build one!
                  </div>
                ) : (
                  <div className="divide-y divide-[#222834]">
                    {customFactions.map((f) => (
                      <div key={f.id} className="p-4 flex items-center justify-between hover:bg-[#1a1f2c]/50 transition-colors duration-150">
                        <div>
                          <p className="text-sm font-black text-white">{f.name}</p>
                          <p className="text-xs text-gray-400">{f.spearheadName} • <span className="text-amber-500 font-medium italic">{f.units.length} unit rosters</span></p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleEditFaction(f)} className="bg-[#222834] hover:bg-[#2d3748] text-xs text-gray-300">
                            <Edit className="h-3.5 w-3.5 mr-1" /> Edit Rules
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteFaction(f.id)} className="text-red-400 hover:text-red-500 hover:bg-red-500/10 h-9 px-3">
                            <Trash className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        )}

      </main>

      {/* Premium Footer */}
      <footer className="border-t border-[#222834] py-6 text-center text-xs text-gray-500 mt-auto bg-[#0a0c12]">
        <p>© 2026 Spearhead Rules Tracker • Solo Tabletop Companion Admin CMS</p>
      </footer>

      {toast && (
        <div className="fixed bottom-4 right-4 left-4 md:left-auto md:max-w-sm z-50 animate-bounce-in">
          <div className={`p-4 rounded-xl shadow-2xl border flex items-center justify-between gap-3 ${
            toast.type === 'error' ? 'bg-red-950/90 border-red-500/30 text-red-200' : 'bg-zinc-900/95 border-amber-500/30 text-amber-200'
          }`}>
            <span className="text-xs font-bold leading-normal">{toast.message}</span>
            <button onClick={() => setToast(null)} className="text-xs font-black hover:text-white shrink-0">✕</button>
          </div>
        </div>
      )}

      {confirmModal && (
        <div className="fixed inset-0 bg-[#0d1017]/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#151923] border border-[#222834] rounded-xl max-w-sm w-full p-6 space-y-6 shadow-2xl">
            <div className="space-y-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-amber-500" /> Are you sure?
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed">{confirmModal.message}</p>
            </div>
            <div className="flex gap-3 justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setConfirmModal(null)} 
                className="border-[#2c3548] text-gray-300 text-xs"
              >
                Cancel
              </Button>
              <Button 
                size="sm" 
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(null);
                }} 
                className="bg-red-600 hover:bg-red-700 text-white text-xs border-transparent"
              >
                Yes, Proceed
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
