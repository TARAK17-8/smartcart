import { useState } from 'react'
import { createShop } from '../api'

const BASE_LAT = 17.6868
const BASE_LNG = 83.2185

const SHOP_TYPES = ['Grocery', 'Supermarket', 'Pharmacy', 'General Store']

export default function AddShopModal({ onClose }) {
  // Basic Info
  const [name, setName] = useState('')
  const [shopType, setShopType] = useState('General Store')
  const [ownerName, setOwnerName] = useState('')
  const [phone, setPhone] = useState('')

  // Location
  const [lat, setLat] = useState((BASE_LAT + (Math.random() - 0.5) * 0.06).toFixed(4))
  const [lng, setLng] = useState((BASE_LNG + (Math.random() - 0.5) * 0.06).toFixed(4))

  // Documents
  const [shopPhoto, setShopPhoto] = useState(null)
  const [shopPhotoPreview, setShopPhotoPreview] = useState(null)
  const [panImage, setPanImage] = useState(null)
  const [panImagePreview, setPanImagePreview] = useState(null)
  const [aadhaarImage, setAadhaarImage] = useState(null)
  const [aadhaarImagePreview, setAadhaarImagePreview] = useState(null)

  // Verification
  const [aadhaarVerifying, setAadhaarVerifying] = useState(false)
  const [aadhaarVerified, setAadhaarVerified] = useState(false)
  const [aadhaarVerificationMsg, setAadhaarVerificationMsg] = useState('')

  // UI State
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1) // 1: Basic Info, 2: Documents, 3: Verification, 4: Success

  // Helper: Convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // Handle file selection
  const handleFileChange = (file, setFile, setPreview) => {
    if (file) {
      setFile(file)
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target.result)
      reader.readAsDataURL(file)
    }
  }

  // Simulate Aadhaar verification
  const handleVerifyAadhaar = async () => {
    if (!aadhaarImage) {
      setAadhaarVerificationMsg('Please upload Aadhaar image first')
      return
    }

    setAadhaarVerifying(true)
    setAadhaarVerificationMsg('Verifying Aadhaar...')

    // Simulate verification delay
    setTimeout(() => {
      setAadhaarVerifying(false)
      setAadhaarVerified(true)
      setAadhaarVerificationMsg('✅ Verification Successful')
    }, 1500)
  }

  // Submit shop with all data
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      if (!name.trim() || !ownerName.trim() || !phone.trim()) {
        throw new Error('Please fill all required fields')
      }

      if (!aadhaarVerified) {
        throw new Error('Please verify Aadhaar before submission')
      }

      // Convert files to base64 URLs
      const shopPhotoUrl = shopPhoto ? await fileToBase64(shopPhoto) : ''
      const panImageUrl = panImage ? await fileToBase64(panImage) : ''
      const aadhaarImageUrl = aadhaarImage ? await fileToBase64(aadhaarImage) : ''

      await createShop({
        name: name.trim(),
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        shop_type: shopType,
        owner_name: ownerName.trim(),
        phone: phone.trim(),
        shop_photo: shopPhotoUrl,
        pan_image: panImageUrl,
        aadhaar_image: aadhaarImageUrl,
      })

      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Failed to create shop')
    } finally {
      setSaving(false)
    }
  }

  const isStep1Complete = name.trim() && ownerName.trim() && phone.trim()
  const isStep2Complete = shopPhoto && panImage && aadhaarImage
  const canSubmit = isStep1Complete && isStep2Complete && aadhaarVerified

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="animate-fade-in-up w-full max-w-md rounded-2xl border border-surface-700 bg-surface-900 shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-surface-700/50 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-lg shadow-lg shadow-emerald-500/20">
                🏬
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Shop Created!</h3>
                <p className="text-[11px] text-surface-500">Awaiting admin approval</p>
              </div>
            </div>
            <button onClick={onClose} className="rounded-lg p-1.5 text-surface-500 transition-colors hover:bg-surface-800 hover:text-white">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="p-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-3xl">
              ✅
            </div>
            <h4 className="text-lg font-bold text-white mb-2">Shop Submitted!</h4>
            <p className="text-sm text-surface-400 mb-4">
              Your shop <span className="font-semibold text-emerald-400">"{name.trim()}"</span> has been submitted for approval.
            </p>
            <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-5 py-4 mb-5">
              <p className="text-xs font-bold uppercase tracking-wider text-yellow-400 mb-2">⏳ Status: Pending</p>
              <p className="text-xs text-yellow-300/80">Your shop is under admin review. You'll be able to login once approved.</p>
            </div>
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 mb-5">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">🔑 Your Credentials</p>
              <div className="flex items-center justify-center gap-3 text-sm">
                <span className="rounded-lg bg-emerald-500/15 px-3 py-1.5 font-mono font-bold text-emerald-300">
                  {name.trim()}
                </span>
              </div>
            </div>
            <p className="text-xs text-surface-500 mb-5">Contact admin for faster approval</p>
            <button
              onClick={onClose}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:brightness-110 active:scale-[0.98]"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="animate-fade-in-up w-full max-w-2xl rounded-2xl border border-surface-700 bg-surface-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-700/50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-lg shadow-lg shadow-emerald-500/20">
              🏬
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Add Your Shop</h3>
              <p className="text-[11px] text-surface-500">Step {step}/3 — Fill all details</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-surface-500 transition-colors hover:bg-surface-800 hover:text-white">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[85vh] overflow-y-auto">
          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-sm text-red-300">
              ❌ {error}
            </div>
          )}

          {/* STEP 1: BASIC INFO */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-emerald-400">📋 Shop Information</h3>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-surface-400">Shop Name <span className="text-red-400">*</span></label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sri Lakshmi Kirana Store"
                className="w-full rounded-xl border border-surface-700 bg-surface-800/50 px-4 py-3 text-sm text-white placeholder-surface-600 outline-none transition-colors focus:border-emerald-500/50"
                autoFocus
              />
              <p className="mt-1 text-[11px] text-surface-600">Your login username & password</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-surface-400">Shop Type <span className="text-red-400">*</span></label>
                <select
                  value={shopType}
                  onChange={(e) => setShopType(e.target.value)}
                  className="w-full rounded-xl border border-surface-700 bg-surface-800/50 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-emerald-500/50"
                >
                  {SHOP_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-surface-400">Owner Name <span className="text-red-400">*</span></label>
                <input
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full rounded-xl border border-surface-700 bg-surface-800/50 px-4 py-3 text-sm text-white placeholder-surface-600 outline-none transition-colors focus:border-emerald-500/50"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-surface-400">Phone Number <span className="text-red-400">*</span></label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile number"
                className="w-full rounded-xl border border-surface-700 bg-surface-800/50 px-4 py-3 text-sm text-white placeholder-surface-600 outline-none transition-colors focus:border-emerald-500/50"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-surface-400">Location <span className="text-surface-600">(auto-detected)</span></label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="number"
                    step="any"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    placeholder="Latitude"
                    className="w-full rounded-lg border border-surface-700 bg-surface-800/50 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-emerald-500/50"
                  />
                  <p className="mt-0.5 text-[10px] text-surface-600">Latitude</p>
                </div>
                <div>
                  <input
                    type="number"
                    step="any"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    placeholder="Longitude"
                    className="w-full rounded-lg border border-surface-700 bg-surface-800/50 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-emerald-500/50"
                  />
                  <p className="mt-0.5 text-[10px] text-surface-600">Longitude</p>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 2: DOCUMENT UPLOADS */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-emerald-400">📷 Documents</h3>
            
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-surface-400">Shop Photo <span className="text-red-400">*</span></label>
              <label className="block cursor-pointer">
                <div className="relative rounded-xl border-2 border-dashed border-surface-700 bg-surface-800/30 p-4 text-center transition-colors hover:border-emerald-500/50 hover:bg-surface-800/50">
                  {shopPhotoPreview ? (
                    <img src={shopPhotoPreview} alt="Shop" className="mx-auto h-20 w-20 rounded-lg object-cover" />
                  ) : (
                    <div className="text-3xl mb-2">📸</div>
                  )}
                  <p className="text-xs text-surface-400">{shopPhotoPreview ? 'Photo uploaded ✓' : 'Click to upload shop photo'}</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files && handleFileChange(e.target.files[0], setShopPhoto, setShopPhotoPreview)}
                  className="hidden"
                />
              </label>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-surface-400">PAN Card <span className="text-red-400">*</span></label>
              <label className="block cursor-pointer">
                <div className="relative rounded-xl border-2 border-dashed border-surface-700 bg-surface-800/30 p-4 text-center transition-colors hover:border-emerald-500/50 hover:bg-surface-800/50">
                  {panImagePreview ? (
                    <img src={panImagePreview} alt="PAN" className="mx-auto h-20 w-20 rounded-lg object-cover" />
                  ) : (
                    <div className="text-3xl mb-2">📄</div>
                  )}
                  <p className="text-xs text-surface-400">{panImagePreview ? 'PAN uploaded ✓' : 'Click to upload PAN card'}</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files && handleFileChange(e.target.files[0], setPanImage, setPanImagePreview)}
                  className="hidden"
                />
              </label>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-surface-400">Aadhaar Card <span className="text-red-400">*</span></label>
              <label className="block cursor-pointer">
                <div className="relative rounded-xl border-2 border-dashed border-surface-700 bg-surface-800/30 p-4 text-center transition-colors hover:border-emerald-500/50 hover:bg-surface-800/50">
                  {aadhaarImagePreview ? (
                    <img src={aadhaarImagePreview} alt="Aadhaar" className="mx-auto h-20 w-20 rounded-lg object-cover" />
                  ) : (
                    <div className="text-3xl mb-2">🆔</div>
                  )}
                  <p className="text-xs text-surface-400">{aadhaarImagePreview ? 'Aadhaar uploaded ✓' : 'Click to upload Aadhaar'}</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files && handleFileChange(e.target.files[0], setAadhaarImage, setAadhaarImagePreview)}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* STEP 3: AADHAAR VERIFICATION */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-emerald-400">✔️ Verification</h3>
            
            {aadhaarVerified ? (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">✅</span>
                  <div>
                    <p className="text-sm font-bold text-emerald-300">Verification Successful</p>
                    <p className="text-xs text-emerald-300/70">Your Aadhaar has been verified</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-surface-700 bg-surface-800/30 px-5 py-4">
                <p className="text-sm text-surface-300 mb-3">Verify your Aadhaar to proceed:</p>
                <button
                  type="button"
                  onClick={handleVerifyAadhaar}
                  disabled={!aadhaarImage || aadhaarVerifying}
                  className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2.5 text-sm font-bold text-white transition-all hover:brightness-110 disabled:opacity-50"
                >
                  {aadhaarVerifying ? '⏳ Verifying...' : '🔐 Verify Aadhaar'}
                </button>
                {aadhaarVerificationMsg && (
                  <p className="mt-2 text-xs text-center text-surface-400">{aadhaarVerificationMsg}</p>
                )}
              </div>
            )}
          </div>

          {/* Progress */}
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  s === 1 && isStep1Complete
                    ? 'bg-emerald-500'
                    : s === 2 && isStep2Complete
                      ? 'bg-emerald-500'
                      : s === 3 && aadhaarVerified
                        ? 'bg-emerald-500'
                        : 'bg-surface-700'
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-5 py-2.5 text-sm font-medium text-surface-400 transition-colors hover:bg-surface-800 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !canSubmit}
              className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:brightness-110 active:scale-[0.97] disabled:opacity-50"
            >
              {saving ? '⏳ Submitting...' : '✅ Submit Shop'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
