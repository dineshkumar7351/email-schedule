import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { X, Upload, Bold, Italic, Link, List, AlignLeft, Image as ImageIcon, ArrowLeft, Paperclip, Clock, Calendar } from 'lucide-react';

export default function ComposeEmail({ api, onClose }: { api: any, onClose: () => void }) {
  const [senders, setSenders] = useState([]);
  const [recipients, setRecipients] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);

  // Send Later Popover States
  const [isSendLaterOpen, setIsSendLaterOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string>(() => {
    return new Date().toISOString().slice(0, 16);
  });
  const [tempTime, setTempTime] = useState<string>(selectedTime);

  useEffect(() => {
    api.get('/api/senders').then((res: any) => setSenders(res.data.data));
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const emails = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi) || [];
        const uniqueEmails = Array.from(new Set(emails));
        setRecipients(uniqueEmails);
        toast.success(`Detected ${uniqueEmails.length} email addresses`);
      };
      reader.readAsText(file);
    }
  };

  const getTomorrowPreset = (hours: number, minutes: number = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(hours, minutes, 0, 0);
    return d.toISOString().slice(0, 16);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData);
    
    let finalRecipients = recipients;
    if (!file) {
      const toValue = (data.to as string) || '';
      const emails = toValue.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi) || [];
      finalRecipients = Array.from(new Set(emails));
    }

    if (finalRecipients.length === 0) {
      toast.error('No valid recipients found. Please type email(s) or upload a list.');
      return;
    }

    try {
      let senderId = '';
      const matched = senders.find((s: any) => s.email === data.senderEmail);
      if (matched) {
        senderId = (matched as any).id;
      } else {
        toast.loading('Registering custom sender email account...', { id: 'sender-reg' });
        const res = await api.post('/api/senders', {
          email: data.senderEmail,
          displayName: `${data.senderEmail}`
        });
        senderId = res.data.data.id;
        toast.dismiss('sender-reg');
      }

      await api.post('/api/emails/schedule', {
        senderId,
        subject: data.subject,
        body: data.body,
        recipients: finalRecipients,
        startTime: new Date(selectedTime).toISOString(),
        delayMs: Number(data.delayMs) * 1000, 
        hourlyLimit: Number(data.hourlyLimit)
      });
      toast.success('Emails scheduled successfully');
      onClose();
    } catch (err: any) {
      toast.dismiss('sender-reg');
      toast.error(err.response?.data?.message || 'Email scheduling failed');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.1)] w-full max-w-4xl flex flex-col max-h-[92vh] border border-[#e4e8eb] overflow-hidden relative">
        
        {/* Top Header matching Figma mockup */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0f2f5] bg-white">
          <div className="flex items-center gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              className="text-gray-600 hover:text-gray-900 transition-colors p-1 hover:bg-gray-100 rounded-lg cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-sm font-bold text-gray-900">Compose New Email</h2>
          </div>

          <div className="flex items-center gap-4 relative">
            <button type="button" className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
              <Paperclip className="w-5 h-5" />
            </button>
            
            {/* Clock icon to trigger Send Later popover */}
            <button 
              type="button" 
              onClick={() => {
                setTempTime(selectedTime);
                setIsSendLaterOpen(!isSendLaterOpen);
              }}
              className={`transition-colors cursor-pointer ${isSendLaterOpen ? 'text-[#00a854]' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Clock className="w-5 h-5" />
            </button>

            {/* Main Submit/Send button in the header */}
            <button
              onClick={(e) => {
                const form = document.getElementById('compose-form') as HTMLFormElement;
                if (form) form.requestSubmit();
              }}
              className="px-6 py-2 border border-[#00a854] text-[#00a854] hover:bg-[#00a854] hover:text-white font-semibold rounded-full text-xs transition-all cursor-pointer"
            >
              Send
            </button>

            {/* Send Later Popover matching screenshot */}
            {isSendLaterOpen && (
              <div className="absolute right-0 top-12 w-[280px] bg-white border border-[#e4e8eb] rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-4 z-50 space-y-4">
                <h3 className="text-xs font-bold text-gray-900">Send Later</h3>
                
                {/* Date Picker Input */}
                <div className="relative">
                  <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="datetime-local" 
                    value={tempTime}
                    onChange={(e) => setTempTime(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-[#f4f6f8] border border-transparent rounded-xl focus:border-[#00a854] focus:bg-white focus:outline-none transition-all text-xs text-gray-900 font-semibold cursor-pointer"
                  />
                </div>

                {/* Presets List */}
                <div className="space-y-1">
                  <button 
                    type="button"
                    onClick={() => setTempTime(getTomorrowPreset(9, 0))}
                    className="w-full text-left px-3 py-2 hover:bg-[#f4f6f8] rounded-lg text-xs font-semibold text-gray-700 transition-colors"
                  >
                    Tomorrow
                  </button>
                  <button 
                    type="button"
                    onClick={() => setTempTime(getTomorrowPreset(10, 0))}
                    className="w-full text-left px-3 py-2 hover:bg-[#f4f6f8] rounded-lg text-xs font-semibold text-gray-700 transition-colors"
                  >
                    Tomorrow, 10:00 AM
                  </button>
                  <button 
                    type="button"
                    onClick={() => setTempTime(getTomorrowPreset(11, 0))}
                    className="w-full text-left px-3 py-2 hover:bg-[#f4f6f8] rounded-lg text-xs font-semibold text-gray-700 transition-colors"
                  >
                    Tomorrow, 11:00 AM
                  </button>
                  <button 
                    type="button"
                    onClick={() => setTempTime(getTomorrowPreset(15, 0))}
                    className="w-full text-left px-3 py-2 hover:bg-[#f4f6f8] rounded-lg text-xs font-semibold text-gray-700 transition-colors"
                  >
                    Tomorrow, 3:00 PM
                  </button>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between border-t border-[#f0f2f5] pt-3">
                  <button 
                    type="button"
                    onClick={() => setIsSendLaterOpen(false)}
                    className="text-xs font-bold text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setSelectedTime(tempTime);
                      setIsSendLaterOpen(false);
                      toast.info(`Scheduled for: ${new Date(tempTime).toLocaleString()}`);
                    }}
                    className="px-4 py-1.5 border border-[#00a854] text-[#00a854] hover:bg-[#00a854] hover:text-white rounded-full text-xs font-bold transition-all"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Form */}
        <form id="compose-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* Sender Autocomplete Input */}
          <div className="flex items-center gap-4 border-b border-[#f0f2f5] pb-3">
            <label className="w-24 text-xs font-bold text-gray-500">From:</label>
            <input 
              type="email"
              name="senderEmail"
              required
              list="sender-list"
              placeholder="sender@example.com"
              defaultValue={senders.find((s: any) => s.email === 'dinesk735100@gmail.com')?.email || (senders[0] as any)?.email || ''}
              className="flex-1 px-3 py-2 bg-[#f4f6f8] border border-transparent focus:border-[#00a854] focus:bg-white focus:outline-none rounded-xl transition-all text-xs font-semibold text-gray-900" 
            />
            <datalist id="sender-list">
              {senders.map((s: any) => (
                <option key={s.id} value={s.email}>{s.displayName}</option>
              ))}
            </datalist>
          </div>

          {/* Recipients / File Upload */}
          <div className="flex items-center gap-4 border-b border-[#f0f2f5] pb-3">
            <label className="w-24 text-xs font-bold text-gray-500">To:</label>
            <div className="flex-1 flex items-center gap-3">
              <input 
                type="text"
                name="to"
                placeholder="recipient@example.com"
                disabled={!!file}
                required={!file}
                className="flex-1 px-3 py-2 bg-[#f4f6f8] border border-transparent focus:border-[#00a854] focus:bg-white focus:outline-none rounded-xl transition-all text-xs font-semibold text-gray-900 disabled:opacity-50"
              />
              <label className="flex items-center gap-2 px-3 py-2 bg-[#f4f6f8] hover:bg-gray-100 rounded-xl cursor-pointer text-xs font-bold text-gray-700 transition-colors shrink-0">
                <Upload className="w-4 h-4 text-[#00a854]" />
                Upload CSV/TXT List
                <input type="file" accept=".csv,.txt" className="hidden" onChange={handleFileUpload} />
              </label>
              {file && recipients.length > 0 && (
                <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg shrink-0">
                  ✓ {recipients.length} emails detected
                </span>
              )}
            </div>
          </div>

          {/* Subject */}
          <div className="flex items-center gap-4 border-b border-[#f0f2f5] pb-3">
            <label className="w-24 text-xs font-bold text-gray-500">Subject:</label>
            <input 
              type="text" 
              name="subject" 
              required 
              placeholder="Subject"
              className="flex-1 px-3 py-2 bg-[#f4f6f8] border border-transparent focus:border-[#00a854] focus:bg-white focus:outline-none rounded-xl transition-all text-xs font-semibold text-gray-900" 
            />
          </div>

          {/* Configuration Parameters */}
          <div className="flex flex-wrap items-center gap-6 pt-2 pb-4 border-b border-[#f0f2f5]">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-gray-500">Delay between 2 emails</label>
              <input 
                type="number" 
                name="delayMs" 
                required 
                min="0" 
                defaultValue="2" 
                placeholder="00"
                className="w-16 px-3 py-2 bg-[#f4f6f8] border border-transparent focus:border-[#00a854] focus:bg-white focus:outline-none rounded-xl text-center text-xs font-semibold text-gray-900" 
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-gray-500">Hourly Limit</label>
              <input 
                type="number" 
                name="hourlyLimit" 
                required 
                min="1" 
                defaultValue="200" 
                placeholder="00"
                className="w-16 px-3 py-2 bg-[#f4f6f8] border border-transparent focus:border-[#00a854] focus:bg-white focus:outline-none rounded-xl text-center text-xs font-semibold text-gray-900" 
              />
            </div>
            
            {/* Show dynamic schedule time badge */}
            <div className="text-xs font-semibold text-gray-400 ml-auto">
              Schedule: <span className="text-[#00a854] font-bold">{new Date(selectedTime).toLocaleString()}</span>
            </div>
          </div>

          {/* Email Body & Rich Editor Toolbar */}
          <div className="space-y-2">
            <div className="border border-[#e4e8eb] rounded-2xl overflow-hidden flex flex-col">
              
              <div className="bg-[#fafbfc] px-4 py-2 border-b border-[#e4e8eb] text-xs font-bold text-gray-500">
                Type Your Reply...
              </div>

              {/* Rich text editing toolbar style */}
              <div className="bg-[#fafbfc] border-b border-[#e4e8eb] px-4 py-2 flex items-center gap-2">
                <button type="button" className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 cursor-pointer transition-colors"><Bold className="w-3.5 h-3.5" /></button>
                <button type="button" className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 cursor-pointer transition-colors"><Italic className="w-3.5 h-3.5" /></button>
                <button type="button" className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 cursor-pointer transition-colors"><Link className="w-3.5 h-3.5" /></button>
                <button type="button" className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 cursor-pointer transition-colors"><List className="w-3.5 h-3.5" /></button>
                <button type="button" className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 cursor-pointer transition-colors"><AlignLeft className="w-3.5 h-3.5" /></button>
                <div className="h-4 w-[1px] bg-gray-300 mx-1" />
                <button type="button" className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 cursor-pointer transition-colors"><ImageIcon className="w-3.5 h-3.5" /></button>
              </div>

              <textarea 
                name="body" 
                required 
                rows={10} 
                placeholder="Type your email content here..."
                className="w-full p-4 border-0 focus:outline-none focus:ring-0 text-xs font-medium text-gray-900 bg-white placeholder-gray-400"
              />
            </div>
          </div>

          {/* Bottom actions mockup */}
          <div className="flex items-center justify-between pt-4">
            <div className="flex gap-2">
              <div className="flex items-center gap-1 bg-[#f4f6f8] px-3 py-1.5 rounded-lg text-[10px] font-bold text-gray-500">
                <ImageIcon className="w-3.5 h-3.5 text-[#00a854]" />
                image_asset_04.jpg
              </div>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
