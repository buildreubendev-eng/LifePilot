import { Checkbox } from "@/components/ui/checkbox";

export function LearningPreferencesPanel() {
  const preferences = [
    { id: "auto_categorize", title: "Learn from my manual categorization", description: "If you correct a category, PLOS will learn to apply it to similar items in the future." },
    { id: "snooze_patterns", title: "Learn from snooze patterns", description: "If you regularly snooze items from certain senders, PLOS will start prioritizing them lower." },
    { id: "document_saving", title: "Suggest document saving automations", description: "PLOS will suggest automatic rules when it notices you repeatedly saving similar documents." }
  ];

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-stone-950">Personalized Learning</h2>
      <p className="mt-2 text-sm leading-6 text-stone-600">
        PLOS learns from how you interact with your life admin to provide better rankings and suggestions. You can disable this learning at any time.
      </p>
      
      <div className="mt-4 grid gap-3">
        {preferences.map((pref) => (
          <label key={pref.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg bg-stone-50 p-4">
            <div>
              <span className="font-semibold text-stone-800">{pref.title}</span>
              <p className="text-sm text-stone-600 mt-1">{pref.description}</p>
            </div>
            <div className="shrink-0">
              <Checkbox defaultChecked />
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
