import React, { useState } from 'react';

interface CustomDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomDomainModal: React.FC<CustomDomainModalProps> = ({ isOpen, onClose }) => {
  const [domainInput, setDomainInput] = useState('khata.yourdomain.in');
  const [copied, setCopied] = useState(false);
  const [verified, setVerified] = useState(true);

  if (!isOpen) return null;

  const dnsRecords = [
    { type: 'CNAME', host: 'khata', target: 'cname.voicekhata.in', ttl: '3600' },
    { type: 'TXT', host: '_voicekhata-challenge', target: 'vk-verify=89f41b2a9', ttl: '300' }
  ];

  const handleCopyConfig = () => {
    const raw = `khata 3600 IN CNAME cname.voicekhata.in.\n_voicekhata-challenge 300 IN TXT "vk-verify=89f41b2a9"`;
    navigator.clipboard.writeText(raw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCname = () => {
    const blob = new Blob([domainInput], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'CNAME';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="w-full max-w-xl border border-[#2D2D2A] bg-[#141413] shadow-2xl p-6 text-[#F4F1EA]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[#232320] font-mono-tech text-sm">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 bg-[#C88A2B] inline-block" />
            <span className="font-bold text-[#F4F1EA]">
              [PRODUCTION_CUSTOM_DOMAIN_CONFIG]
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#8E8A82] hover:text-[#F4F1EA] text-xs font-bold"
          >
            [CLOSE]
          </button>
        </div>

        {/* Domain Input Field */}
        <div className="mb-4 font-mono-tech">
          <label className="text-xs text-[#8E8A82] block mb-1.5 font-bold">
            TARGET PRODUCTION DOMAIN / FQDN:
          </label>
          <div className="flex items-center gap-2.5">
            <input
              type="text"
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              className="mech-input flex-1 text-sm py-2"
            />
            <button
              type="button"
              onClick={() => setVerified(true)}
              className="mech-btn mech-btn-brass text-xs font-bold"
            >
              [VERIFY_DNS]
            </button>
          </div>
        </div>

        {/* Status Box */}
        <div className="p-3.5 bg-[#1A1A18] border border-[#262624] mb-4 font-mono-tech text-xs sm:text-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[#8E8A82]">DNS RESOLUTION STATUS:</span>
            <span className="text-[#2DB84D] font-bold">
              {verified ? '[ACTIVE: 200 OK]' : '[PENDING PROPAGATION]'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#8E8A82]">TLS / SSL STATUS:</span>
            <span className="text-[#2DB84D] font-bold">[ECDSA SECURE // TLS 1.3]</span>
          </div>
          <div className="text-xs text-[#575550] mt-1.5 pt-1.5 border-t border-[#232320]">
            Canonical Origin: https://{domainInput}/
          </div>
        </div>

        {/* DNS Records Table */}
        <div className="mb-4 font-mono-tech text-xs">
          <span className="text-xs text-[#8E8A82] block mb-2 font-bold">
            REQUIRED DNS ZONE ENTRIES (BIND / CLOUDFLARE FORMAT):
          </span>
          <div className="border border-[#262624] overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1C1C1A] text-[#8E8A82] border-b border-[#262624]">
                <tr>
                  <th className="p-2.5">TYPE</th>
                  <th className="p-2.5">HOST</th>
                  <th className="p-2.5">TARGET</th>
                  <th className="p-2.5">TTL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#232320]">
                {dnsRecords.map((r, idx) => (
                  <tr key={idx} className="bg-[#141413]">
                    <td className="p-2.5 font-bold text-[#C88A2B]">{r.type}</td>
                    <td className="p-2.5">{r.host}</td>
                    <td className="p-2.5 text-[#A8A49C]">{r.target}</td>
                    <td className="p-2.5 text-[#575550]">{r.ttl}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3.5 border-t border-[#232320] font-mono-tech">
          <button
            type="button"
            onClick={handleDownloadCname}
            className="mech-btn mech-btn-light text-xs font-bold"
          >
            [DOWNLOAD_CNAME_FILE]
          </button>
          <button
            type="button"
            onClick={handleCopyConfig}
            className="mech-btn mech-btn-primary text-xs font-bold"
          >
            {copied ? '[COPIED_TO_CLIPBOARD]' : '[COPY_ZONE_RECORDS]'}
          </button>
        </div>
      </div>
    </div>
  );
};
