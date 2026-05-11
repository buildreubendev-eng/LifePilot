import { Checkbox } from "@/components/ui/checkbox";
import { Brain, Sparkles, FileText } from "lucide-react";

const preferences = [
  { id: "auto_categorize", title: "Learn from manual categorization", description: "If you correct a category, PLOS will learn to apply it to similar items in the future.", icon: <Sparkles size={14} className="text-amber-400" /> },
  { id: "snooze_patterns", title: "Learn from snooze patterns", description: "If you regularly snooze items from certain senders, PLOS will start prioritizing them lower.", icon: <Brain size={14} className="text-violet-400" /> },
  { id: "document_saving", title: "Suggest document saving automations", description: "PLOS will suggest automatic rules when it notices you repeatedly saving similar documents.", icon: <FileText size={14} className="text-emerald-400" /> },
];

export function LearningPreferencesPanel() {
  return (
    <div className="rounded-2xl border border-white/5 bg-black/40 p-6 shadow-lg backdrop-blur-md">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/20">
          <Brain size={18} className="text-violet-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Personalized Learning</h2>
          <p className="text-xs text-stone-500">AI learns from your behavior to improve suggestions</p>
        </div>
      </div>

      <div className="grid gap-3">
        {preferences.map((pref) => (
          <label key={pref.id} className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4 cursor-pointer hover:bg-white/[0.04] transition-colors">
            <div className="shrink-0 mt-0.5">{pref.icon}</div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold text-stone-200">{pref.title}</span>
              <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">{pref.description}</p>
            </div>
            <div className="shrink-0 ml-2">
              <Checkbox defaultChecked />
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
