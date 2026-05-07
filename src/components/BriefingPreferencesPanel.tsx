import { Checkbox } from "@/components/ui/checkbox";

export function BriefingPreferencesPanel() {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-stone-950">Weekly Briefing Delivery</h2>
      <p className="mt-2 text-sm leading-6 text-stone-600">
        Configure how and when you want to receive your weekly summary.
      </p>
      
      <div className="mt-4 grid gap-4">
        <div>
          <label className="block text-sm font-semibold text-stone-700">Delivery Day & Time</label>
          <select className="mt-2 w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900">
            <option>Friday at 5:00 PM</option>
            <option>Saturday at 9:00 AM</option>
            <option>Sunday at 8:00 PM</option>
            <option>Monday at 7:00 AM</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-stone-700">Delivery Methods</label>
          <div className="mt-2 grid gap-2">
            <label className="flex items-center gap-2">
              <Checkbox defaultChecked />
              <span className="text-sm text-stone-700">Push Notification</span>
            </label>
            <label className="flex items-center gap-2">
              <Checkbox defaultChecked />
              <span className="text-sm text-stone-700">Email summary</span>
            </label>
            <label className="flex items-center gap-2">
              <Checkbox />
              <span className="text-sm text-stone-700">SMS (Important items only)</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
