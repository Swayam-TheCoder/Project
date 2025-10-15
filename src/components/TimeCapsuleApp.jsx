import React, { useState, useEffect, useRef } from "react";

const LS_KEY = "timecapsules:v1";

function loadCapsules() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveCapsules(list) {
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

function formatRemaining(ms) {
  if (ms <= 0) return { unlocked: true, text: "Unlocked!" };
  const sec = Math.floor(ms / 1000) % 60;
  const min = Math.floor(ms / (1000 * 60)) % 60;
  const hrs = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  return { unlocked: false, text: `${days}d ${hrs}h ${min}m ${sec}s` };
}

export default function TimeCapsuleApp() {
  const [capsules, setCapsules] = useState(loadCapsules);
  const [now, setNow] = useState(Date.now());
  const [selectedFile, setSelectedFile] = useState(null);
  const [unlockDate, setUnlockDate] = useState("");
  const [message, setMessage] = useState("");

  const fileInputRef = useRef(null);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Save capsules to localStorage
  useEffect(() => saveCapsules(capsules), [capsules]);

  const onFileChange = (e) => setSelectedFile(e.target.files?.[0]);

  const createCapsule = () => {
    if (!selectedFile) return setMessage("No file selected.");
    if (!unlockDate) return setMessage("Select an unlock date.");

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const capsule = {
        filename: selectedFile.name,
        unlockDate,
        dataUrl,
        createdAt: new Date().toISOString(),
      };
      setCapsules((prev) => [capsule, ...prev]);
      setSelectedFile(null);
      setUnlockDate("");
      setMessage("Capsule created!");
    };
    reader.readAsDataURL(selectedFile);
  };

  const removeCapsule = (index) =>
    setCapsules((prev) => prev.filter((_, i) => i !== index));

  const shareLink = (c) => {
    const url = new URL(window.location.href);
    url.searchParams.set("name", c.filename);
    url.searchParams.set("unlock", c.unlockDate);
    return url.toString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-slate-100 p-6">
      <header className="max-w-3xl mx-auto mb-6">
        <h1 className="text-3xl font-bold">⏳ Time Capsule dApp (Local)</h1>
      </header>

      <main className="max-w-3xl mx-auto space-y-6">
        {/* Upload section */}
        <section className="bg-white/5 p-6 rounded-lg border border-white/6">
          <h2 className="font-semibold mb-3">Create Capsule</h2>

          <div className="mb-3">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={onFileChange}
            />
            <button
              className="px-3 py-2 rounded bg-violet-500 text-black"
              onClick={() => fileInputRef.current?.click()}
            >
              Select File
            </button>
            <span className="ml-2">
              {selectedFile ? selectedFile.name : "No file selected"}
            </span>
          </div>

          <input
            type="datetime-local"
            value={unlockDate}
            onChange={(e) => setUnlockDate(e.target.value)}
            className="w-full mb-3 p-2 rounded bg-slate-900"
          />

          <button
            onClick={createCapsule}
            className="px-4 py-2 rounded bg-cyan-500 text-black font-semibold"
          >
            Create Capsule
          </button>

          {message && (
            <div className="mt-2 text-sm text-slate-300">{message}</div>
          )}
        </section>

        {/* Capsules list */}
        <section className="bg-white/5 p-6 rounded-lg border border-white/6">
          <h2 className="font-semibold mb-4">Your Capsules</h2>
          {capsules.length === 0 && <p>No capsules yet.</p>}

          <div className="space-y-3">
            {capsules.map((c, i) => {
              const diff = new Date(c.unlockDate).getTime() - now;
              const fmt = formatRemaining(diff);
              return (
                <div
                  key={i}
                  className="p-3 bg-white/3 rounded flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">{c.filename}</p>
                    <p className="text-xs text-slate-300">
                      Unlocks: {new Date(c.unlockDate).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="font-mono">{fmt.text}</div>
                    <div className="flex gap-2">
                      {fmt.unlocked ? (
                        <a
                          className="px-3 py-1 bg-emerald-500 text-black rounded"
                          href={c.dataUrl}
                          download={c.filename}
                        >
                          Open
                        </a>
                      ) : (
                        <button
                          className="px-3 py-1 bg-slate-700 text-sm rounded"
                          disabled
                        >
                          Locked
                        </button>
                      )}
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(shareLink(c));
                          setMessage("Share link copied");
                        }}
                        className="px-3 py-1 bg-violet-500 text-black rounded text-sm"
                      >
                        Share
                      </button>
                      <button
                        onClick={() => removeCapsule(i)}
                        className="px-3 py-1 bg-red-600 text-black rounded text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
