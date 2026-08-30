import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom';
import { LogOut, Plus, Calendar, Send, Search, Mail, MessageSquare } from 'lucide-react';

import axios from 'axios';
import { toast } from 'sonner';
import ComposeEmail from '../components/ComposeEmail';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await api.get('/auth/me');
        if (data.success) {
          setUser(data.data);
        }
      } catch {
        navigate('/login');
      }
    };
    fetchUser();
  }, [navigate]);

  // Debounced Search Implementation
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const { data } = await api.get(`/api/emails/search?q=${searchQuery}`);
        if (data.success) {
          setSearchResults(data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      toast.success('Logged out successfully');
      navigate('/login');
    } catch {
      toast.error('Failed to logout');
    }
  };



  if (!user) return <div className="min-h-screen flex items-center justify-center bg-[#f4f6f8] text-gray-500">Loading your workspace...</div>;

  return (
    <div className="min-h-screen bg-[#f4f6f8] flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[280px] bg-white border-r border-[#e4e8eb] flex flex-col shrink-0">
        {/* User Workspace Info */}
        <div className="p-6 border-b border-[#f0f2f5] flex items-center gap-3">
          {user.avatar ? (
            <img src={user.avatar} alt="Avatar" className="w-10 h-10 rounded-xl border border-[#e4e8eb] object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold uppercase">
              {user.name.charAt(0)}
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-gray-900 truncate">{user.name}</span>
            <span className="text-xs text-gray-500 truncate">{user.email}</span>
          </div>
        </div>

        {/* Compose Button */}
        <div className="p-4">
          <button
            onClick={() => setIsComposeOpen(true)}
            className="w-full bg-[#00a854] hover:bg-[#008f47] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_4px_12px_rgba(0,168,84,0.15)] cursor-pointer text-sm"
          >
            <Plus className="w-4 h-4" />
            Compose New Email
          </button>
        </div>
        
        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
          <Link
            to="/dashboard"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-colors ${
              location.pathname === '/dashboard'
                ? 'bg-emerald-50/50 text-[#00a854]'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Calendar className="w-5 h-5" />
            Scheduled Campaigns
          </Link>
          <Link
            to="/dashboard/sent"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-colors ${
              location.pathname === '/dashboard/sent'
                ? 'bg-emerald-50/50 text-[#00a854]'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Send className="w-5 h-5" />
            Sent Campaigns
          </Link>
        </nav>

        {/* Footer Section */}
        <div className="p-4 border-t border-[#f0f2f5] space-y-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-transparent text-xs font-bold rounded-xl text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Logout Workspace
          </button>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with Search and Status */}
        <header className="bg-white border-b border-[#e4e8eb] h-16 flex items-center justify-between px-8 shrink-0">
          <div className="relative w-96">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search scheduled or sent emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#f4f6f8] border border-transparent rounded-xl focus:border-[#00a854] focus:bg-white focus:outline-none transition-all text-xs text-gray-900"
            />
          </div>
          
          <div className="flex items-center gap-4 text-xs font-semibold text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Sync Active
            </span>
          </div>
        </header>

        {/* Content viewport */}
        <main className="flex-1 overflow-auto p-8">
          {searchQuery.trim() ? (
            <div className="bg-white shadow-[0_4px_20px_rgba(0,0,0,0.02)] rounded-2xl p-6 border border-[#e4e8eb]">
              <h2 className="text-base font-bold mb-4 text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#00a854]" />
                Search Results for "{searchQuery}"
              </h2>
              {isSearching ? (
                <div className="text-sm text-gray-500 py-4 text-center">Searching...</div>
              ) : searchResults.length === 0 ? (
                <div className="text-sm text-gray-500 py-8 text-center border-2 border-dashed border-[#e4e8eb] rounded-xl">No matching campaign results found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-[#f0f2f5]">
                    <thead>
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Recipient</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Subject</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0f2f5]">
                      {searchResults.map((e: any) => (
                        <tr key={e.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-950">{e.recipient}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">{e.subject}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400 font-semibold">{new Date(e.scheduledAt || e.sentAt).toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-lg ${
                              e.status === 'SENT' 
                                ? 'bg-emerald-50 text-emerald-600'
                                : e.status === 'SCHEDULED'
                                ? 'bg-orange-50 text-orange-600'
                                : 'bg-red-50 text-red-600'
                            }`}>
                              {e.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <Routes>
              <Route path="/" element={<ScheduledTable api={api} />} />
              <Route path="/sent" element={<SentTable api={api} />} />
            </Routes>
          )}
        </main>
      </div>

      {isComposeOpen && (
        <ComposeEmail api={api} onClose={() => setIsComposeOpen(false)} />
      )}
    </div>
  );
}

// Custom Scheduled Table View matching mockup layout
function ScheduledTable({ api }: { api: any }) {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmails = () => {
      api.get('/api/emails/scheduled')
        .then((res: any) => setEmails(res.data.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    };

    fetchEmails();
    const interval = setInterval(fetchEmails, 5000);
    return () => clearInterval(interval);
  }, [api]);

  return (
    <div className="bg-white shadow-[0_4px_20px_rgba(0,0,0,0.02)] rounded-2xl p-6 border border-[#e4e8eb]">
      <h2 className="text-base font-bold mb-4 text-gray-900 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-[#00a854]" />
        Scheduled Outgoing Email Flows
      </h2>
      {loading ? (
        <div className="space-y-4">
          <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
          <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
          <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
        </div>
      ) : emails.length === 0 ? (
        <div className="text-sm text-gray-500 py-16 text-center border-2 border-dashed border-[#e4e8eb] rounded-2xl flex flex-col items-center justify-center gap-2">
          <Mail className="w-8 h-8 text-gray-300" />
          <span>No scheduled campaigns currently pending.</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#f0f2f5]">
            <thead>
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Recipient Address</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Campaign Subject</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Planned Send Date</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f2f5]">
              {emails.map((e: any) => (
                <tr key={e.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{e.recipient}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">{e.subject}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400 font-semibold">{new Date(e.scheduledAt).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-lg bg-orange-50 text-orange-600">
                      {e.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Custom Sent Table View matching mockup layout
function SentTable({ api }: { api: any }) {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmails = () => {
      api.get('/api/emails/sent')
        .then((res: any) => setEmails(res.data.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    };

    fetchEmails();
    const interval = setInterval(fetchEmails, 5000);
    return () => clearInterval(interval);
  }, [api]);

  return (
    <div className="bg-white shadow-[0_4px_20px_rgba(0,0,0,0.02)] rounded-2xl p-6 border border-[#e4e8eb]">
      <h2 className="text-base font-bold mb-4 text-gray-900 flex items-center gap-2">
        <Send className="w-5 h-5 text-[#00a854]" />
        Sent Deliveries Output
      </h2>
      {loading ? (
        <div className="space-y-4">
          <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
          <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
          <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
        </div>
      ) : emails.length === 0 ? (
        <div className="text-sm text-gray-500 py-16 text-center border-2 border-dashed border-[#e4e8eb] rounded-2xl flex flex-col items-center justify-center gap-2">
          <Send className="w-8 h-8 text-gray-300" />
          <span>No emails have been successfully dispatched yet.</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#f0f2f5]">
            <thead>
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Recipient Address</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Campaign Subject</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Dispatched Time</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f2f5]">
              {emails.map((e: any) => (
                <tr key={e.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{e.recipient}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">{e.subject}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400 font-semibold">{new Date(e.sentAt).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-lg bg-emerald-50 text-emerald-600">
                      {e.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs font-bold">
                    {e.previewUrl ? (
                      <a href={e.previewUrl} target="_blank" rel="noopener noreferrer" className="text-[#00a854] hover:underline">
                        View Email ➜
                      </a>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
