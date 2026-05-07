import { useState } from "react";
import { Badge } from "@/components/Badge";
import { Modal } from "@/components/Modal";

interface Connector {
  id: string;
  name: string;
  status: "connected" | "disconnected" | "needs_reauth";
  description: string;
}

const initialConnectors: Connector[] = [
  { id: "gmail", name: "Gmail", status: "disconnected", description: "Connect to parse incoming bills and travel confirmations." },
  { id: "calendar", name: "Google Calendar", status: "disconnected", description: "Connect to detect schedule conflicts and sync tasks." },
  { id: "plaid", name: "Plaid", status: "disconnected", description: "Connect bank accounts to verify payments and renewals." },
  { id: "health", name: "Health Portals", status: "disconnected", description: "Connect MyChart or similar portals for appointment tracking." },
];

export function ConnectorsPanel() {
  const [connectors, setConnectors] = useState(initialConnectors);
  const [authModal, setAuthModal] = useState<Connector | null>(null);

  const handleConnect = (id: string) => {
    setConnectors(connectors.map(c => c.id === id ? { ...c, status: "connected" } : c));
    setAuthModal(null);
  };

  const handleDisconnect = (id: string) => {
    setConnectors(connectors.map(c => c.id === id ? { ...c, status: "disconnected" } : c));
  };

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-stone-950">Integrations & Connectors</h2>
      <p className="mt-2 text-sm leading-6 text-stone-600">
        Link external services securely. PLOS only requests read access by default. Action permissions (like sending emails) are requested on a per-action basis.
      </p>
      
      <div className="mt-4 grid gap-4">
        {connectors.map((connector) => (
          <div key={connector.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-stone-200 p-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-stone-900">{connector.name}</h3>
                {connector.status === "connected" && <Badge variant="completed">Connected</Badge>}
                {connector.status === "needs_reauth" && <Badge variant="urgent">Needs Re-auth</Badge>}
              </div>
              <p className="mt-1 text-sm text-stone-600">{connector.description}</p>
            </div>
            
            <div className="shrink-0">
              {connector.status === "disconnected" || connector.status === "needs_reauth" ? (
                <button 
                  onClick={() => setAuthModal(connector)}
                  className="rounded-md bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800"
                >
                  Connect
                </button>
              ) : (
                <button 
                  onClick={() => handleDisconnect(connector.id)}
                  className="rounded-md bg-stone-100 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-200"
                >
                  Disconnect
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {authModal && (
        <Modal isOpen={!!authModal} onClose={() => setAuthModal(null)} title={`Connect ${authModal.name}`}>
          <div className="flex flex-col gap-4 text-center py-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <h3 className="text-lg font-bold text-stone-900">Secure OAuth Request</h3>
            <p className="text-sm text-stone-600">
              PLOS is requesting read-only access to your {authModal.name} account to scan for life admin tasks.
            </p>
            <div className="mt-4 flex gap-3">
              <button onClick={() => setAuthModal(null)} className="w-full rounded-md px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-100 border border-stone-200">Cancel</button>
              <button onClick={() => handleConnect(authModal.id)} className="w-full rounded-md bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800">Allow Access</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
