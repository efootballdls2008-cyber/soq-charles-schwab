import { useState, useRef, useEffect } from 'react'
import { post } from '../../api/client'
import { ENDPOINTS } from '../../api/endpoints'
import { useAuth } from '../../hooks/useAuth'

interface SupportFormData {
  name: string
  email: string
  subject: string
  message: string
}

export default function SupportWidget() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  const [form, setForm] = useState<SupportFormData>({
    name: user ? `${user.firstName} ${user.lastName}` : '',
    email: user?.email ?? '',
    subject: '',
    message: '',
  })

  // Sync form with user when auth state loads
  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
      }))
    }
  }, [user])

  // Close on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.subject.trim() || !form.message.trim()) {
      setError('Please fill in all required fields.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Use authenticated endpoint if logged in, public endpoint if not
      if (user) {
        await post(ENDPOINTS.supportMessage, {
          subject: form.subject,
          message: form.message,
        })
      } else {
        if (!form.name.trim() || !form.email.trim()) {
          setError('Name and email are required.')
          setLoading(false)
          return
        }
        await post(ENDPOINTS.supportContact, {
          name: form.name,
          email: form.email,
          subject: form.subject,
          message: form.message,
        })
      }

      setSuccess(true)
      setForm(prev => ({ ...prev, subject: '', message: '' }))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send message. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setOpen(false)
    setSuccess(false)
    setError(null)
  }

  const subjects = [
    'Account Issue',
    'Deposit / Withdrawal',
    'Trading Question',
    'Bot Trading',
    'KYC Verification',
    'Technical Problem',
    'Other',
  ]

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => { setOpen(true); setSuccess(false); setError(null) }}
        aria-label="Open support chat"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full shadow-2xl font-semibold text-sm transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
        style={{ background: 'linear-gradient(135deg, #a28539 0%, #c9a84c 100%)', color: '#fff', boxShadow: '0 4px 24px rgba(162,133,57,0.45)' }}
      >
        {/* Chat bubble icon */}
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        Support
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:p-6"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}
        >
          {/* Modal */}
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="support-modal-title"
            className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up"
            style={{ background: '#0d0824', border: '1px solid rgba(162,133,57,0.3)' }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ background: 'linear-gradient(135deg, #1a0f3c 0%, #0d0824 100%)', borderBottom: '1px solid rgba(162,133,57,0.2)' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(162,133,57,0.2)', border: '1px solid rgba(162,133,57,0.4)' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#a28539" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <h2 id="support-modal-title" className="font-bold text-white text-base leading-tight">Support Center</h2>
                  <p className="text-xs mt-0.5" style={{ color: '#a28539' }}>We typically reply within 24 hours</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                aria-label="Close support"
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-white/10 text-gray-400 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-5">
              {success ? (
                /* Success state */
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                    style={{ background: 'rgba(74,222,128,0.15)', border: '2px solid #4ade80' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="#4ade80" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">Message Sent!</h3>
                  <p className="text-gray-400 text-sm mb-6 max-w-xs">
                    Your message has been received. Our support team will get back to you within 24 hours.
                  </p>
                  <button
                    onClick={handleClose}
                    className="px-6 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, #a28539, #c9a84c)' }}
                  >
                    Close
                  </button>
                </div>
              ) : (
                /* Form */
                <form onSubmit={handleSubmit} noValidate>
                  {/* Info banner */}
                  <div
                    className="flex items-start gap-3 rounded-lg px-3 py-2.5 mb-4 text-xs"
                    style={{ background: 'rgba(162,133,57,0.1)', border: '1px solid rgba(162,133,57,0.2)' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="#a28539" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p style={{ color: '#d4b56a' }}>
                      Contact our expert support team. Available 24/7 for all trading and account questions.
                    </p>
                  </div>

                  {/* Name & Email — only for guests */}
                  {!user && (
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                          Name <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={form.name}
                          onChange={handleChange}
                          placeholder="Your name"
                          required
                          className="w-full rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition"
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                          Email <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={form.email}
                          onChange={handleChange}
                          placeholder="your@email.com"
                          required
                          className="w-full rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition"
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Subject */}
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      Subject <span className="text-red-400">*</span>
                    </label>
                    <select
                      name="subject"
                      value={form.subject}
                      onChange={handleChange}
                      required
                      className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 transition"
                      style={{ background: '#1a0f3c', border: '1px solid rgba(255,255,255,0.12)', color: form.subject ? '#fff' : '#6b7280' }}
                    >
                      <option value="" disabled>Select a topic…</option>
                      {subjects.map(s => (
                        <option key={s} value={s} style={{ background: '#1a0f3c', color: '#fff' }}>{s}</option>
                      ))}
                    </select>
                  </div>

                  {/* Message */}
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      Message <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      placeholder="Describe your issue or question in detail…"
                      required
                      rows={4}
                      className="w-full rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition resize-none"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
                    />
                  </div>

                  {/* Error */}
                  {error && (
                    <div
                      className="flex items-center gap-2 rounded-lg px-3 py-2 mb-3 text-xs"
                      style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171' }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {error}
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-lg font-semibold text-sm text-white transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #a28539 0%, #c9a84c 100%)' }}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Sending…
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Footer */}
            <div
              className="px-5 py-3 flex items-center justify-between text-xs"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)', color: '#6b7280' }}
            >
              <span>Charles Schwab Trading Platform</span>
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400" />
                <span>Support Online</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
